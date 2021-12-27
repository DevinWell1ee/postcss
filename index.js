#!/usr/bin/env node

const postcss = require('postcss');
const fs = require('fs');
// const path = require('path')

let error = []

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
                    error.push(`${o.parent.selector} - ${o.prop}: warn, the value ${o.value} in theme`)
                }
            })
        }
    })
}

const css = fs.readFileSync('./src/assets/style.scss');

postcss([abcCssPlugin({

})]).process(css, { from: undefined }).then(result => {
    // console.log(result);
    if (error.length > 0) {
        error.forEach(err => {
            console.error(err)
        })

        error = []

        process.exit(1)
    } else {
        process.exit(0)
    }

});