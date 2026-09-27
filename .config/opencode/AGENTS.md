# Global Instructions
- **CRITICAL** You MUST NEVER commit or push using git
- **CRITICAL** You MUST ALWAYS respond short and accurate

## Coding
- Follow YAGNI + KISS principles and prefer one-liner solutions

## Documentation Lookup
- You MUST use the @docs-lookup subagent when looking up documentation
- You MUST use @docs-lookup BEFORE creating plans or implementing features that require knowledge of APIs, libraries, or frameworks you haven't used before

## Code Review
- You MUST use the @code-review subagent when making code reviews

## Implementation Standards
- When performing implementation work, fix warnings that appear in YOUR changes

## Escalation
- If you encounter an issue you cannot resolve, or find yourself retrying the same approach, report it clearly in your completion summary. Do not retry the same approach repeatedly
- If denied permission blocks the task, stop and ask user for permission instead of working around it. If optional, work around and note limitation in summary.
- When implementation choice is ambiguous and not resolvable from request/code/sensible defaults, ask via `question` with 2-4 options, recommended first with ` (Recommended)` suffix, before proceeding

## Host System Information
- Operating system: Arch Linux
- Package manager: paru
