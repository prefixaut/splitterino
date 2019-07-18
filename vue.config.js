module.exports = {
    runtimeCompiler: true,
    chainWebpack: config => {
        if (process.env.NODE_ENV !== 'production') {
            config.module
                .rule('istanbul')
                .test(/\.(js|vue|ts)$/)
                .enforce('post')
                .include.add(/src$/)
                .end()
                .use('istanbul-instrumenter-loader')
                .loader('istanbul-instrumenter-loader')
                .options({ esModules: true })
                .end();
        }
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                fileAssociations: [
                    {
                        ext: "splits",
                        description: "Splits file"
                    }
                ]
            }
        }
    }
};
