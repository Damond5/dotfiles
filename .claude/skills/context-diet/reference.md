# Context diet reference

## Cost model
- Every API call re-reads the whole context from cache. Cost ≈ cache reads (0.1× input price) + cache writes (1.25×) + output (5×).
- So an item costs `tokens × calls it stays in context`. A 1k-token prefix item beats a 20k tool result read once.
- Typical split (2026-09 measurement): fixed prefix ~26% of cache reads, conversation history ~74%; calls >200k context were 29% of calls but 59% of cache reads.

## Levers, biggest first
| Lever | How | Notes |
|---|---|---|
| Session length | `/clear` between tasks; `"autoCompactWindow": 200000` (int, 100k–1M); or model without `[1m]` | Usually the largest saving; compaction loses detail |
| Unused built-in tools | `"enableArtifact": false`, `"disableWorkflows": true`, `"feedbackDrafts": "off"`; bare tool name in `permissions.deny` removes a tool | Artifact ≈ 5–6k tokens |
| MCP servers | `"deniedMcpServers": [{"serverName": "claude.ai <Display Name>"}]`; per-project toggle in `/mcp` | Deferred tools ≈ 0 tokens; always-loaded servers + server instructions are the cost |
| Skills | `"skillOverrides": {"<name>": "on"\|"name-only"\|"user-invocable-only"\|"off"}`; own skills: `disable-model-invocation: true` in frontmatter | Synced claude.ai skills are keyed `anthropic-skills:<name>` |
| Always-loaded text | CLAUDE.md files, MEMORY.md, hook `additionalContext` | Per-prompt hook injections accumulate in history |
| Big tool outputs | `bashOutputMaxChars`; prefer targeted reads | Only matters for long sessions |

## Gotchas (learned the hard way)
- `disableBundledSkills` removes bundled skills entirely — their slash commands stop working. Use per-name `user-invocable-only` instead.
- Chrome's default-on is set via `/chrome`, not settings.json (`claudeInChromeDefaultEnabled` is rejected by the schema).
- Prefer settings keys over env vars (`enableArtifact` over `CLAUDE_CODE_DISABLE_ARTIFACT`).
- `skillOverrides` has no wildcard/default key.
- The auto-mode classifier blocks transcript reads as PII unless the scripts print aggregates only.
- chars/4 is a rough token estimate; `/context` is the ground truth for the prefix.

## Out of scope
Compression tools (RTK, Headroom): independent paired studies show ≈0 bill impact for Claude Code, and Headroom's token mode raises cost 30–50% by breaking the prompt cache. Say so if asked.
