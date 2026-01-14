# Global instructions
- You MUST use the @docs-lookup subagent when looking up documentation.
- You MUST use @docs-lookup BEFORE creating plans or implementing features that require knowledge of APIs, libraries, or frameworks you haven't used before.
- You MUST use the @code-review subagent when making code reviews.

**CRITICAL**: When making proposals, plans and/or tasks you MUST follow the points below:
- You MUST NOT start implementation, unless asked to do so directly.
- You MUST complete ALL tasks in order.
- You MUST create tests for new functionality, both unit tests and integration tests.
- You MUST review new code, using the @code-review subagent and then implement changes based on the review.
- You MUST fully build the project.
- You MUST fully test the project.
- You MUST update the projects @README.md with changes to any of the information it includes or new information that makes sense to put there, using the @docs-writer subagent.
- You MUST update @CHANGELOG.md (if one exists) according to www.keepachangelog.com and www.semver.org, using the @docs-writer subagent, when you make changes.

**CRITICAL**: When making implementations you MUST follow to the points below:
- You MUST review code when making changes or writing new code, using the @code-review subagent and then implement changes based on the review.
- You MUST fix warnings immediately.

## Host system information
- **Operation system**: Arch Linux
- **Package manager**: paru
