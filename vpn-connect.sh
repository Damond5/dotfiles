#!/usr/bin/env bash

sudo tailscale up --login-server=https://headscale.nordbo.io --accept-routes --accept-dns
tailscale status | head -1
