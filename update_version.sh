#!/bin/bash

# updates the version number in the following files:
# - package.json

# get the version number from the command line argument
VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

# update the version number in package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

