#!/usr/bin/env python3
"""PreToolUse hook for Bash: deny commands that write files, so Claude uses Read/Edit/Write instead.

Blocks sed -i / perl -i, tee to a file, > / >> redirects to a file, and python/node scripts that
open files for writing. Redirects and tee targets under /dev/ or /tmp/ stay allowed (logs, scratch).
Commands passed to `bash -c` / `sh -lc` (e.g. via distrobox) are checked recursively.
Unparseable commands are allowed rather than guessed at.
"""
import json
import re
import shlex
import sys

ALLOWED_PREFIXES = ("/dev/", "/tmp/")
REDIRECTS = {">", ">>", ">|", "&>", "&>>"}
SEPARATORS = {";", "&&", "||", "|", "&", "(", ")", "|&"}
INTERPRETERS = {"python", "python3", "node", "perl", "ruby"}
SCRIPT_WRITE = re.compile(
    r"""open\([^)]*['"][rwax]?[wax]\+?b?['"]|\.write_text\(|\.write_bytes\(|writeFileSync|appendFileSync"""
)
HEREDOC = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1")


def split_heredocs(cmd):
    """Return (shell text without heredoc bodies, concatenated heredoc bodies)."""
    shell, bodies, pending = [], [], []
    for line in cmd.split("\n"):
        if pending:
            if line.strip() == pending[0]:
                pending.pop(0)
            else:
                bodies.append(line)
            continue
        shell.append(line)
        pending = [m.group(2) for m in HEREDOC.finditer(line)]
    return "\n".join(shell), "\n".join(bodies)


def tokenize(text):
    lex = shlex.shlex(text.replace("\n", " ; "), posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    return list(lex)


def allowed_target(target):
    return target.startswith(ALLOWED_PREFIXES) or target.startswith("&") or target.isdigit()


def violation(cmd, depth=0):
    shell, bodies = split_heredocs(cmd)
    try:
        tokens = tokenize(shell)
    except ValueError:
        return None

    segment_start = True
    command = None
    shell_seen = False
    for i, tok in enumerate(tokens):
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        if tok in SEPARATORS:
            segment_start, command, shell_seen = True, None, False
            continue
        shell_seen = shell_seen or tok.rsplit("/", 1)[-1] in {"bash", "sh", "zsh"}
        if segment_start and not re.match(r"^\w+=", tok) and tok not in {"sudo", "env", "command"}:
            command = tok.rsplit("/", 1)[-1]
            segment_start = False

        if tok in REDIRECTS and nxt and not allowed_target(nxt):
            return f"redirect `{tok} {nxt}`"
        if command in {"sed", "perl"} and re.match(r"^(-[A-Za-z]*i|--in-place)", tok):
            return f"`{command} {tok}` (in-place edit)"
        if command == "tee" and tok != "tee" and not tok.startswith("-") and not allowed_target(tok):
            return f"`tee {tok}`"
        if depth < 3 and re.match(r"^-[A-Za-z]*c$", tok) and nxt and shell_seen:
            nested = violation(nxt, depth + 1)
            if nested:
                return nested

    uses_interpreter = any(t.rsplit("/", 1)[-1] in INTERPRETERS for t in tokens)
    if uses_interpreter and SCRIPT_WRITE.search(shell + "\n" + bodies):
        return "script that opens a file for writing"
    return None


def main():
    data = json.load(sys.stdin)
    reason = violation(data.get("tool_input", {}).get("command", ""))
    if reason:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    f"Blocked: this Bash command writes files ({reason}). Per the user's CLAUDE.md, "
                    "use the Read, Edit and Write tools to modify files. Bash is only for search, "
                    "inspection and data pipelines (writing to /tmp/ or /dev/ is allowed)."
                ),
            }
        }))


if __name__ == "__main__":
    main()
