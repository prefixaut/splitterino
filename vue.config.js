module.exports = {
    runtimeCompiler: true,
    chainWebpack: config => {
        config
            .entry('app')
            .clear()
            .add('./src/app/renderer.ts')
            .end();
    },
    pluginOptions: {
        electronBuilder: {
            mainProcessFile: 'src/main.ts',
            nodeIntegration: true,
            chainWebpackMainProcess: config => {
                config.entry('plugin-process')
                    .add('./src/common/plugin/process.ts')
                    .end();
            }
        }
    }
};
