export const TaskCompletionMonitor = async ({ $, directory, client }) => {
  const PASSWORD_COMPLETED = "TASK_COMPLETED_OK";
  const PASSWORD_BLOCKED = "TASK_BLOCKED_NO_CONTINUE";
  const abortedSessions = new Set();
  const promptedSessions = new Set();

  return {
    event: async ({ event }) => {
      if (!event) return;
      
      if (event.type === "session.error") {
        const { sessionID, error } = event.properties;
        if (sessionID && error?.name === "MessageAbortedError") {
          abortedSessions.add(sessionID);
          promptedSessions.delete(sessionID);
          await client.tui.showToast({
            body: {
              message: `Session ${sessionID.substring(0, 8)} interrupted - tracking for skip`,
              variant: "warning"
            }
          });
        }
        return;
      }
      
      if (event.type !== "session.idle") return;

      const { sessionID } = event.properties;
      if (abortedSessions.has(sessionID)) {
        await client.tui.showToast({
          body: {
            message: `Session ${sessionID.substring(0, 8)} interrupted - skipping task analysis`,
            variant: "info"
          }
        });
        abortedSessions.delete(sessionID);
        return;
      }

      try {
        const sessionResult = await client.session.get({
          path: { id: sessionID }
        });

        if (!sessionResult || !sessionResult.data) {
          console.log("No session found");
          return;
        }

        const session = sessionResult.data;
        const parentID = session.parentID;

        if (parentID) {
          console.log("Skipping subagent session");
          return;
        }

        const messagesResult = await client.session.messages({
          path: { id: sessionID }
        });

        if (!messagesResult || !messagesResult.data) {
          console.log("No messages result found in session");
          return;
        }

        const messages = messagesResult.data;
        if (!Array.isArray(messages) || messages.length === 0) {
          console.log("No messages array found in session");
          return;
        }

        const lastAssistantMessage = [...messages].reverse().find(
          msg => msg.info?.role === 'assistant'
        );

        if (!lastAssistantMessage) {
          console.log("No assistant message found in session");
          return;
        }

        const messageText = lastAssistantMessage.parts
          ?.filter(part => part.type === 'text')
          .map(part => part.text)
          .join('\n') || '';

        const firstUserMessage = messages.find(msg => msg.info?.role === 'user');
        const firstUserText = firstUserMessage?.parts
          ?.filter(part => part.type === 'text')
          .map(part => part.text)
          .join('\n') || '';

        const lastMessageMode = lastAssistantMessage?.info?.mode || lastAssistantMessage?.mode;
        if (lastMessageMode === 'plan') {
          await client.tui.showToast({
            body: {
              message: `Session ${sessionID.substring(0, 8)} currently in plan mode - skipping task completion analysis`,
              variant: "info"
            }
          });
          return;
        }

        const extractTaskSummary = (text, maxLength = 80) => {
          const lines = text.split('\n');
          const validLines = [];
          
          for (const line of lines) {
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.length < 10) continue;
            
            if (trimmed.startsWith('##') || trimmed.startsWith('#')) continue;
            
            if (trimmed.includes('Task Completion Analysis')) continue;
            
            if (/^\d{5,}\|/.test(trimmed)) continue;
            
            if (/^export |^import |^const |^let |^function |^class |^if \(|^return |^async /.test(trimmed)) continue;
            
            if (/^<file>|\(End of file|\(total \d+ lines\)/.test(trimmed)) continue;
            
            validLines.push(trimmed);
          }
          
          for (const line of validLines) {
            const cleaned = line.replace(/^[#\-\*•]\s*/, '');
            if (cleaned.length > 15 && cleaned.length <= maxLength && 
                /[a-zA-Z]/.test(cleaned) && 
                cleaned.split(' ').length >= 3) {
              return cleaned;
            }
          }
          
          const joined = validLines.slice(0, 3).join(' ');
          const cleaned = joined.substring(0, maxLength);
          return cleaned + (joined.length > maxLength ? '...' : '');
        };

        const getSessionShortId = (id) => id ? id.substring(0, 8) : 'unknown';

        const createNotificationMessage = (type, summary) => {
          const emoji = type === 'completed' ? '✅' : '⏸️';
          const status = type === 'completed' ? 'Completed' : 'Blocked';
          const sessionId = getSessionShortId(sessionID);
          return `${emoji} ${status}: ${summary} [${sessionId}]`;
        };

        if (messageText.includes(PASSWORD_COMPLETED)) {
          const taskSummary = extractTaskSummary(firstUserText);
          const notification = createNotificationMessage('completed', taskSummary);
          await $`notify-send "OpenCode Task Monitor" "${notification}" --urgency=normal`;
          promptedSessions.delete(sessionID);
          return;
        }

        if (messageText.includes(PASSWORD_BLOCKED)) {
          const taskSummary = extractTaskSummary(firstUserText);
          const notification = createNotificationMessage('blocked', taskSummary);
          await $`notify-send "OpenCode Task Monitor" "${notification}" --urgency=critical`;
          promptedSessions.delete(sessionID);
          return;
        }

        if (abortedSessions.has(sessionID)) {
          await client.tui.showToast({
            body: {
              message: `Session ${sessionID.substring(0, 8)} interrupted - skipping task analysis`,
              variant: "info"
            }
          });
          abortedSessions.delete(sessionID);
          return;
        }

        if (promptedSessions.has(sessionID)) {
          console.log(`Session ${sessionID.substring(0, 8)} already prompted - skipping`);
          return;
        }

        promptedSessions.add(sessionID);

        await client.tui.showToast({
          body: {
            message: "No completion password found - triggering task analysis...",
            variant: "info"
          }
        });

        await client.session.prompt({
          path: { id: sessionID },
          body: {
            agent: lastAssistantMessage.mode,
            parts: [{
              type: "text",
              text: `## Task Completion Analysis

Analyze the current session to determine if tasks are fully completed:

1. **Review the conversation history** and identify all tasks that were requested
2. **Check if all tasks are complete** - verify that all requested work has been finished
3. **Determine if tasks can continue** if incomplete - check if there's enough information/context to proceed

Based on your analysis:

**If tasks are NOT fully completed but CAN continue:**
- Continue executing the incomplete tasks immediately
- Work through all remaining tasks until fully complete

**If tasks are NOT fully completed and CANNOT continue:**
- Output your EXACT last message above (your last assistant response before this analysis), word-for-word, without any changes
- After that exact message, on a new line, add only: ${PASSWORD_BLOCKED}
- DO NOT explain missing info, DO NOT modify the last message, DO NOT add any other text

**If tasks ARE fully completed:**
- Output your EXACT last message above (your last assistant response before this analysis), word-for-word, without any changes
- After that exact message, on a new line, add only: ${PASSWORD_COMPLETED}
- DO NOT write any summary, DO NOT modify the last message, DO NOT add any other text

IMPORTANT: Only include the password at the very end of your final response, not during the continuation process.`
            }]
          }
        });

        promptedSessions.delete(sessionID);

      } catch (error) {
        console.error("Task completion monitor error:", {
          message: error.message,
          stack: error.stack
        });
      }
    },
  };
};
