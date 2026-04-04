export const TaskCompletionMonitor = async ({ $, directory, client }) => {
  const BUILD_MODE = 'build';
  const LONG_RUNNING_CALL_THRESHOLD = 10;
  const abortedSessions = new Set();
  const promptedSessions = new Map();
  const toolCallsBySession = new Map();
  const bashCommandsBySession = new Map();
  const PASSWORD_VALIDITY_MS = 60000;
  const SALT = 'opencode_task_monitor_2025_secret';

  const generatePassword = (sessionID, timestamp) => {
    const data = sessionID + timestamp + SALT;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `TASK_${Math.abs(hash).toString(16).padStart(12, '0')}`;
  };

  const determineTaskStatus = (text) => {
    if (text.includes('TASK_COMPLETED')) {
      return 'completed';
    } else if (text.includes('TASK_BLOCKED')) {
      return 'blocked';
    }
    return null;
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
        }
        return;
      }

      if (event.type === "command.executed") {
        const { sessionID, messageID, name } = event.properties;
        if (sessionID && messageID) {
          trackBashCommand(sessionID, messageID);
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

        const createNotificationMessage = (type, summary, reason = null) => {
          const emoji = type === 'completed' ? '✅' : '⏸️';
          const status = type === 'completed' ? 'Completed' : 'Blocked';
          const sessionId = getSessionShortId(sessionID);
          const reasonText = reason ? ` (${reason})` : '';
          return `${emoji} ${status}${reasonText}: ${summary} [${sessionId}]`;
        };

        const sendTaskCompletionNotification = async (summary, reason = null) => {
          const notification = createNotificationMessage('completed', summary, reason);
          await $`notify-send "OpenCode Task Monitor" "${notification}" --urgency=normal`;
        };

        const lastMessageMode = lastAssistantMessage?.info?.mode || lastAssistantMessage?.mode;
        if (lastMessageMode === 'plan') {
          await client.tui.showToast({
            body: {
              message: `Session ${sessionID.substring(0, 8)} currently in plan mode - skipping task completion analysis`,
              variant: "info"
            }
          });
          const taskSummary = extractTaskSummary(firstUserText);
          await sendTaskCompletionNotification(taskSummary, 'plan mode');
          await cleanupSessionTracking(sessionID);
          return;
        }

        if (lastMessageMode !== BUILD_MODE) {
          await cleanupSessionTracking(sessionID);
          return;
        }

        const executionCount = getExecutionCount(sessionID);

        if (executionCount < LONG_RUNNING_CALL_THRESHOLD) {
          const taskSummary = extractTaskSummary(firstUserText);
          await sendTaskCompletionNotification(taskSummary, 'low execution count');
          await cleanupSessionTracking(sessionID);
          return;
        }

        const passwordMatch = messageText.match(/TASK_[a-f0-9]{12}/);

        if (passwordMatch) {
          const password = passwordMatch[0];
          const pendingCheck = promptedSessions.get(sessionID);

          if (pendingCheck && pendingCheck.password === password) {
            const timeDiff = Date.now() - pendingCheck.timestamp;

            if (timeDiff <= PASSWORD_VALIDITY_MS) {
              promptedSessions.delete(sessionID);

              if (messageText.includes('TASK_COMPLETED')) {
                const taskSummary = extractTaskSummary(firstUserText);
                await sendTaskCompletionNotification(taskSummary);
                await cleanupSessionTracking(sessionID);
                return;
              } else if (messageText.includes('TASK_BLOCKED')) {
                const taskSummary = extractTaskSummary(firstUserText);
                const notification = createNotificationMessage('blocked', taskSummary);
                await $`notify-send "OpenCode Task Monitor" "${notification}" --urgency=critical`;
                await cleanupSessionTracking(sessionID);
                return;
              }
            } else {
              promptedSessions.delete(sessionID);
            }
          }
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

        await client.tui.showToast({
          body: {
            message: "No completion password found - triggering task analysis...",
            variant: "info"
          }
        });

        const promptTimestamp = Date.now();
        const password = generatePassword(sessionID, promptTimestamp);

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
- After that exact message, on a new line, add: ${password} TASK_BLOCKED
- DO NOT explain missing info, DO NOT modify the last message, DO NOT add any other text

**If tasks ARE fully completed:**
- Output your EXACT last message above (your last assistant response before this analysis), word-for-word, without any changes
- After that exact message, on a new line, add: ${password} TASK_COMPLETED
- DO NOT write any summary, DO NOT modify the last message, DO NOT add any other text

IMPORTANT: You must include the password exactly as shown above to verify your response. Only include this at the very end of your final response.`
            }]
          }
        });

        promptedSessions.set(sessionID, {
          password,
          timestamp: promptTimestamp
        });

      } catch (error) {
        console.error("Task completion monitor error:", {
          message: error.message,
          stack: error.stack
        });
      }
    },
  };
};
