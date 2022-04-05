#!/bin/bash
# download and install latest geckodriver for linux or mac.
# required for selenium to drive a firefox browser.

# sourced from https://gist.github.com/cgoldberg/4097efbfeb40adf698a7d05e75e0ff51

install_dir="/usr/local/bin"
json=$(curl -s https://api.github.com/repos/mozilla/geckodriver/releases/latest)
url=$(echo "$json" | jq -r '.assets[].browser_download_url | select(contains("linux64")) | select(contains("asc") | not)')

echo "Downloading geckodriver from $url"
curl -s -L "$url" | tar -xz -C $install_dir
chmod +x "$install_dir/geckodriver"
echo "Installed geckodriver binary in $install_dir"