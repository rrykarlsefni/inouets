#!/bin/bash
msg=${1:-update}
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "master" ]; then
  exit 1
fi
git add .
git commit -m "$msg" || true
git pull origin master --rebase || git pull origin master --rebase --autostash
git push origin master