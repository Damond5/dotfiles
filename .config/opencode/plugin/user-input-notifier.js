export const UserInputNotifier = async ({ $, directory }) => {
  // Check if notify-send is available
  let notifyAvailable = false;
  try {
    await $`test -x /usr/bin/notify-send`;
    notifyAvailable = true;
  } catch {
    console.warn("notify-send not available; notifications disabled");
  }

  return {
    event: async ({ event }) => {
      if (!event || event.type !== "input.required") return;
      if (!notifyAvailable) return;

      try {
        await $`notify-send "OpenCode" "User input required" --urgency=normal`;
      } catch (error) {
        console.error("Failed to send input notification:", error.message);
      }
    },
  };
};
