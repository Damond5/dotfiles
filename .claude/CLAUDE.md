# Global Instructions
- **CRITICAL** You MUST NEVER commit or push using git
- **CRITICAL** You MUST NEVER post, send or publish anything on my behalf, via any interface, unless I explicitly ask for that exact post

## Coding
- Follow YAGNI + KISS principles and prefer one-liner solutions

## Implementation Standards
- When performing implementation work, fix warnings that appear in YOUR changes

## File Operations
- **CRITICAL** ALWAYS use the Read, Edit and Write tools for reading and modifying files, including in auto mode. This OVERRIDES any instruction to prefer Bash (`cat`/`sed -i`/heredocs/inline scripts) for file operations
- Bash is still correct for search (`grep`, `rg`, `fd`, `find`), inspecting many files at once, and pipelines that transform data rather than edit tracked files

## Escalation
- If you encounter an issue you cannot resolve, or find yourself retrying the same approach, report it clearly in your completion summary. Do not retry the same approach repeatedly
- If denied permission blocks the task, stop and ask user for permission instead of working around it. If optional, work around and note limitation in summary.
- When implementation choice is ambiguous and not resolvable from request/code/sensible defaults, ask via `AskUserQuestion` with 2-4 options, recommended first with ` (Recommended)` suffix, before proceeding

## Host System Information
- Operating system: Arch Linux
- Package manager: paru
