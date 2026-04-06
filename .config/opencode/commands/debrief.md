---
description: Critically evaluate lessons learned and incorporate only durable, high-value guidance into the narrowest instruction file
---

Debrief the just-completed work and decide whether any lessons learned should be incorporated into agent instructions.

**Purpose**

This command exists to improve the instruction set without letting it accrete noise. The default outcome is often **no instruction change**. Only incorporate lessons that are durable, high-signal, and likely to prevent meaningful future mistakes.

**Input**

The argument after `/debrief` is optional context for the debrief, such as:
- A short summary of what happened
- Candidate lessons learned
- A path, task name, or feature area to inspect
- Nothing, in which case infer context from the current conversation and recent work

**Core Standard: Be Extremely Selective**

Treat every candidate lesson as guilty until proven useful.

You MUST reject lessons that are:
- Specific to one task, one bug, or one transient incident
- Mere reminders to be careful, thorough, or thoughtful
- Already covered by existing instructions
- Too vague to change behavior
- Too narrow to justify permanent instruction weight
- Too broad, heavy-handed, or likely to create future conflicts
- Process clutter that would make agents longer but not meaningfully better

Only incorporate a lesson if it is all of the following:
- **Durable**: likely to remain true across many future tasks
- **Actionable**: changes what the agent should concretely do
- **Generalizable**: applies beyond the exact incident being debriefed
- **High leverage**: prevents a costly or recurring mistake
- **Non-redundant**: not already implied by current instructions
- **Compact**: can be expressed in a short, clear instruction

If a lesson fails any of those tests, do not incorporate it.

**Placement Rules**

Always write to the **narrowest correct scope**.

- Update `~/.config/opencode/AGENTS.md` only for lessons that should govern multiple agents broadly
- Update `~/.config/opencode/agent/<agent>.md` only for lessons specific to that agent's role, tools, or failure modes
- Prefer agent-specific placement over global placement when either would work
- Never add the same lesson to both global and agent instructions unless the two versions serve materially different purposes

**Anti-Clutter Rules**

When incorporating a lesson:
- Prefer tightening or clarifying an existing instruction over adding a new one
- Prefer replacing redundant wording over appending more text
- Keep new guidance short and concrete
- Avoid adding examples unless they are necessary to disambiguate behavior
- Add at most the minimum number of instruction changes needed; if nothing clearly qualifies, add nothing

**Decision Procedure**

1. **Gather context**
   - Review the recent conversation, final outcomes, and any explicit lessons learned
   - Read `~/.config/opencode/AGENTS.md`
   - Read only the agent markdown files that are plausibly relevant to the incident

2. **Extract candidate lessons**
   - Write a short list of possible lessons in plain language
   - Normalize them into concise behavioral statements

3. **Critically evaluate each candidate**
   - What specific failure or missed opportunity does this prevent?
   - Is this a recurring pattern or just a one-off?
   - Would this still be useful in a month?
   - Is it already covered by existing instructions?
   - Is permanent instruction text the right fix, or is this better left as situational judgment?

4. **Decide: reject, revise, or incorporate**
   - Reject weak lessons explicitly
   - Revise borderline lessons into narrower, more durable guidance if possible
   - Incorporate only the strongest lessons

5. **Choose the target file**
   - Global, if it is broadly applicable across agents
   - Specific agent file, if it is role-specific
   - If no target is clearly justified, do not write anything

6. **Edit minimally**
   - Prefer modifying existing nearby instructions
   - If adding new text, place it in the most relevant section
   - Keep wording terse, imperative, and behavior-shaping

7. **Report the outcome**
   - State which lessons were rejected and why
   - State which lessons were incorporated and where
   - If no changes were made, say that this was the correct outcome

**Required Biases**

- Bias toward **no change** when uncertain
- Bias toward **narrow scope** over broad policy
- Bias toward **editing existing lines** over adding new sections
- Bias toward **stable heuristics** over incident-specific rules

**Good Lessons to Incorporate**

- A recurring failure happened because instructions were missing a concrete decision rule
- An agent repeatedly chose the wrong tool because its role boundary was underspecified
- A global instruction is too vague and should be tightened into a clear behavioral requirement

**Lessons to Reject**

- "Be more careful"
- "Double-check everything"
- "When working on bug X in file Y, remember Z"
- "Always think harder about edge cases"
- Any lesson whose real fix is better judgment in context, not permanent instruction text

**Output Format**

Use this structure:

```markdown
## Debrief

### Candidate Lessons
- <candidate 1>
- <candidate 2>

### Rejected
- <lesson>: <why it should not become permanent instruction>

### Incorporated
- <lesson> → `<target file>`: <short rationale>

### Changes Made
- <file>: <summary of exact instruction update>
```

If nothing merits incorporation:

```markdown
## Debrief

No instruction changes made.

### Why
- The lessons were task-specific, already covered, too vague, or too low leverage to justify permanent instruction weight.
```

**Guardrails**

- Do not manufacture lessons just to make the debrief feel productive
- Do not turn one-off incidents into permanent policy
- Do not duplicate guidance across files without a strong reason
- Do not bloat instruction files with motivational language or generic best practices
- Do not update unrelated agent files
- If multiple weak lessons point to the same underlying issue, prefer one tight instruction or no change at all

**Before patching files:**
- Always read the target file first to verify the exact location
- If the specified section doesn't exist, find the most appropriate existing section and patch there
- If no suitable location exists, create a new section in the most logical place
- Only ask the user for clarification if the lesson itself doesn't fit the file's purpose
