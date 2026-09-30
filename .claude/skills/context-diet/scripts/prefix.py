"""Fixed prefix per session, calls by context-size bucket, billed token totals. Usage: prefix.py [days]"""
import statistics
from collections import defaultdict
from _common import days_arg, sessions, usage_of, context_size

days = days_arg()
first = defaultdict(list)
totals = defaultdict(int)
buckets = {"<50k": [0, 0], "50-100k": [0, 0], "100-200k": [0, 0], "200-400k": [0, 0], ">400k": [0, 0]}
calls = 0

for path, entries in sessions(days):
    kind = "subagent" if "/subagents/" in path else "main"
    seen_first = False
    for e in entries:
        u = usage_of(e)
        if not u:
            continue
        calls += 1
        c = context_size(u)
        if not seen_first:
            first[kind].append(c)
            seen_first = True
        for k, v in u.items():
            if isinstance(v, int):
                totals[k] += v
        b = "<50k" if c < 5e4 else "50-100k" if c < 1e5 else "100-200k" if c < 2e5 else "200-400k" if c < 4e5 else ">400k"
        buckets[b][0] += 1
        buckets[b][1] += u.get("cache_read_input_tokens", 0)

print(f"window={days:g}d api_calls={calls}")
for kind, v in first.items():
    v = [x for x in v if x] or [0]
    print(f"{kind} first-call context (fixed prefix): n={len(v)} median={statistics.median(v):,.0f} max={max(v):,}")

w = {"cache_read_input_tokens": 0.1, "cache_creation_input_tokens": 1.25, "input_tokens": 1, "output_tokens": 5}
units = {k: totals[k] * f for k, f in w.items()}
cost = sum(units.values()) or 1
print("\nbilled tokens (share of cost, relative prices):")
for k in w:
    print(f"  {k:30} {totals[k]:>15,}  {100 * units[k] / cost:5.1f}%")

reads = sum(r for _, r in buckets.values()) or 1
print("\ncalls by context size:")
for k, (n, r) in buckets.items():
    print(f"  {k:9} calls={n:6} ({100 * n / max(calls, 1):4.1f}%)  cache_read={100 * r / reads:5.1f}%")
