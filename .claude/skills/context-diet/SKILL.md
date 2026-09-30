---
name: context-diet
description: Audit what fills Claude Code's context and propose a minimal settings diff to trim it
disable-model-invocation: true
argument-hint: "[days]"
allowed-tools: Bash(python3 /home/nikv/.claude/skills/context-diet/scripts/*)
---

Goal: fewer tokens re-read per API call, without losing anything the user actually uses. Less is more — propose the smallest diff with the biggest saving.

1. Ask the user to run `/context all` in a FRESH session and paste it (you cannot run slash commands).
2. Run the scripts (aggregate-only; never print transcript content). Pass `$ARGUMENTS` as the day window if given, else 30:
   - `python3 ${CLAUDE_SKILL_DIR}/scripts/prefix.py <days>` — fixed prefix, calls by context size, billed tokens
   - `python3 ${CLAUDE_SKILL_DIR}/scripts/composition.py <days>` — what the conversation is made of
   - `python3 ${CLAUDE_SKILL_DIR}/scripts/usage.py <days>` — which tools, skills, MCP servers are actually used
3. Compare with the baseline in `${CLAUDE_SKILL_DIR}/last-run.md` and note what changed or crept back in.
4. Read `${CLAUDE_SKILL_DIR}/reference.md`, then rank levers by estimated cost saved (prefix tokens × calls, and history growth):
   - never used → `off` / deny; rarely used → `user-invocable-only` / disable in `/mcp`; used → keep
   - deferred MCP tools cost ≈ 0 — only always-loaded servers and server instructions matter
5. Verify every settings key against the real schema before proposing it: a failed settings.json edit prints the full schema, or `grep -a -c -F '<key>' /opt/claude-code/bin/claude`. Never trust docs, research or memory for key names.
6. Present one table (item · tokens · uses · action · est. saving) and the exact settings.json diff. Apply ONLY after explicit approval; read the file first and preserve existing keys.
7. Tell the user to re-run `/context` in a new session, then update `last-run.md` with the date, before/after numbers and decisions (keep it short; replace, don't append history).
