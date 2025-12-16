---
agent: build
description: Review an OpenSpec change and implement improvements.
---
The user has requested the following change proposal be reviewed.
<UserRequest>
  $ARGUMENTS
</UserRequest>
<!-- OPENSPEC:START -->
**Guardrails**
- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to `openspec/AGENTS.md` (located inside the `openspec/` directory—run `ls openspec` or `openspec update` if you don't see it) if you need additional OpenSpec conventions or clarifications.
- Identify any vague or ambiguous details and ask the necessary follow-up questions before editing files.
- Do not write any code or documentation during the proposal review stage. Only create design documents (proposal.md, tasks.md, design.md, and spec deltas). Implementation happens in the apply stage after approval.

**Requirements**
- The change proposals @tasks.md MUST include writing tests for the proposed changes.
  - The tests written MUST consider both unit tests and integration tests.
- The change proposals @tasks.md MUST include a code review of the implementation.
  - The code review MUST be done using the @review subagent.
  - ALL suggestions from the code review MUST be implemented.
- The change proposals @tasks.md MUST include running all tests.
- The change proposals @tasks.md MUST include updates to documentation.
  - The updates to documentation MUST include, but is not limited to @CHANGELOG.md and @README.md.
  - The updteas to documentation MUST be done using the @docs-writer subagent.

**Steps**
1. Based on the openspec instructions, use @review to review the change proposal and implement improvements.

**Reference**
- Use `openspec show <id> --json --deltas-only` or `openspec show <spec> --type spec` to inspect details when validation fails.
- Search existing requirements with `rg -n "Requirement:|Scenario:" openspec/specs` before writing new ones.
- Explore the codebase with `rg <keyword>`, `ls`, or direct file reads so proposals align with current implementation realities.
<!-- OPENSPEC:END -->
