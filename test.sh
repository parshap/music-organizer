#!/usr/bin/env sh
rm -r __test
cp -r ./test-album ./__test
bin/organize __test/
