---
agent: build
description: Review an OpenSpec change and implement improvements.
---
The user has requested the following change proposal be reviewed.
<UserRequest>
  $ARGUMENTS
</UserRequest>

- Based on the openspec instructions, use @review to review the change proposal and implement improvements.
- The change proposals @tasks.md MUST include writing tests for the proposed changes.
  - The tests written MUST consider both unit tests and integration tests.
- The change proposals @tasks.md MUST include a code review of the implementation.
  - The code review MUST be done using the @review subagent.
  - ALL suggestions from the code review MUST be implemented.
- The change proposals @tasks.md MUST include running all tests.
- The change proposals @tasks.md MUST include updates to documentation.
  - The updates to documentation MUST include, but is not limited to @CHANGELOG.md and @README.md.
  - The updteas to documentation MUST be done using the @docs-writer subagent.
