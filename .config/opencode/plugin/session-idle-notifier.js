export const SessionIdleNotifier = async ({ $, directory }) => {
  let notifyAvailable = false;
  try {
    await $`test -x /usr/bin/notify-send`;
    notifyAvailable = true;
  } catch {
    console.warn("notify-send not available; notifications disabled");
  }

  return {
    event: async ({ event }) => {
      if (!event || event.type !== "session.idle") return;
      if (!notifyAvailable) return;

      try {
        const props = event.properties || {};
        const sessionID = props.sessionID;

        // Filter out subagent sessions using multiple indicators
        const parentID = props.parentID;
        const agentMode = props.agent?.mode;
        const isSubagent = parentID || agentMode === 'subagent';

        if (isSubagent) {
          return;
        }

        const idDisplay = sessionID || 'no ID';
        // console.log(`Main agent session ${idDisplay} is idle`);
        await $`notify-send "OpenCode" "Session is idle" --urgency=normal`;
      } catch (error) {
        console.error(`Failed to send idle notification:`, {
          message: error.message,
          stack: error.stack
        });
      }
    },
  };
};
