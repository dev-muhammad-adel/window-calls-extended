#!/bin/sh

if [ ! -f extension.js ]; then exit; fi
if [ ! -f metadata.json ]; then exit; fi

version=$(cat metadata.json|grep \"version\"|awk -e '{print $2}'|tr -d ',')
name="window-monitor-pro@muhammed.hussien2030.gmail.com.v${version}.shell-extension.zip"

zip $name extension.js metadata.json Readme.md
