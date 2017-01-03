#!/bin/bash

npm run jsdoc

pushd jsdoc

git init
git remote add jsdoc git@github.com:tfennelly/jenkins-js-storage.git
git fetch --depth=1 jsdoc gh-pages

git add --all
git commit -m "jsdoc"
git merge --no-edit -s ours remotes/jsdoc/gh-pages

git push jsdoc master:gh-pages

rm -rf .git

popd