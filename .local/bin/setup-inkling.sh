#!/usr/bin/env bash
# Local LLM: Inkling 2 Mini via Unsloth's llama.cpp prebuilt (Vulkan) for OpenCode.
# Idempotent - safe to re-run. Skips download/extract when artifacts exist.
# Called from ~/.install, or standalone. Pass --force (or -f) to re-fetch.
# Pinned: root UD-* GGUFs use Unsloth's looped layout and ONLY load on an
# Unsloth prebuilt (mainline needs Mainline_Support files + unmerged PR #32704).
# Tested: b12588-mix-c0c3de8 (upstream b12588 + Inkling 2 DSpark #32218).
# Model IQ4_XS + mmproj + no-spec + q4_0 KV @131k measured 24-30 t/s on
# RX 9070 XT 16GB + 9800X3D; draft-dspark measured SLOWER there, so unused.
set -u
FORCE=false
if [[ "${1:-}" == "--force" || "${1:-}" == "-f" ]]; then
  FORCE=true
fi
UNSLOTH_TAG="b12588-mix-c0c3de8"
PREBUILT_DIR="$HOME/llama-unsloth"
PREBUILT_BIN="$PREBUILT_DIR/llama-server"
MODEL_FILE="$HOME/models/inkling2mini/Inkling-2-Mini-UD-IQ4_XS.gguf"
MMPROJ_FILE="$HOME/models/inkling2mini/mmproj-F16.gguf"
paru -S --needed --noconfirm python-huggingface-hub
mkdir -p "$PREBUILT_DIR" ~/models/inkling2mini
if [[ $FORCE == true || ! -x $PREBUILT_BIN ]]; then
  curl -fLo "$PREBUILT_DIR/vulkan.tgz" --create-dirs \
    "https://github.com/unslothai/llama.cpp/releases/download/${UNSLOTH_TAG}/app-${UNSLOTH_TAG}-linux-x64-vulkan.tar.gz"
  tar xzf "$PREBUILT_DIR/vulkan.tgz" -C "$PREBUILT_DIR"
else
  echo "unsloth prebuilt present, skipping download"
fi
if [[ $FORCE == true || ! -f $MODEL_FILE ]]; then
  hf download unsloth/Inkling-2-Mini-GGUF Inkling-2-Mini-UD-IQ4_XS.gguf --local-dir ~/models/inkling2mini
else
  echo "model present, skipping download"
fi
if [[ $FORCE == true || ! -f $MMPROJ_FILE ]]; then
  hf download unsloth/Inkling-2-Mini-GGUF mmproj-F16.gguf --local-dir ~/models/inkling2mini
else
  echo "mmproj present, skipping download"
fi
cat > ~/.local/bin/serve-inkling.sh <<'EOF'
#!/bin/bash
exec $HOME/llama-unsloth/llama-server \
  -m $HOME/models/inkling2mini/Inkling-2-Mini-UD-IQ4_XS.gguf \
  --mmproj $HOME/models/inkling2mini/mmproj-F16.gguf \
  --alias inkling-2-mini --host 127.0.0.1 --port 8082 -ngl 999 -c 131072 \
  --cache-type-k q4_0 --cache-type-v q4_0 --parallel 1 \
  --spec-type none -fa on --jinja --temp 1.0 --top-p 1.0 --top-k 0 --min-p 0.0
EOF
chmod +x ~/.local/bin/serve-inkling.sh
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/serve-inkling.service <<'EOF'
[Unit]
Description=Inkling 2 Mini llama-server (Unsloth Vulkan)
After=network.target
Conflicts=serve-qwen36.service
[Service]
ExecStart=%h/.local/bin/serve-inkling.sh
Restart=on-failure
[Install]
WantedBy=default.target
EOF
sudo loginctl enable-linger "$USER" 2>/dev/null || true # silent no-op on non-interactive re-runs (install.sh has sudo keepalive)
systemctl --user daemon-reload
# Not enabled: the local-llm opencode plugin starts it on first prompt.
# Mutual exclusion with serve-qwen36.service via Conflicts= above.
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
cfg.setdefault("providers", {})["inkling"] = {
  "name": "Inkling 2 Mini local",
  "package": "aisdk:@ai-sdk/openai-compatible",
  "settings": {"baseURL": "http://127.0.0.1:8082/v1"},
  "models": {"inkling-2-mini": {"name": "Inkling 2 Mini UD-IQ4_XS",
    "limit": {"context": 131072, "output": 16384}}},
}
json.dump(cfg, open(p, 'w'), indent=2)
EOF
