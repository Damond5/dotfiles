#!/bin/sh

# sudo sh -c "cat $1 | pv -s $(du -sb $1 | awk '{print $2}') > $2; sync"
sudo sh -c "cat $1 | pv -s $(du -sb $1) > $2"
# sudo sh -c "cat $1 | pv > $2; sync"
