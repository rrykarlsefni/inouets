#!/bin/bash
msg=${1:-update}
git add .
git commit -m "$msg"
git push origin master