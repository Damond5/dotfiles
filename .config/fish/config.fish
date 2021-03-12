set fish_greeting


fish_vi_key_bindings


# ALIASES
alias cp="cp -i"                          # confirm before overwriting something
alias mv="mv -i"                          # confirm before overwriting something
alias df="df -h"                          # human-readable sizes
alias du="du -h"                          # human-readable sizes

alias date="date +'%T'"
alias cal="cal -y"

# alias for qpdfview that also disowns the process
function pdf
  command qpdfview $argv &; disown
end


# opam configuration
source /home/nikv/.opam/opam-init/init.fish > /dev/null 2 > /dev/null; or true


# run last command as sudo
function sudo
  if test "$argv" = !!
    eval command sudo $history[1]
  else
    command sudo $argv
  end
end


# MANPAGER
set -x MANPAGER '/bin/bash -c "vim -MRn -c \"set buftype=nofile showtabline=0 ft=man ts=8 nomod nolist norelativenumber nonu noma\" -c \"normal L\" -c \"nmap q :qa<CR>\"</dev/tty <(col -b)"'
