yarn
if [ $? -ne 0 ]; then
    exit $0
fi

yarn test:unit:coverage
if [ $? -ne 0 ]; then
    exit $0
fi

yarn build --publish=onTag --linux
if [ $? -ne 0 ]; then
    exit $0
fi