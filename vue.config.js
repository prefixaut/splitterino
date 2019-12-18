module.exports = {
    runtimeCompiler: true,
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                fileAssociations: [
                    {
                        ext: "splits",
                        description: "Splits file"
                    }
                ],
                appId: "moe.prefixaut.splitterino",
                productName: "Splitterino",
            }
        }
    }
};
