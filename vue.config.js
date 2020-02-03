module.exports = {
    runtimeCompiler: true,
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
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
