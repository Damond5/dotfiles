#!/bin/bash
# Stop local LLM servers to free VRAM/RAM (e.g. before gaming).
systemctl --user stop serve-qwen36.service serve-inkling.service 2>/dev/null
echo "qwen:    $(systemctl --user is-active serve-qwen36.service)"
echo "inkling: $(systemctl --user is-active serve-inkling.service)"
