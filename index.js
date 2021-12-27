#!/usr/bin/env node

const postcss = require('postcss');
const fs = require('fs');

const chalk = require("chalk");

const red = chalk.red;
const green = chalk.bold.green;
const yellow = chalk.yellow;
const path = require('path');
const _ = require('lodash');
const { parse } = require('@vue/compiler-sfc');


const color = ['#2c3e50', '#42b983']
// 分组css 文件 和 vue 文件
const fileKeys = process.argv.slice(2)
const groupFileKeys = _.groupBy(fileKeys, (key) => {
    return _.split(key, '.')[1]
})

console.log(groupFileKeys)

const scssFiles = _.reduce(groupFileKeys.scss, (res, cur) => {
    // 处理scss文件
    res[cur] = fs.readFileSync(cur)
    return res
}, {})

const vueFiles = _.reduce(groupFileKeys.vue, (res, cur) => {
    // 处理vue 文件的style； 转buffer
    const styles = parse(
        fs.readFileSync(path.resolve(cur), 'utf-8')
    ).descriptor.styles

    const buffers = styles.map(o => {
        return Buffer.from(o.content, 'utf-8')
    })

    res[cur] = buffers

    return res
}, {})


let error = []

const abcCssPlugin = (opts => {
    const { fileName } = opts

    return {
        postcssPlugin: 'postcss-abc',
        Rule (rule) {
            validationAbcCssRule(rule, fileName)
        }
    }
});

function validationAbcCssRule(rule, fileName) {
    rule.nodes.forEach(o => {
        if (o.type === 'decl') {
            color.forEach(c => {
                if (o.value && o.value.includes(c)) {
                    error.push(`${fileName} - ${o.parent.selector} - ${o.prop}:  the value ${o.value} in theme`)
                }
            })
        }
    })
}

yellow(scssFiles)
yellow(vueFiles)

Object.keys(scssFiles).length > 0 && Object.keys(scssFiles).forEach(key => {
    postcss([abcCssPlugin({
        fileName: key
    })]).process(scssFiles[key], { from: undefined });
})

Object.keys(vueFiles).length > 0 && Object.keys(vueFiles).forEach(key => {
    vueFiles[key].forEach(b => {
        postcss([abcCssPlugin({
            fileName: key
        })]).process(b, { from: undefined });
    })
})

console.log('error:', error)



