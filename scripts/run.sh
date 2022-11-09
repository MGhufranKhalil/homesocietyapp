#!/bin/bash

source scripts/version

# can provide first argument as 'md', 'ios', or 'auto'
export F7THEME=${1:-md}

php -S 0.0.0.0:8000 -t server/ 2>/dev/null &

npm run start
