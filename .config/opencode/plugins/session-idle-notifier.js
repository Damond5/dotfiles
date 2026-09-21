import { Plugin } from "@opencode/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default Plugin.define({
  id: "session-idle-notifier",
  setup(ctx) {
    const controller = new AbortController();
    let notifyAvailable = false;

    void (async () => {
      try {
        await execFileAsync("notify-send", ["--version"]);
        notifyAvailable = true;
      } catch {
        console.warn("notify-send not available; notifications disabled");
      }

      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (!event || event.type !== "session.idle") continue;
          if (!notifyAvailable) continue;

          try {
            const sessionID = event.properties?.sessionID;
            if (!sessionID) {
              console.warn("No sessionID provided in event properties");
              continue;
            }

            // Filter out subagent sessions via API, with property fallback
            try {
              const session = await ctx.session.get({ sessionID });
              if (!session) {
                console.log("No session found for ID:", sessionID);
                continue;
              }
              if (session.parentID) continue;
            } catch (apiError) {
              console.warn(
                "Failed to get session via API, falling back to property-based detection:",
                apiError.message,
              );
              const props = event.properties || {};
              if (props.parentID || props.agent?.mode === "subagent") continue;
            }

            await execFileAsync("notify-send", ["OpenCode", "Session is idle", "--urgency=normal"]);
          } catch (error) {
            console.error("Failed to send idle notification:", {
              message: error.message,
              stack: error.stack,
            });
          }
        }
      } catch (error) {
        if (error?.name !== "AbortError" && error?.code !== "ABORT_ERR") console.error(error);
      }
    })();

    return () => controller.abort();
  },
});
