const postcss = require('postcss');
const chalk = require("chalk");
const red = chalk.red;
const yellow = chalk.yellow


module.exports = class AbcWebpackCssPlugin {
    constructor(options) {
        this.options = options;

        this.compiler = null;
        this.compilation = null;

        this.cssCollection = []
    }

    apply(compiler) {
        this.compiler = compiler;

        if (compiler.hooks) {
            compiler.hooks.afterEmit.tapAsync('AbcWebpackCssPlugin', this.start.bind(this));

        } else {
            compiler.plugin('afterEmit', this.start.bind(this));


        }
    }

    start(compilation, callback) {
        this.compilation = compilation;
        const promises = Object.keys(compilation.assets)
            .filter(key => key.endsWith('.css'))
            .map(key => {
                return postcss([this.cssPlugin({})]).process(Buffer.from(compilation.assets[key].source()), { from: undefined })
            })

        Promise.all(promises)
            .then(() => {
                this.cssCollection = []
                callback();
            })
    }

    cssPlugin() {
        return (root) => {
            root.walkRules((rule) => {
                // 对于相同值的rule， 会以逗号分割进行合并
                if (this.cssCollection.length < 1) {
                    this.cssCollection = [...rule.selector.split(',')]
                } else {
                    const r = rule.selector.split(',')

                    r.forEach(o => {
                        if (this.cssCollection.includes(o)) {
                            console.log(red(`选择器：【${o}】 may cause conflict.`))
                        } else {
                            this.cssCollection.push(o)
                        }
                    })
                }
            })
        }
    }
};
