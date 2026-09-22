#!/bin/bash
# Qwen3.6-35B-A3B on RX 9070 XT, Vulkan backend (won decode 42.6 vs 34.9 tok/s vs HIP; HIP won prefill).
# 131072 ctx verified on this machine. Run: ./serve-qwen36.sh
exec /home/nikv/llama.cpp/build/bin/llama-server \
  -m /home/nikv/models/qwen36/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf \
  --alias qwen3.6-35b --host 127.0.0.1 --port 8081 -ngl 999 -c 131072 \
  --cache-type-k q8_0 --cache-type-v q8_0 --parallel 1 \
  --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0
