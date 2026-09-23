#!/usr/bin/env bash
# Local LLM: Qwen3.6-35B-A3B via upstream llama.cpp (Vulkan) for OpenCode.
# Idempotent - safe to re-run. Called from ~/.install, or standalone.
set -u
paru -S --needed --noconfirm python-huggingface-hub vulkan-headers shaderc spirv-headers cmake ninja
if [ -d ~/llama.cpp ]; then
  git -C ~/llama.cpp pull --ff-only
else
  git clone --depth 1 https://github.com/ggml-org/llama.cpp ~/llama.cpp
fi
cmake -S ~/llama.cpp -B ~/llama.cpp/build -DGGML_VULKAN=ON -DGGML_HIP=OFF -DGGML_CUDA=OFF -DCMAKE_BUILD_TYPE=Release
cmake --build ~/llama.cpp/build --config Release -j "$(nproc)" --target llama-server
mkdir -p ~/models/qwen36 ~/bin
hf download unsloth/Qwen3.6-35B-A3B-GGUF --local-dir ~/models/qwen36 --include "*UD-Q4_K_XL*"
cat > ~/.local/bin/serve-qwen36.sh <<'EOF'
#!/bin/bash
exec $HOME/llama.cpp/build/bin/llama-server \
  -m $HOME/models/qwen36/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf \
  --alias qwen3.6-35b --host 127.0.0.1 --port 8081 -ngl 999 -c 131072 \
  --cache-type-k q8_0 --cache-type-v q8_0 --parallel 1 \
  --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0
EOF
chmod +x ~/.local/bin/serve-qwen36.sh
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/serve-qwen36.service <<'EOF'
[Unit]
Description=Qwen3.6-35B-A3B llama-server (Vulkan)
After=network.target
[Service]
ExecStart=%h/.local/bin/serve-qwen36.sh
Restart=on-failure
[Install]
WantedBy=default.target
EOF
sudo loginctl enable-linger "$USER"
systemctl --user daemon-reload
# Not enabled: the local-llm opencode plugin starts it on first prompt.
python3 - <<'EOF'
import json, os
p = os.path.expanduser('~/.config/opencode/opencode.json')
cfg = json.load(open(p)) if os.path.exists(p) else {"$schema": "https://opencode.ai/config.json"}
cfg.setdefault("providers", {})["llamacpp"] = {
  "name": "llama.cpp local",
  "package": "aisdk:@ai-sdk/openai-compatible",
  "settings": {"baseURL": "http://127.0.0.1:8081/v1"},
  "models": {"qwen3.6-35b": {"name": "Qwen3.6-35B-A3B UD-Q4_K_XL",
    "limit": {"context": 131072, "output": 16384}}},
}
json.dump(cfg, open(p, 'w'), indent=2)
EOF
