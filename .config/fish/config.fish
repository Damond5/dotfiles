set fish_greeting


fish_vi_key_bindings


source ~/.profile


# ALIASES
alias cp="cp -i" # confirm before overwriting something
alias mv="mv -i" # confirm before overwriting something
alias df="df -h" # human-readable sizes
alias du="du -h" # human-readable sizes

# alias to open pdf that also disowns the process
function pdf
    command evince $argv &
    disown
end

# alias to open image that also disowns the process
function img
    command eog $argv &
    disown
end


# # opam configuration
if test -e /home/nikv/.opam/opam-init/init.fish
    source /home/nikv/.opam/opam-init/init.fish >/dev/null 2 >/dev/null; or true
end


# run last command as sudo
function sudo
    if test "$argv" = !!
        eval command sudo $history[1]
    else
        command sudo $argv
    end
end


# MANPAGER
# set -x MANPAGER '/bin/bash -c "vim -MRn -c \"set buftype=nofile showtabline=0 ft=man ts=8 nomod nolist norelativenumber nonu noma\" -c \"normal L\" -c \"nmap q :qa<CR>\"</dev/tty <(col -b)"'


# PROMPT
starship init fish | source

# SSH-AGENT (GITUI)
eval (ssh-agent -c | head -n2)
ssh-add -q
