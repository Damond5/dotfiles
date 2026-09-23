# Memory

## Deciding What To Build

- When the user says a feature is small, build it on a throwaway branch rather than recommending it be deferred pending more evidence. They treat a scrappable branch as cheaper than an extended design debate, and answer a "let's wait and see" recommendation by asking for the implementation instead.

## Designing For Easy Removal

- For in-house tooling that a vendor might later ship natively, the user treats a small removal surface as a design requirement, not a nice-to-have: opt-in rather than on by default, few touch points, deletable in one commit. They will drop a feature's scope — organizational memory, in one case — specifically to keep that surface small, so propose the narrow version first and say what deprecating it would cost.

## Packaging Work Into Commits
- The user wants incidental fixes found while building a feature split into their own commits, separate from the feature, and will say so mid-task expecting it to be held until the commit-message stage — so track which hunks belong to which commit as the work happens, including when two of them land in the same function of the same file.

## CodeRabbit Review Threads
- The user reviews merge requests with CodeRabbit and wants every comment addressed, nitpicks included, rather than triaged for significance. Where a comment is not applied as written, draft a reply explaining why — but never post it, or any other note, reply, resolve or MR edit, without the user asking for that specific post in that message. Posting under their name without being asked is not acceptable to them, and a standing preference about reply *content* is never permission to publish. Drafts go in the terminal; the user decides what reaches GitLab.

## Drafting Customer Email

- The user negotiates interface details directly with the customer's automation contractor over email and writes those mails themselves, so expect requests to draft or update a reply in an existing thread; match the structure and notation of their own earlier mails in that thread rather than imposing a new format, and keep proposed values flagged as assumptions until the contractor confirms them.
- Their mail client appends a signature automatically as a tracked HTML block, so a prepared draft must end with the body text and no hand-written sign-off, which would otherwise appear twice.

## Arch Workstation Missing Tools, Sudo And SSH Prompts

- On the user's Arch workstation, `sudo` has no way to prompt during a tool call, so `paru -S` and anything else needing root fails with "a terminal is required to read the password". Treat a missing package as a fixed constraint to work around, not something to install — `sshpass`, for one, is absent and cannot be added.
- `jq` is listed in the desktop section of the user's `~/.install` script (added 2026-09-23) but was not yet installed on their Arch workstation host at that point. Check `command -v jq` before relying on it in a hook or shell pipeline, and fall back to `python3` (at `/usr/bin/python3`) for JSON parsing if it is missing.
- Password-authenticated `ssh`/`scp` from that workstation works by pointing `SSH_ASKPASS` at an executable helper script, setting `SSH_ASKPASS_REQUIRE=force`, and wrapping the call in `setsid -w`. On the far end, a `sudo` that must run without a tty needs `SUDO_ASKPASS` exported plus one `sudo -A -v` to prime the timestamp.

## Mimic memory-nicky Branch
- In the Mimic repo (`gitlab.com/nordbo-robotics/products/mimic/mimic`) the project `MEMORY.md` is tracked only on the user's personal `memory-nicky` branch; feature branches carry it as an untracked file. When checking out a feature branch, keep the working-copy `MEMORY.md` from `memory-nicky` intact. When the user asks for a memory commit, it goes to `memory-nicky`, not the feature branch, with a message of the form `<MR subject> memory` (e.g. `move robot home after each execution memory`); committing through a temporary `git worktree` leaves the checked-out feature branch untouched.

## Claude Code Command Isolation
- Since 2026-09-23 the user runs Claude Code with the Bash sandbox off (`sandbox.enabled: false`) and `permissions.blockReadsOutsideWorkingDirectories: false` in `~/.claude/settings.json`. `distrobox enter`, git over SSH, home-folder reads and the memory engine's socket all run as plain commands with no approval, so never reach for `dangerouslyDisableSandbox`. They turned both off because sandbox escapes, and commands the shell parser could not analyze under the read block, made them approve routine work all session.

## Bash File-Write Blocking Hook
- Since 2026-09-23 a PreToolUse hook on Bash, `~/.claude/hooks/block-bash-file-writes.py` (registered in `~/.claude/settings.json`), denies Bash commands that write files: `sed -i`/`perl -i`, `tee` or `>`/`>>` into any path outside `/tmp/` and `/dev/`, and python/node/perl scripts that open a file for writing, including commands nested in `bash -c` / `distrobox ... bash -lc`. A denial from it means switch to Read/Edit/Write; never rephrase the command (e.g. via `cp`, `mv`, `dd`, which it does not catch) to get the same write past it. The user added it after a Python heredoc was used to resolve rebase conflicts despite their rule against Bash file edits, which auto mode's "Bash edits are fine" guidance does not override.

## Recall Engine Invocation

- The memory engine is a command-line program installed at `~/.claude/tools/memory/memory.py`, serving whichever root it is pointed at. Options come *after* the subcommand — `memory.py search --root <path> "query"`, likewise `index` — because it parses flags only from the arguments following the command. Reversing them makes the flag itself the command; as of 2026-09-02 that prints a usage line on stderr and exits 2, so an empty result with no message can be trusted to mean no memories matched.
- The engine reaches its worker over a Unix domain socket, which the Bash sandbox denies whenever it is enabled. A `search` or `index` run inside it dies with a traceback ending in `socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)`, and the very first call may instead report the script itself as missing. Either symptom usually means the sandbox blocked the call, not that the engine is broken or absent — distinct from the flag-order failure above, which prints a usage line.
- A traceback is not by itself proof of the sandbox. On 2026-09-17, with sandboxing explicitly disabled, the first of four back-to-back `search` calls — issued immediately after the target `MEMORY.md` had been edited — died inside `request_worker`/`send_request`, while the three queries after it and a standalone retry of that same query all succeeded. Retry a failed search once before drawing any conclusion about the cause.
- `~/.claude/tools/memory` is a symlink to `~/workspace/memory/global/tools/memory`, so a plain `find ~/.claude -name memory.py` does not descend into it and wrongly reports the engine missing. Invoke the recorded path directly, or pass `find -L`, rather than concluding from a failed search that recall is unavailable.

## Gauging Performance Before It Reaches Site

- Nicky's dev workstation has 24 cores, more than the site machines he deploys to, so a wall-clock benchmark measured on it overstates real on-site speed. The trap is replacing already-parallel code: the old implementation saturates both machines and makes them look equally fast, so the measured speedup silently assumes the dev box's core count — that produced a 35% optimistic projection on 2026-09-17. Scale the number before quoting it, and label it a projection until the deployed logs confirm it.

## Oversized Connector Results

- A tool result past the context cap is not truncated but written to a file under `~/.claude/projects/<project>/<session>/tool-results/`, and that directory sits outside the sandbox's read allowlist, so when the Bash sandbox is enabled, opening it from a sandboxed command fails as if the file did not exist.
- Messages from the Gmail connector's `get_thread` carry their text in `plaintextBody`, camelCase. Reading a snake_case `plaintext_body` returns an empty string for every message rather than raising, which looks exactly like a thread whose messages have no content — check one message's keys before concluding a search over a thread found nothing.