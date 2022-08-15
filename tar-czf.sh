#!/usr/bin/env bash

tar cf - $1 -P | pv -s $(du -sb $1 | awk '{print $1}') | pigz > $1.tar.gz
