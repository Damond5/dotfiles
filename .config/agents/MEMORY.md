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
- The GitLab CLI `glab` is not installed on the user's Arch workstation, so GitLab work goes through the GitLab MCP tools rather than shell commands (confirmed 2026-09-24).
- Password-authenticated `ssh`/`scp` from that workstation works by pointing `SSH_ASKPASS` at an executable helper script, setting `SSH_ASKPASS_REQUIRE=force`, and wrapping the call in `setsid -w`. On the far end, a `sudo` that must run without a tty needs `SUDO_ASKPASS` exported plus one `sudo -A -v` to prime the timestamp.

## Mimic memory-nicky Branch
- In the Mimic repo (`gitlab.com/nordbo-robotics/products/mimic/mimic`) the project `MEMORY.md` is tracked only on the user's personal `memory-nicky` branch; feature branches carry it as an untracked file. When checking out a feature branch, keep the working-copy `MEMORY.md` from `memory-nicky` intact. When the user asks for a memory commit, it goes to `memory-nicky`, not the feature branch, with a message of the form `<MR subject> memory` (e.g. `move robot home after each execution memory`); committing through a temporary `git worktree` leaves the checked-out feature branch untouched.

## Global File Restraint

- Always-loaded global instruction files (`~/.claude/CLAUDE.md`, `~/.config/opencode/AGENTS.md`) stay lean: workflow and tooling knowledge lives in the command or prompt file that needs it, never as new sections in the globals.

## Gauging Performance Before It Reaches Site

- The user's dev workstation has 24 cores, more than the site machines they deploy to, so a wall-clock benchmark measured on it overstates real on-site speed. The trap is replacing already-parallel code: the old implementation saturates both machines and makes them look equally fast, so the measured speedup silently assumes the dev box's core count — that produced a 35% optimistic projection on 2026-09-17. Scale the number before quoting it, and label it a projection until the deployed logs confirm it.

## Hands-Off Graphical Display

- Hands-off verification is conditional, not the default: it applies only when the user is actively using the PC for other things, and must only be mentioned when the user asks for it. When active: no screenshots of the display, no window activation or focus changes, and no mouse control.
- While hands-off is active, drive GUI flows with env flags or auto-play modes and assert through logs, or have the user provide the input while monitoring logs; screenshots are acceptable only when testing graphics.

## Nordbo Customer Project Boards On monday.com

- Each Nordbo customer project has a monday.com board named `[Dxxxxx] Customer, …` in the Projects workspace (id 2732943), built from a template with groups "1 Kickoff & Planning" to "5. Post-Project Review"; work notes go in as subitems under template items such as "💻 Develop software/hardware specifications". Subitems live on a separate "Subitems of [Dxxxxx] …" board and carry Status (Not Started / In Progress / Completed / Blocked / Cancelled), Owner and a free-text Description column — look up the column ids with get_board_info before writing. The user's own monday.com user id is 11972798.

## Mimic High Precision Standard Hardware

- A Mimic High Precision (OptiTrack) system ships with an ASUS NUC 13 Pro NUC13ANH as the Mimic controller, a Minisforum UM890 Pro (130 × 127 × 67 mm, 120 W 19 V adapter) as the OptiTrack/Motive controller — older systems and the Drive folder's manual still show its predecessor, the UM790 Pro, so don't take that model from there — an OptiHub 2 feeding 4 Flex 13 cameras, a TP-Link TL-SG105 gigabit switch and, where an ATEX screen is sold, a Beckhoff CPX3921 panel with a CU8803-0000 extender. Datasheets and certificates for these parts are collected in one Google Drive folder (id `16863-f3LJvB9nBVNXOB0UB1_kbXNx5Kz`); check there before searching the web for dimensions or power figures.
