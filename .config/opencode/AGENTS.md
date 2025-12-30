# Global instructions
**CRITICAL**: When making proposals, plans and/or tasks you MUST follow the points below:
- You MUST NOT start implementation, unless asked to do so directly.
- You MUST complete ALL tasks in order.
- You MUST create tests for new functionality, both unit tests and integration tests.
- You MUST review new code, using the @code-review subagent and then implement changes based on the review.
- You MUST fully build the project.
- You MUST fully test the project.
- You MUST update the projects @README.md with changes to any of the information it includes or new information that makes sense to put there, using the @docs-writer subagent.
- You MUST update @CHANGELOG.md according to www.keepachangelog.com and www.semver.org, using the @docs-writer subagent, when you make changes.

**CRITICAL**: When making implementations you MUST follow to the points below:
- You MUST review code when making changes or writing new code, using the @code-review subagent and then implement changes based on the review.
- You MUST fix warnings immediately.
- When looking up documentation you MUST use the @docs-lookup subagent.
- When making reviews you MUST use the @code-review subagent.

## Large, complex and/or multistep tasks
Example: "complete all the tasks in the @TODO.md file"
- You MUST complete large and/or complex tasks in steps:
  1. Assess if the task can be completed in parallel, by subagents.
    - You MUST choose the appropriate subagent for each task.
  2. Make a plan to complete the task.
    - If applicaple this plan should include an initial step to refacture the code base, such that subagents can work in parallel with minimum interferance.
  3. Execute the plan.

## Host system information
- **Operation system**: Arch Linux
- **Package manager**: paru
