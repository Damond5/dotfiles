export QT_QPA_PLATFORMTHEME="qt5ct"
export EDITOR=/usr/bin/vim


# ### i3 space as mod
# # Map an unused modifier's keysym to the spacebar's keycode and make it a
# # control modifier. It needs to be an existing key so that emacs won't
# # spazz out when you press it. Hyper_L is a good candidate.
# spare_modifier="Hyper_L"
# xmodmap -e "keycode 65 = $spare_modifier"
#
# # Map space to an unused keycode (to keep it around for xcape to
# # use).
# xmodmap -e "keycode any = space"
#
# # Finally use xcape to cause the space bar to generate a space when tapped.
# xcape -e "$spare_modifier=space"
