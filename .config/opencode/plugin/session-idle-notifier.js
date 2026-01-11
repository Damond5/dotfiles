export const SessionIdleNotifier = async ({ $, directory, client }) => {
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
        const { sessionID } = event.properties || {};
        if (!sessionID) {
          console.warn("No sessionID provided in event properties");
          return;
        }

        // Use API-based detection to filter out subagent sessions (SDK v1.1.1 pattern)
        try {
          const sessionResult = await client.session.get({
            path: { id: sessionID }
          });

          if (!sessionResult || !sessionResult.data) {
            console.log("No session found for ID:", sessionID);
            return;
          }

          const session = sessionResult.data;
          const parentID = session.parentID;

          if (parentID) {
            console.log("Skipping subagent session:", sessionID);
            return;
          }
        } catch (apiError) {
          // Fallback to legacy property-based detection if API fails
          console.warn("Failed to get session via API, falling back to property-based detection:", apiError.message);
          const props = event.properties || {};
          const parentID = props.parentID;
          const agentMode = props.agent?.mode;
          const isSubagent = parentID || agentMode === 'subagent';

          if (isSubagent) {
            return;
          }
        }

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
