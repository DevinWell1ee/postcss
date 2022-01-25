
module.exports = {
    publicPath: '/',
    outputDir: 'dist',
    parallel: false,
    productionSourceMap: false,
    css: {
        extract: true
    },
    chainWebpack(config) {
        config.plugins.delete('prefetch');

        config.plugins.delete('preload');
    },
};
