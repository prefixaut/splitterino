#!/bin/sh

curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
if [ $? -ne 0 ]; then
    exit $0
fi

chmod +x ./cc-test-reporter
if [ $? -ne 0 ]; then
    exit $0
fi

./cc-test-reporter before-build
if [ $? -ne 0 ]; then
    exit $0
fi