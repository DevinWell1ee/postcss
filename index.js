#!/usr/bin/env node

const postcss = require('postcss');
const fs = require('fs');

const chalk = require("chalk");

const red = chalk.red;
const green = chalk.bold.green;
const yellow = chalk.yellow;
const path = require('path');

const fileKeys = process.argv.slice(2)
console.log(yellow(fileKeys))

const { parse } = require('@vue/compiler-sfc');
console.log(parse(
    fs.readFileSync('./src/App.vue', 'utf-8')
))

const files = fileKeys.map(key => fs.readFileSync(path.resolve(key)))

let error = []

const abcCssPlugin = (opts => {
    opts = opts || {};

    yellow(opts);

    return {
        postcssPlugin: 'postcss-abc',
        Rule (rule) {
            console.log(rule)
            validationAbcCssRule(rule)
        }
    }
});

const css = fs.readFileSync('./src/assets/style.scss')
console.log(css)

const color = ['#2c3e50', '#42b983']

function validationAbcCssRule(rule) {
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


postcss([abcCssPlugin({})]).process(css, { from: undefined }).then(result => {
    if (error.length > 0) {
        error.forEach((err, index) => {
            console.log(red(`${index}、${err}`))
        })

        error = []

        process.exit(1)
    } else {
        console.log(green('validate success !!!'))
        process.exit(0)
    }
});