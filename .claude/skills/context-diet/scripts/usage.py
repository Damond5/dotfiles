"""Which tools, skills and MCP servers are actually used (calls / sessions). Usage: usage.py [days]"""
from collections import Counter
from _common import days_arg, sessions

days = days_arg()
calls, sess, skills, n = Counter(), Counter(), Counter(), 0

for _, entries in sessions(days):
    n += 1
    seen = set()
    for e in entries:
        content = (e.get("message") or {}).get("content")
        if e.get("type") != "assistant" or not isinstance(content, list):
            continue
        for b in content:
            if b.get("type") != "tool_use":
                continue
            name = b.get("name", "?")
            key = "mcp:" + name.split("__")[1] if name.startswith("mcp__") else name
            calls[key] += 1
            seen.add(key)
            if name == "Skill":
                skills[(b.get("input") or {}).get("skill", "?")] += 1
    sess.update(seen)

print(f"window={days:g}d sessions={n}")
print(f"{'tool / server':40} {'calls':>6} {'sessions':>9}")
for k, c in calls.most_common():
    print(f"{k:40} {c:>6} {sess[k]:>9}")
print("\nskills invoked:", dict(skills.most_common()) or "none")
print("Anything in /context but absent here was never used in this window.")
