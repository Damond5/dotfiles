# Last run: 2026-09-30

Fixed prefix (fresh-session `/context`): ~30k → ~16k tokens.
- System tools 19.6k → 10.7k; MCP server instructions 752 → 42; skills 5.5k (40) → 1k (11), then more hidden.

Decisions (in ~/.claude/settings.json):
- `enableArtifact: false`, `disableWorkflows: true`, `feedbackDrafts: "off"` — never used.
- Denied connectors: Claude Docs, Figma, Tally, BankMCP. Kept: GitLab, Gmail, monday, Google Calendar/Drive/Chat, Pipedrive, Chrome.
- `skillOverrides`: artifact/workflow/dataviz/docs/morning/import-memory → off; everything else bundled or synced → user-invocable-only.

Usage baseline (94 sessions): cache reads 66% of cost, writes 20%, output 14%. Calls >200k context = 29% of calls, 59% of cache reads. Bash output ≈ 38% of conversation re-reads, Read ≈ 5%.

Open lever: session length (`autoCompactWindow` / `/clear`) — not applied yet.
