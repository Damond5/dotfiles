#!/usr/bin/env bash

hostname=$(hostnamectl hostname)
if [[ $hostname == "work" ]] then
  redshift -O 3000
else
  redshift -O 2500
fi
