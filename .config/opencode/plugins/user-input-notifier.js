import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Plugin } from "@opencode/plugin";

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

async function sendNotification(title, message) {
  try {
    await execFileAsync("notify-send", [title, message, "--urgency=normal"]);
  } catch (error) {
    console.error("Failed to send notification:", error.message);
  }
}

// Build a notification message for a v2 `permission.asked` event.
function buildPermissionMessage({ action, resources, message }) {
  let text = `Permission requested: ${action || "unknown"}`;
  if (Array.isArray(resources) && resources.length > 0) {
    text += `\n${resources.join("\n")}`;
  }
  if (message) text += `\n\n${message}`;
  return text;
}

// Build a notification message for a v2 `form.created` event (the question tool).
function buildFormMessage(form) {
  let message = form.title || "A question was asked";

  const fields = Array.isArray(form.fields) ? form.fields : [];
  const lines = fields
    .map((field) => field.title || field.description || field.key)
    .filter(Boolean);
  if (lines.length > 0) message += `\n\n${lines.join("\n")}`;

  const firstWithOptions = fields.find((field) => Array.isArray(field.options) && field.options.length > 0);
  if (firstWithOptions) {
    message += `\n\nAvailable options:\n${firstWithOptions.options
      .map((option, index) => `${index + 1}. ${option.label ?? option.value}`)
      .join("\n")}`;
  }

  return message;
}

export default Plugin.define({
  id: "user-input-notifier",
  async setup(ctx) {
    try {
      await execFileAsync("test", ["-x", "/usr/bin/notify-send"]);
    } catch {
      console.warn("notify-send not available; notifications disabled");
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          // v2 events carry their payload under `data`, not `properties`.
          if (event.type === "permission.asked") {
            const permission = event.data;
            if (!permission?.action) continue;
            if (isDuplicate(event.id)) continue;
            await sendNotification("OpenCode", buildPermissionMessage(permission));
            continue;
          }

          if (event.type === "form.created") {
            const form = event.data?.form;
            if (!form) continue;
            if (isDuplicate(event.id)) continue;
            await sendNotification("OpenCode", buildFormMessage(form));
          }
        }
      } catch (error) {
        if (error?.name !== "AbortError") console.error("user-input-notifier event loop failed:", error.message);
      }
    })();

    return () => controller.abort();
  },
});
