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

      // Handle new SDK v1.1.1 permission.asked event
      if (event.type === "permission.asked") {
        const { permission, title, patterns, always } = event.properties || {};
        if (!permission) return;
        
        // Build notification message based on available fields
        let message = title || permission;
        if (patterns && Array.isArray(patterns) && patterns.length > 0) {
          message = title || patterns.join(', ');
        }
        
        // Add information about always-approved patterns
        let alwaysText = '';
        if (always && Array.isArray(always) && always.length > 0) {
          alwaysText = ` (always: ${always.join(', ')})`;
        }
        
        try {
          await $`notify-send "OpenCode" "Permission requested: ${permission} - ${message}${alwaysText}" --urgency=normal`;
        } catch (error) {
          console.error("Failed to send notification:", error.message);
        }
        return;
      }

      // Backward compatibility: handle legacy permission.updated event
      if (event.type === "permission.updated") {
        const { type, title, pattern } = event.properties || {};
        if (!type) return;
        const message = title || pattern || type;
        try {
          await $`notify-send "OpenCode" "Permission update: ${type} - ${message}" --urgency=normal`;
        } catch (error) {
          console.error("Failed to send notification:", error.message);
        }
        return;
      }
    },
  };
};
