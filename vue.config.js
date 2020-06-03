const EnvironmentPlugin = require('webpack').EnvironmentPlugin;
const packageJson = require('./package.json');

module.exports = {
    runtimeCompiler: true,
    chainWebpack: config => {
        config
            .entry('app')
            .clear()
            .add('./src/app/renderer.ts')
            .end();

        config.plugin('environment')
            .use(
                EnvironmentPlugin,
                [{ 'SPL_VERSION': packageJson.version }]
            )
    },
    pluginOptions: {
        electronBuilder: {
            mainProcessFile: 'src/main.ts',
            nodeIntegration: true,
            chainWebpackMainProcess: config => {
                config.entry('plugin-process')
                    .add('./src/plugin/process.ts')
                    .end();

                config.plugin('environment')
                    .use(
                        EnvironmentPlugin,
                        [{ 'SPL_VERSION': packageJson.version }]
                    )
            }
        }
    }
};
