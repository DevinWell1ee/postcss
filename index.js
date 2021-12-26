const postcss = require('postcss');
const fs = require('fs');
const path = require('path')

const abcCssPlugin = (opts => {
    opts = opts || {};
    // const { colorMap } = opts;

    console.log('@@@')
    // console.log(opts)
    return {
        postcssPlugin: 'postcss-abc',
        Rule (rule) {
            // console.log(rule.nodes)
            findColorValue(rule)
        }
    }
});

const color = ['#2c3e50', '#42b983']

function findColorValue(rule) {
    rule.nodes.forEach(o => {
        if (o.type === 'decl') {
            color.forEach(c => {
                if (o.value && o.value.includes(c)) {
                    console.log(`${o.parent.selector} - ${o.prop}: warn, the value ${o.value} in theme`)
                }
            })
        }
    })
}





const css = fs.readFileSync('./src/assets/style.scss');

postcss([abcCssPlugin({

})]).process(css, { from: undefined }).then(result => {
    // console.log(result);
});

module.exports = {
    abcCssPlugin
}