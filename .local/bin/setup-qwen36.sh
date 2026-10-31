#!/usr/bin/env bash
# Local LLM: Qwen3.6-35B-A3B via upstream llama.cpp (Vulkan) for OpenCode.
# Idempotent - safe to re-run. Skips pull/configure/build when the binary
# exists and upstream is unchanged. Called from ~/.install, or standalone.
# Pass --force (or -f) to rebuild and re-check the model download.
set -u
FORCE=false
if [[ "${1:-}" == "--force" || "${1:-}" == "-f" ]]; then
  FORCE=true
fi
BINARY="$HOME/llama.cpp/build/bin/llama-server"
MODEL_FILE="$HOME/models/qwen36/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf"
paru -S --needed --noconfirm python-huggingface-hub vulkan-headers shaderc spirv-headers cmake ninja
NEED_BUILD=false
if [[ $FORCE == true ]]; then
  if [ -d ~/llama.cpp ]; then
    git -C ~/llama.cpp pull --ff-only || true
  else
    git clone --depth 1 https://github.com/ggml-org/llama.cpp ~/llama.cpp
  fi
  NEED_BUILD=true
elif [ ! -d ~/llama.cpp ]; then
  git clone --depth 1 https://github.com/ggml-org/llama.cpp ~/llama.cpp
  NEED_BUILD=true
elif [[ ! -x $BINARY || ! -f ~/llama.cpp/build/CMakeCache.txt ]]; then
  git -C ~/llama.cpp pull --ff-only || true
  NEED_BUILD=true
elif git -C ~/llama.cpp fetch --quiet 2>/dev/null; then
  LOCAL_REV=$(git -C ~/llama.cpp rev-parse HEAD)
  REMOTE_REV=$(git -C ~/llama.cpp rev-parse '@{u}' 2>/dev/null || echo "$LOCAL_REV")
  if [[ $LOCAL_REV != "$REMOTE_REV" ]]; then
    git -C ~/llama.cpp pull --ff-only || true
    NEED_BUILD=true
  else
    echo "llama.cpp up to date, skipping rebuild"
  fi
else
  echo "Could not fetch llama.cpp upstream, skipping rebuild check" >&2
fi
if [[ $NEED_BUILD == true ]]; then
  cmake -S ~/llama.cpp -B ~/llama.cpp/build -DGGML_VULKAN=ON -DGGML_HIP=OFF -DGGML_CUDA=OFF -DCMAKE_BUILD_TYPE=Release
  cmake --build ~/llama.cpp/build --config Release -j "$(nproc)" --target llama-server
fi
mkdir -p ~/models/qwen36 ~/bin
if [[ $FORCE == true || ! -f $MODEL_FILE ]]; then
  hf download unsloth/Qwen3.6-35B-A3B-GGUF --local-dir ~/models/qwen36 --include "*UD-Q4_K_XL*"
else
  echo "model present, skipping download"
fi
cat > ~/.local/bin/serve-qwen36.sh <<'EOF'
#!/bin/bash
exec $HOME/llama.cpp/build/bin/llama-server \
  -m $HOME/models/qwen36/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf \
  --alias qwen3.6-35b --host 127.0.0.1 --port 8081 -ngl 999 -c 131072 \
  --cache-type-k q8_0 --cache-type-v q8_0 --parallel 1 \
  --spec-type ngram-mod -fa on --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0
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
import datetime, json, os, shutil
p = os.path.expanduser('~/.config/opencode/opencode.json')
try:
    cfg = json.load(open(p)) if os.path.exists(p) else {"$schema": "https://opencode.ai/config.json"}
except json.JSONDecodeError:
    bak = p + ".bak-" + datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    shutil.copy(p, bak)
    print(f"{p} is corrupt, backed up to {bak}, starting fresh")
    cfg = {"$schema": "https://opencode.ai/config.json"}
cfg.setdefault("providers", {})["llamacpp"] = {
  "name": "llama.cpp local",
  "package": "aisdk:@ai-sdk/openai-compatible",
  "settings": {"baseURL": "http://127.0.0.1:8081/v1"},
  "models": {"qwen3.6-35b": {"name": "Qwen3.6-35B-A3B UD-Q4_K_XL",
    "limit": {"context": 131072, "output": 16384}}},
}
json.dump(cfg, open(p, 'w'), indent=2)
EOF
