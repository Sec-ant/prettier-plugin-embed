#!/usr/bin/env bash

BIOME_VERSION=$(node -p "require('@biomejs/biome/package.json').version")
npm i -DE biome-cli-codesandbox@$BIOME_VERSION

npm pkg set scripts.lint="BIOME_BINARY=biome-cli-codesandbox/biome $(npm pkg get scripts.lint | sed -e 's/^"//' -e 's/"$//')"
npm pkg set scripts['format:biome']="BIOME_BINARY=biome-cli-codesandbox/biome $(npm pkg get scripts['format:biome'] | sed -e 's/^"//' -e 's/"$//')"
npm pkg set scripts['check:biome']="BIOME_BINARY=biome-cli-codesandbox/biome $(npm pkg get scripts['check:biome'] | sed -e 's/^"//' -e 's/"$//')"