---
description: Review an OpenSpec change proposal and update design documents based on feedback. During review phase, add a post-apply verification checklist that complements the task-marking step in openspec-apply.md.
---

The user has requested the following change proposal be reviewed.
<UserRequest>
  $ARGUMENTS
</UserRequest>
<!-- OPENSPEC:START -->
**Review Scope**
- **DO**: Analyze and evaluate change proposals
- **DO**: Update design documents (proposal.md, tasks.md, design.md, spec deltas) based on feedback
- **DO**: During review phase, add a post-apply checklist section to tasks.md for users to check off during apply phase
- **DO NOT**: Write code (implementation happens in a separate apply phase)
- **DO NOT**: Write tests (tests are part of the implementation phase)
- **DO NOT**: Update general documentation beyond design documents (general docs are handled separately)
- **DO NOT**: Build or verify the project (that's for the implementation phase)

**Guardrails**
- This command reviews proposals and updates design documents.
- During review phase, this command adds a verification checklist to tasks.md that complements the task-marking step in openspec-apply.md - the review command adds a quality assurance checklist, while the apply command performs the actual task marking.
- Implementation, tests, general documentation updates, and building happen in a separate apply phase.
- NO code writing, NO test creation, NO general documentation updates beyond design docs, NO building.
- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to `openspec/AGENTS.md` (located inside the `openspec/` directory—run `ls openspec` or `openspec update` if you don't see it) if you need additional OpenSpec conventions or clarifications.
- Identify any vague or ambiguous details and ask the necessary follow-up questions before editing files.

**Requirements**
- **Phase 1: Review** - Review the change proposal and analyze it thoroughly.
- **Phase 2: Design Document Updates** - Update design documents based on review feedback:
  - `proposal.md` - Update high-level overview and scope based on feedback
  - `tasks.md` - Update task breakdown for implementation and add a post-apply verification checklist section at the end
  - `design.md` - Update technical design approach based on feedback
  - `spec deltas` - Update specification changes based on review findings
  - **Post-Apply Verification Checklist**: During review phase, add a quality assurance checklist section at the end of tasks.md that complements the task-marking step in openspec-apply.md. This serves as a verification/reminder mechanism, while openspec-apply.md step 4 performs the actual task marking. Include items like:
    - "Mark all completed tasks as done"
    - "Verify task status accuracy"
    - "Cross-reference completed work with task descriptions"
  - **Format**: Use "- [ ] Checklist item" format (unchecked boxes for users to check during apply)
  - **Note**: Phase 2 is used during the review phase for planning and adding the verification checklist that complements openspec-apply.md step 4
- **Phase 3: Completion** - Ensure all review feedback is incorporated.
- ALL feedback and suggestions from the review MUST be systematically incorporated into the design documents.
- The design documents should be ready for implementation in a separate apply phase.
- The verification checklist serves as a quality assurance mechanism - openspec-apply.md step 4 handles the actual task marking.

**Steps**
1. **Review Phase** - Analyze the change proposal:
   - Evaluate the proposal's completeness and clarity
   - Identify any gaps, ambiguities, or issues in the proposal
   - Assess feasibility and potential challenges
   - Gather all necessary context from the codebase
   - Document review findings and feedback

2. **Design Document Updates** - Update design documents based on review feedback:
   - **Update `proposal.md`**: Refine the high-level overview, scope, and objectives based on review findings
   - **Update `tasks.md`**: Adjust the task breakdown to reflect any changes needed (focus on WHAT needs to be done, not HOW)
   - **Add Verification Checklist to `tasks.md`**: At the end of tasks.md, add a verification checklist section that complements the task-marking step in openspec-apply.md:
     ```
     ## Post-Apply Verification Checklist
     
     - [ ] Mark all completed tasks as done
     - [ ] Verify task status accuracy
     - [ ] Cross-reference completed work with task descriptions
     ```
   - **Update `design.md`**: Revise the technical design approach based on feedback and identified issues
   - **Update `spec deltas`**: Modify specification changes to address review findings

3. **Completion** - Ensure all review feedback is incorporated:
   - Verify all identified issues are addressed in the design documents
   - Ensure the design documents are ready for a separate implementation phase
   - Document any unresolved items that need attention in the implementation phase

**Reference**
- Use `openspec show <id> --json --deltas-only` or `openspec show <spec> --type spec` to inspect details when validation fails.
- Search existing requirements with `rg -n "Requirement:|Scenario:" openspec/specs` before writing new requirements.
- Explore the codebase with `rg <keyword>`, `ls`, or direct file reads so proposals align with current implementation realities.
- The design documents updated by this command should be ready for implementation in a separate apply phase.

- **Relationship with openspec-apply.md**: The verification checklist added during review phase complements openspec-apply.md step 4. The review command adds a quality assurance checklist to tasks.md, while openspec-apply.md step 4 performs the actual task marking. This ensures a clear separation between verification/reminder mechanisms (review checklist) and actual implementation tracking (apply task marking).
- This command focuses purely on review and design document updates—no implementation work.
<!-- OPENSPEC:END -->
