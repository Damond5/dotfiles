export const TaskCompletionMonitor = async ({ $, directory, client }) => {
  const PASSWORD_COMPLETED = "TASK_COMPLETED_OK";
  const PASSWORD_BLOCKED = "TASK_BLOCKED_NO_CONTINUE";
  const BUILD_MODE = 'build';
  const LONG_RUNNING_CALL_THRESHOLD = 10;
  const abortedSessions = new Set();
  const promptedSessions = new Set();
  const toolCallsBySession = new Map();
  const bashCommandsBySession = new Map();

  const debugLogPath = '/tmp/task-completion-monitor-debug.log';

  const debugLog = async (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
      await Bun.write(debugLogPath, logMessage, { createPath: true });
    } catch (error) {
      console.error('Failed to write debug log:', error);
    }
  };

  const trackToolCall = (sessionID, callID) => {
    if (!toolCallsBySession.has(sessionID)) {
      toolCallsBySession.set(sessionID, new Set());
    }
    toolCallsBySession.get(sessionID).add(callID);
  };

  const trackBashCommand = (sessionID, messageID) => {
    if (!bashCommandsBySession.has(sessionID)) {
      bashCommandsBySession.set(sessionID, new Set());
    }
    bashCommandsBySession.get(sessionID).add(messageID);
  };

  const getExecutionCount = (sessionID) => {
    const toolCount = toolCallsBySession.get(sessionID)?.size || 0;
    const bashCount = bashCommandsBySession.get(sessionID)?.size || 0;
    return toolCount + bashCount;
  };

  const cleanupSessionTracking = async (sessionID) => {
    toolCallsBySession.delete(sessionID);
    bashCommandsBySession.delete(sessionID);
    await debugLog(`Cleaned up tracking for session ${sessionID.substring(0, 8)}`);
  };

  return {
    event: async ({ event }) => {
      if (!event) return;

      if (event.type === "session.error") {
        const { sessionID, error } = event.properties;
        if (sessionID && error?.name === "MessageAbortedError") {
          abortedSessions.add(sessionID);
          promptedSessions.delete(sessionID);
          await cleanupSessionTracking(sessionID);
          await client.tui.showToast({
            body: {
              message: `Session ${sessionID.substring(0, 8)} interrupted - tracking for skip`,
              variant: "warning"
            }
          });
        }
        return;
      }

      if (event.type === "message.part.updated") {
        const part = event.properties.part;
        if (part?.type === 'tool') {
          trackToolCall(part.sessionID, part.callID);
          await debugLog(`Tool call tracked: ${part.tool} for session ${part.sessionID.substring(0, 8)} (callID: ${part.callID.substring(0, 8)})`);
        }
        return;
      }

      if (event.type === "command.executed") {
        const { sessionID, messageID, name } = event.properties;
        if (sessionID && messageID) {
          trackBashCommand(sessionID, messageID);
          await debugLog(`Bash command executed: ${name} for session ${sessionID.substring(0, 8)} (messageID: ${messageID.substring(0, 8)})`);
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
        await cleanupSessionTracking(sessionID);
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
          await cleanupSessionTracking(sessionID);
          return;
        }

        const messagesResult = await client.session.messages({
          path: { id: sessionID }
        });

        if (!messagesResult || !messagesResult.data) {
          console.log("No messages result found in session");
          await cleanupSessionTracking(sessionID);
          return;
        }

        const messages = messagesResult.data;
        if (!Array.isArray(messages) || messages.length === 0) {
          console.log("No messages array found in session");
          await cleanupSessionTracking(sessionID);
          return;
        }

        const lastAssistantMessage = [...messages].reverse().find(
          msg => msg.info?.role === 'assistant'
        );

        if (!lastAssistantMessage) {
          console.log("No assistant message found in session");
          await cleanupSessionTracking(sessionID);
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
          await cleanupSessionTracking(sessionID);
          return;
        }

        if (lastMessageMode !== BUILD_MODE) {
          await debugLog(`Session ${sessionID.substring(0, 8)} is in '${lastMessageMode}' mode (not build) - skipping task completion analysis`);
          await cleanupSessionTracking(sessionID);
          return;
        }

        const executionCount = getExecutionCount(sessionID);
        await debugLog(`Session ${sessionID.substring(0, 8)} has ${executionCount} tool/bash calls (threshold: ${LONG_RUNNING_CALL_THRESHOLD})`);

        if (executionCount < LONG_RUNNING_CALL_THRESHOLD) {
          await debugLog(`Session ${sessionID.substring(0, 8)} has ${executionCount} tool/bash calls (< ${LONG_RUNNING_CALL_THRESHOLD}) - skipping task completion analysis`);
          await cleanupSessionTracking(sessionID);
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
          await cleanupSessionTracking(sessionID);
          await debugLog(`Session ${sessionID.substring(0, 8)} completed successfully`);
          return;
        }

        if (messageText.includes(PASSWORD_BLOCKED)) {
          const taskSummary = extractTaskSummary(firstUserText);
          const notification = createNotificationMessage('blocked', taskSummary);
          await $`notify-send "OpenCode Task Monitor" "${notification}" --urgency=critical`;
          promptedSessions.delete(sessionID);
          await cleanupSessionTracking(sessionID);
          await debugLog(`Session ${sessionID.substring(0, 8)} blocked - cannot continue`);
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
          await cleanupSessionTracking(sessionID);
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
        await cleanupSessionTracking(sessionID);
        await debugLog(`Session ${sessionID.substring(0, 8)} task analysis prompt triggered`);

      } catch (error) {
        console.error("Task completion monitor error:", {
          message: error.message,
          stack: error.stack
        });
      }
    },
  };
};
