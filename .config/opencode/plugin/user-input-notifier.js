export const UserInputNotifier = async ({ $, directory }) => {
  let notifyAvailable = false;
  try {
    await $`test -x /usr/bin/notify-send`;
    notifyAvailable = true;
  } catch {
    console.warn("notify-send not available; notifications disabled");
  }

  return {
    event: async ({ event }) => {
      if (!notifyAvailable) return;

      if (event.type === "permission.updated") {
        const { action, target } = event.data || event.properties || {};
        try {
          await $`notify-send "OpenCode" "Permission required for ${action} on ${target}" --urgency=normal`;
        } catch (error) {
          console.error("Failed to send notification:", error.message);
        }
      }
    },
  };
};
