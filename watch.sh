#!/bin/bash

echo "watching src 👀"
fswatch -o ./src/ | xargs -n1 -I{} ./build.sh

