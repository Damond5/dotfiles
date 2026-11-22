#!/bin/bash
exec $HOME/llama-unsloth/llama-server \
  -m $HOME/models/inkling2mini/Inkling-2-Mini-UD-IQ4_XS.gguf \
  --mmproj $HOME/models/inkling2mini/mmproj-F16.gguf \
  --alias inkling-2-mini --host 127.0.0.1 --port 8082 -ngl 999 -c 131072 \
  --cache-type-k q4_0 --cache-type-v q4_0 --parallel 1 \
  --spec-type none -fa on --jinja --temp 1.0 --top-p 1.0 --top-k 0 --min-p 0.0
