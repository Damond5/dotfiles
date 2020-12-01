set fish_greeting


# ALIASES
alias cp="cp -i"                          # confirm before overwriting something
alias mv="mv -i"                          # confirm before overwriting something
alias df="df -h"                          # human-readable sizes
alias du="du -h"                          # human-readable sizes

alias date="date -R"
alias cal="cal -y"

alias pdf="qpdfview"


# opam configuration
source /home/nikv/.opam/opam-init/init.fish > /dev/null 2> /dev/null; or true


# fuck command to fix typo's and more
thefuck --alias | source


# run last command as sudo
function sudo
  if test "$argv" = !!
    eval command sudo $history[1]
  else
    command sudo $argv
  end
end
