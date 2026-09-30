"""What the conversation is made of, weighted by how many later calls re-read it. Usage: composition.py [days]"""
import json, re
from collections import defaultdict
from _common import days_arg, sessions

days = days_arg()
chars, weighted = defaultdict(int), defaultdict(int)

for _, entries in sessions(days):
    names, items, api_calls = {}, [], 0
    for e in entries:
        if e.get("type") == "assistant" and (e.get("message") or {}).get("usage"):
            api_calls += 1
        a = e.get("attachment")
        if a and a.get("type") != "prompt_snapshot":
            key = "attach:" + str(a.get("type")) + (":" + a["hookEvent"] if a.get("hookEvent") else "")
            items.append((key, len(json.dumps(a)), api_calls))
            continue
        content = (e.get("message") or {}).get("content")
        role = e.get("type")
        if isinstance(content, str):
            items.append((f"{role}_text", len(content), api_calls))
            continue
        for b in content or []:
            t = b.get("type")
            if t == "tool_use":
                names[b.get("id")] = b.get("name", "?")
                items.append(("tool_use_input", len(json.dumps(b.get("input"))), api_calls))
            elif t == "tool_result":
                c = b.get("content")
                n = len(c) if isinstance(c, str) else sum(len(x.get("text", "")) for x in c or [] if isinstance(x, dict))
                name = names.get(b.get("tool_use_id"), "?")
                name = "mcp:" + name.split("__")[1] if name.startswith("mcp__") else name
                items.append(("result:" + name, n, api_calls))
            elif t in ("text", "thinking"):
                items.append((f"{role}_{t}", len(b.get(t) or ""), api_calls))
    for key, n, at in items:
        chars[key] += n
        weighted[key] += n * max(api_calls - at, 0)

tc, tw = sum(chars.values()) or 1, sum(weighted.values()) or 1
print(f"window={days:g}d  re-read tokens ~{tw / 4:,.0f} (chars/4)")
print(f"{'source':44} {'chars':>12} {'%chars':>7} {'%re-read':>9}")
for k in sorted(chars, key=lambda k: -weighted[k])[:25]:
    print(f"{k:44} {chars[k]:>12,} {100 * chars[k] / tc:>6.1f}% {100 * weighted[k] / tw:>8.1f}%")
