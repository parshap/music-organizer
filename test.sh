#!/usr/bin/env sh
rm -r __test
cp -r ./test-album ./__test
node ./bin/ao __test/
