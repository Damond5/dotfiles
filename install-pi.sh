#!/usr/bin/env bash
# Pi Zero 2 W - minimal WoL proxy only. Run on the Pi.
set -euo pipefail

PC_MAC="bc:fc:e7:19:9c:fb"
BROADCAST="192.168.87.255"
ROUTER="192.168.87.1"

sudo apt update
sudo apt full-upgrade -y
sudo apt install -y wakeonlan rfkill

# Bluetooth off (saves ~0.1W, unused)
sudo systemctl disable bluetooth hciuart --now 2>/dev/null || true
sudo rfkill block bluetooth || true

# Camera / display / audio off + disable BT overlay. Camera ribbon should
# also be physically unplugged for 0W.
CFG=/boot/firmware/config.txt
[ -f "$CFG" ] || CFG=/boot/config.txt
for line in "camera_auto_detect=0" "display_auto_detect=0" "dtparam=audio=off" "dtoverlay=disable-bt" "dtparam=act_led_trigger=none" "dtparam=act_led_activelow=on"; do
  grep -qxF "$line" "$CFG" || echo "$line" | sudo tee -a "$CFG" >/dev/null
done
grep -qxF "dtparam=act_led_activelow=on" "$CFG" || sudo sed -i 's/^dtparam=act_led_activelow=.*/dtparam=act_led_activelow=on/' "$CFG"
grep -q "^\[all\]" "$CFG" || echo -e "\n[all]" | sudo tee -a "$CFG" >/dev/null

# ACT LED off at runtime too (kernel names it ACT, not led0) + persist via unit
printf '%s\n' '[Unit]' 'Description=Disable ACT LED' 'After=multi-user.target' '' '[Service]' 'Type=oneshot' 'ExecStart=/bin/sh -c "echo none > /sys/class/leds/ACT/trigger; echo 0 > /sys/class/leds/ACT/brightness"' '' '[Install]' 'WantedBy=multi-user.target' | sudo tee /etc/systemd/system/disable-act-led.service >/dev/null
sudo systemctl enable --now disable-act-led.service || true

# WiFi reliability over max saving: disable powersave globally
# (avoids per-connection name issues like 'preconfigured' not found)
echo -e "[connection]\nwifi.powersave=2" | sudo tee /etc/NetworkManager/conf.d/wifi-powersave-off.conf >/dev/null

# Tailscale
if ! command -v tailscale >/dev/null; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi
sudo systemctl enable --now tailscaled
# interactive login if not already up:
tailscale status &>/dev/null || sudo tailscale up

# WoL script
sudo tee /usr/local/bin/wol >/dev/null <<EOF
#!/bin/sh
/usr/bin/wakeonlan -i $BROADCAST $PC_MAC
EOF
sudo chmod +x /usr/local/bin/wol

# Auto-wake gamer PC on SSH login
grep -q '# auto-wol-on-ssh' ~/.bashrc 2>/dev/null || printf '%s\n' '' '# auto-wol-on-ssh' 'if [ -n "$SSH_CONNECTION" ]; then' '  wol' 'fi' >> ~/.bashrc

# Self-heal WiFi: reapply on gateway ping fail (runs on Pi, bash cron)
(crontab -l 2>/dev/null; echo "*/5 * * * * ping -c2 $ROUTER >/dev/null 2>&1 || nmcli device reapply wlan0") | awk '!seen[$0]++' | crontab -

echo "OK. Verify: vcgencmd get_camera (want supported=0), tailscale ip -4, wol"
