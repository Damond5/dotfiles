"""Shared transcript iteration for context-diet scripts. Aggregate-only: callers must never print content."""
import glob, json, os, sys, time


def days_arg(default=30):
    return float(sys.argv[1]) if len(sys.argv) > 1 else default


def sessions(days):
    """Yield (path, entries) for transcripts modified within `days`."""
    cutoff = time.time() - days * 86400
    for path in glob.glob(os.path.expanduser("~/.claude/projects/**/*.jsonl"), recursive=True):
        if os.path.getmtime(path) < cutoff:
            continue
        entries = []
        for line in open(path, errors="ignore"):
            try:
                entries.append(json.loads(line))
            except ValueError:
                pass
        yield path, entries


def usage_of(e):
    return (e.get("message") or {}).get("usage") if e.get("type") == "assistant" else None


def context_size(u):
    return u.get("input_tokens", 0) + u.get("cache_creation_input_tokens", 0) + u.get("cache_read_input_tokens", 0)
