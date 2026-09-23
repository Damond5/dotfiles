import { Plugin } from "@opencode/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// opencode instantiates a global plugin once per known location, and every
// instance receives the same broadcast events. Dedupe globally by event id so
// one event produces one notification.
const SEEN_KEY = Symbol.for("opencode.notifier.seen");
const seen = (globalThis[SEEN_KEY] ??= new Map());

function isDuplicate(id) {
  const now = Date.now();
  if (seen.size > 500) for (const [key, at] of seen) if (now - at > 60_000) seen.delete(key);
  if (seen.has(id)) return true;
  seen.set(id, now);
  return false;
}

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
          if (!notifyAvailable) continue;

          // v2 does not reliably emit `session.idle`/`session.status`; the run-end
          // signals are `session.execution.succeeded` / `session.execution.failed`.
          // Keep the idle ones for forward compatibility.
          const type = event?.type;
          const idle =
            type === "session.execution.succeeded" ||
            type === "session.idle" ||
            (type === "session.status" && event.data?.status?.type === "idle");
          const failed = type === "session.execution.failed";
          if (!idle && !failed) continue;
          if (isDuplicate(event.id ?? `${event.data?.sessionID}:${event.created}`)) continue;

          try {
            const sessionID = event.data?.sessionID;
            if (!sessionID) continue;

            // Skip subagent sessions.
            const session = await ctx.session.get({ sessionID });
            if (!session || session.parentID) continue;

            await execFileAsync("notify-send", [
              "OpenCode",
              failed ? "Session failed" : "Session is idle",
              "--urgency=normal",
            ]);
          } catch (error) {
            console.error("Failed to send session notification:", error.message);
          }
        }
      } catch (error) {
        if (error?.name !== "AbortError" && error?.code !== "ABORT_ERR") console.error(error);
      }
    })();

    return () => controller.abort();
  },
});
