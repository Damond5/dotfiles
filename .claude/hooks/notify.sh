#!/usr/bin/env python3
"""Desktop notifications for Claude Code, mirroring the opencode plugins in
~/.config/opencode/plugins/ (session-idle-notifier.js, user-input-notifier.js).

Look matches opencode: summary is the app name, body is the message, urgency
normal, no icon, no replace-hint (so they stack and persist under dunst's
timeout = 0).  No sound -- opencode plays none.

Usage: notify.sh <Notification|Stop|Question>
"""
import json
import os
import subprocess
import sys
import time

APP = "Claude Code"
NOTIFY = "/usr/bin/notify-send"

# AskUserQuestion fires PreToolUse *and* a generic permission_prompt Notification
# whose payload carries no tool name, so the two can't be told apart by matcher.
# The Question branch drops this marker; the permission branch consumes it and
# stays quiet, leaving only the richer question notification.
MARKER = "/tmp/claude-notify-question.marker"
MARKER_TTL = 10


def notify(message, urgency="normal"):
    if not os.access(NOTIFY, os.X_OK):
        print("notify-send not available; notifications disabled", file=sys.stderr)
        return
    subprocess.run([NOTIFY, APP, message, f"--urgency={urgency}"], check=False)


def build_question_message(questions, tool):
    """Port of buildQuestionMessage() from user-input-notifier.js."""
    message = "A question was asked"
    first = questions[0]

    if first.get("header"):
        message += f":\n{first['header']}"

    if first.get("question"):
        if len(questions) <= 1 or not all(q.get("question") for q in questions):
            message += f"\n\nQuestion: {first['question']}"
        else:
            joined = "\n".join(q["question"] for q in questions)
            message += f"\n\nQuestions:\n{joined}"
    else:
        texts = [q["question"] for q in questions if q.get("question")]
        if texts:
            message += "\n\nQuestions:\n" + "\n".join(texts)

    options = first.get("options")
    if isinstance(options, list) and options:
        labels = [o.get("label", str(o)) if isinstance(o, dict) else str(o) for o in options]
        listed = "\n".join(f"{i + 1}. {label}" for i, label in enumerate(labels))
        message += f"\n\nAvailable options:\n{listed}"

    if isinstance(tool, str) and tool:
        message += f"\n\nContext: {tool}"

    return message


def main():
    event = sys.argv[1] if len(sys.argv) > 1 else "Notification"
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}


    if event == "Stop":
        # Equivalent of opencode's session.idle.  Claude Code only fires Stop for
        # the top-level agent (subagents get SubagentStop, unhooked), which is what
        # session-idle-notifier.js achieves via its parentID check.
        notify("Session is idle")

    elif event == "Question":
        # Equivalent of opencode's question.asked.
        questions = (data.get("tool_input") or {}).get("questions")
        if isinstance(questions, list) and questions:
            open(MARKER, "w").close()
            notify(build_question_message(questions, data.get("tool_name")))

    else:
        # Equivalent of opencode's permission.asked.  The settings.json matcher
        # already filters on notification_type, so idle_prompt never reaches here
        # (the Stop hook covers idle).
        message = data.get("message") or ""
        title = data.get("title") or ""
        ntype = data.get("notification_type") or ""

        if os.path.exists(MARKER):
            fresh = time.time() - os.path.getmtime(MARKER) < MARKER_TTL
            os.unlink(MARKER)
            if fresh:
                return

        if ntype.startswith("elicitation"):
            body = message or title or "Input requested"
        else:
            body = f"Permission requested: {message or title}" if (message or title) \
                else "Permission requested"
        notify(body)


if __name__ == "__main__":
    main()
