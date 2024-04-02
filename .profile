# export QT_QPA_PLATFORMTHEME="qt5ct"
export QT_QPA_PLATFORMTHEME="qt6ct"
export EDITOR=/usr/bin/helix
export VISUAL=/usr/bin/helix

# formatted output
alias date "date +'%T'"

# modern utils
alias ls exa
alias cat bat
alias du dust
alias hx helix
alias cal "rusti-cal -c -w --starting-day 1"

# rust cargo binaries
export PATH="/home/nikv/.cargo/bin:$PATH"
# local
export PATH="/home/nikv/.local/bin:$PATH"

# . "$HOME/.cargo/env"

# export GTK_THEME=Adwaita-dark
