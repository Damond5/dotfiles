#!/usr/bin/env bash

mv $1 $1.gz
gzip -d $1.gz
