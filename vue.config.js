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
                publish: {
                    provider: "github",
                    owner: "prefixaut",
                    repo: "splitterino",
                    releaseType: "release"
                },
            }
        }
    }
};
