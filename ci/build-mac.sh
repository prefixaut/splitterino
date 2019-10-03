yarn
if [ $? -ne 0 ]; then
    exit $0
fi

yarn test:unit
if [ $? -ne 0 ]; then
    exit $0
fi

yarn build --publish=onTag --mac
if [ $? -ne 0 ]; then
    exit $0
fi