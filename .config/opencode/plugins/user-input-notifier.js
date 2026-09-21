import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Plugin } from "@opencode/plugin";

const execFileAsync = promisify(execFile);

async function sendNotification(title, message) {
  try {
    await execFileAsync("notify-send", [title, message, "--urgency=normal"]);
  } catch (error) {
    console.error("Failed to send notification:", error.message);
  }
}

// Shell escape function to prevent shell injection
function shellEscape(str) {
  if (str === null || str === undefined) {
    return '""';
  }
  const strVal = String(str);
  // Escape shell metacharacters: " $` \ | ; < > ( ) { } [ ] ! # & ~ * ?
  // Also escape newlines and tabs
  const escaped = strVal
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/;/g, '\\;')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/!/g, '\\!')
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&')
    .replace(/~/g, '\\~')
    .replace(/\*/g, '\\*')
    .replace(/\?/g, '\\?')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

// Build question notification message
function buildQuestionMessage(questions, tool) {
  let message = 'A question was asked';

  // Add header if available
  const firstQuestion = questions[0];
  if (firstQuestion.header) {
    message += `:\n${firstQuestion.header}`;
  }

  // Add question text(s)
  if (firstQuestion.question) {
    // Early exit optimization: if only one question or not all have questions, show single question
    if (questions.length <= 1 || !questions.every(q => q.question)) {
      message += `\n\nQuestion: ${firstQuestion.question}`;
    } else {
      // Show all questions as a list
      message += `\n\nQuestions:\n${questions.map(q => q.question).join('\n')}`;
    }
  } else {
    // If no direct question property, join all question texts
    const questionTexts = questions.map(q => q.question).filter(Boolean);
    if (questionTexts.length > 0) {
      message += `\n\nQuestions:\n${questionTexts.join('\n')}`;
    }
  }

  // Add options information if available
  if (firstQuestion.options && Array.isArray(firstQuestion.options) && firstQuestion.options.length > 0) {
    message += `\n\nAvailable options:\n${firstQuestion.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}`;
  }

  // Add tool context if available (with validation)
  if (tool && typeof tool === 'string') {
    message += `\n\nContext: ${tool}`;
  }

  return message;
}

void shellEscape;

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
          if (event.type === "permission.asked") {
            const { permission, title, patterns, always } = event.properties || {};
            if (!permission) continue;

            let message = title || permission;
            if (patterns && Array.isArray(patterns) && patterns.length > 0) {
              message = title || patterns.join(', ');
            }

            let alwaysText = '';
            if (always && Array.isArray(always) && always.length > 0) {
              alwaysText = ` (always: ${always.join(', ')})`;
            }

            await sendNotification("OpenCode", `Permission requested: ${permission} - ${message}${alwaysText}`);
            continue;
          }

          if (event.type === "question.asked") {
            const { questions, tool } = event.properties || {};
            if (!questions || !Array.isArray(questions) || questions.length === 0) continue;
            await sendNotification("OpenCode", buildQuestionMessage(questions, tool));
          }
        }
      } catch (error) {
        if (error?.name !== "AbortError") console.error("user-input-notifier event loop failed:", error.message);
      }
    })();

    return () => controller.abort();
  },
});
