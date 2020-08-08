#!/bin/bash
for i in {3600..0}
do
  sleep 1
  clear
  echo $i
done
systemctl suspend
