module.exports = {
    runtimeCompiler: true,
    chainWebpack: config => {
        config
            .entry('app')
            .clear()
            .add('./src/app/renderer.ts')
            .end();

        config.module
            .rule('wasm')
            .test(/\.wasm$/)
            .use('wasm-loader')
                .loader('wasm-loader')
                .end();
    },
    pluginOptions: {
        electronBuilder: {
            mainProcessFile: 'src/main.ts',
            nodeIntegration: true,
            builderOptions: {
                fileAssociations: [
                    {
                        ext: 'splits',
                        description: 'Splits file',
                    },
                ],
                appId: 'moe.prefixaut.splitterino',
                productName: 'Splitterino',
            },
        },
    },
};
