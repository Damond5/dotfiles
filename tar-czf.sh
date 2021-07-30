#!/bin/sh

tar cf - $2 -P | pv -s $(du -sb $2 | awk '{print $1}') | pigz > $1
