# Global instructions
- Always fix warnings, before considering a task completed.
- Always send a notification with notify-send, when the given tasks are fully completed.
- Always update the projects Agents.md with new design choices.
- Always update the projects README.md with changes to any of the information it includes or new information that makes sense to put there.

## Large, complex and/or multistep tasks
Example: "complete all the tasks in the todo.md file"
- Always complete large and/or complex tasks in steps:
  1. Assess if the task can be completed in parallel, by subagents.
  2. Make a plan to complete the task.
    - If applicaple this plan should include an initial step to refacture the code base, such that subagents can work in parallel with minimum interferance.
  3. Execute the plan.
