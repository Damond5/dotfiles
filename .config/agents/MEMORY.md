# Memory

## Deciding What To Build

- When the user says a feature is small, build it on a throwaway branch rather than recommending it be deferred pending more evidence. They treat a scrappable branch as cheaper than an extended design debate, and answer a "let's wait and see" recommendation by asking for the implementation instead.

## Designing For Easy Removal

- For in-house tooling that a vendor might later ship natively, the user treats a small removal surface as a design requirement, not a nice-to-have: opt-in rather than on by default, few touch points, deletable in one commit. They will drop a feature's scope — organizational memory, in one case — specifically to keep that surface small, so propose the narrow version first and say what deprecating it would cost.

## Packaging Work Into Commits
- The user wants incidental fixes found while building a feature split into their own commits, separate from the feature, and will say so mid-task expecting it to be held until the commit-message stage — so track which hunks belong to which commit as the work happens, including when two of them land in the same function of the same file.

## CodeRabbit Review Threads
- The user reviews merge requests with CodeRabbit and wants every comment addressed, nitpicks included, rather than triaged for significance. Where a comment is not applied as written, they want a reply posted on that thread explaining why; the rest are left for CodeRabbit to pick up from the pushed commits and close itself.

## Drafting Customer Email

- The user negotiates interface details directly with the customer's automation contractor over email and writes those mails themselves, so expect requests to draft or update a reply in an existing thread; match the structure and notation of their own earlier mails in that thread rather than imposing a new format, and keep proposed values flagged as assumptions until the contractor confirms them.
- Their mail client appends a signature automatically as a tracked HTML block, so a prepared draft must end with the body text and no hand-written sign-off, which would otherwise appear twice.

## Arch Workstation Sudo And SSH Prompts

- On the user's Arch workstation, `sudo` has no way to prompt during a tool call, so `paru -S` and anything else needing root fails with "a terminal is required to read the password". Treat a missing package as a fixed constraint to work around, not something to install — `sshpass`, for one, is absent and cannot be added.
- Password-authenticated `ssh`/`scp` from that workstation works by pointing `SSH_ASKPASS` at an executable helper script, setting `SSH_ASKPASS_REQUIRE=force`, and wrapping the call in `setsid -w`. On the far end, a `sudo` that must run without a tty needs `SUDO_ASKPASS` exported plus one `sudo -A -v` to prime the timestamp.

## Recall Engine Invocation

- The memory engine is a command-line program installed at `~/.claude/tools/memory/memory.py`, serving whichever root it is pointed at. Options come *after* the subcommand — `memory.py search --root <path> "query"`, likewise `index` — because it parses flags only from the arguments following the command. Reversing them makes the flag itself the command; as of 2026-09-02 that prints a usage line on stderr and exits 2, so an empty result with no message can be trusted to mean no memories matched.
- `~/.claude/tools/memory` is a symlink to `~/workspace/memory/global/tools/memory`, so a plain `find ~/.claude -name memory.py` does not descend into it and wrongly reports the engine missing. Invoke the recorded path directly, or pass `find -L`, rather than concluding from a failed search that recall is unavailable.
