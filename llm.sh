#!/usr/bin/env bash

read prompt
prompt=${prompt}$'\n'
prompt=${prompt}$'\n'
prompt="${prompt}only code"
prompt=${prompt}$'\n'
prompt=${prompt}$'\n'
prompt="${prompt}no example"
prompt=${prompt}$'\n'
prompt=${prompt}$'\n'
prompt="${prompt}no main"
prompt=${prompt}$'\n'
prompt=${prompt}$'\n'
prompt="${prompt}language:"
prompt=${prompt}$'\n'
prompt="${prompt}$1"
# prompt=${prompt}$'\n'
# prompt=${prompt}$'\n'
# prompt="${prompt}context:"
# prompt=${prompt}$'\n'
# prompt="${prompt}$(fd --extension c --exec bat)"

# prompt="Use the following code as context to write the requested code at the end. Only provide the code. Do not provide any examples of how to use the code. Do not provide a main functinon to run the code. Don't give any explanation. Don't give any examples. If you dont know how to write the requested code, just respond with error, don' try to make up an answer."
# prompt=${prompt}$'\n'
# prompt=${prompt}$'\n'
# prompt="${prompt}$(fd --extension c --exec bat)"
# prompt=${prompt}$'\n'
# prompt=${prompt}$'\n'
# prompt=${prompt}$'\n'
# prompt="${prompt}Requested code:"
# prompt=${prompt}$'\n'
# prompt="${prompt}function fibonacci, in c"

# echo "$prompt"

# ollama run llama3.1:latest "${prompt}" | sed 1d | head -n -2
# ollama run llama3.1:latest "${prompt}"

ollama run codegemma "${prompt}" | sed 1d | head -n -2
# ollama run codegemma "${prompt}"
