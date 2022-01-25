#!/usr/bin/env node

// Root：根节点，代表一个css文件
// AtRule：以@开头的申明，比如@charset "UTF-8"或@media (screen) {}
// Rule：内部包含定义的选择器，比如input, button {}
// Declaration：key-value键值对，比如color: black;
// Comment：单独的注释。selectors、at-rule的参数以及value的注释在节点的node属性内

const fs = require('fs');

const chalk = require("chalk");

const red = chalk.red;
const green = chalk.bold.green;
const yellow = chalk.yellow
const h1 = chalk.red.bold;
const path = require('path');
const _ = require('lodash');
const { parse } = require('@vue/compiler-sfc');
const scssParse = require('postcss-scss/lib/scss-parse')


const map = new Map([
    ['#2c3e50', '$T1'],
    ['#42b983', '$T2']
])

let error = []

// 分组css 文件 和 vue 文件
const fileKeys = process.argv.slice(2)
console.log(process.argv)
const groupFileKeys = _.groupBy(fileKeys, (key) => {
    return _.split(key, '.')[1]
})


const scssFiles = _.reduce(groupFileKeys.scss, (res, cur) => {
    // 处理scss文件
    res[cur] = scssParse(fs.readFileSync(cur, "utf-8"))
    return res
}, {})

const vueFiles = _.reduce(groupFileKeys.vue, (res, cur) => {
    // 处理vue 文件的style； 转buffer
    const styles = parse(
        fs.readFileSync(path.resolve(cur), 'utf-8')
    ).descriptor.styles

    const buffers = styles.map(o => {
        return scssParse(o.content)
        // return Buffer.from(o.content, 'utf-8')
    })

    res[cur] = buffers

    return res
}, {})


function gainScssPromises() {
    return Object.keys(scssFiles).map(key => {
        // return postcss([abcCssPlugin({
        //     fileName: key
        // })]).process(scssFiles[key], { from: undefined });
        scssFiles[key].walkDecls((decl) => {
            for (let k of map.keys()) {
                if (decl.value && decl.value.includes(k)) {
                    error.push(`${h1(key)} \n ${red(decl.parent.selector)} - ${red(decl.prop)}:  the value ${decl.value} in theme - ${map.get(k)} `)
                }
            }
        })

        return Promise.resolve(scssFiles[key])
    })
}

function gainVuePromises() {
    const arr = [];

    Object.keys(vueFiles).map(key => {
        vueFiles[key].forEach(b => {
            // arr.push(postcss([abcCssPlugin({
            //     fileName: key
            // })]).process(b, { from: undefined }));
            b.walkDecls((decl) => {
                for (let k of map.keys()) {
                    if (decl.value && decl.value.includes(k)) {
                        error.push(`${h1(key)} \n ${red(decl.parent.selector)} - ${red(decl.prop)}:  the value ${decl.value} in theme - ${map.get(k)} `)
                    }
                }
            })

            return Promise.resolve(b)
        })
    })

    return arr;
}

// v8
// const abcCssPlugin = (opts => {
//         const {fileName} = opts
//
//         return {
//             postcssPlugin: 'postcss-abc',
//             Declaration(decl) {
//                 color.forEach(c => {
//                     if (decl.value && decl.value.includes(c)) {
//                         error.push(`${fileName} - ${decl.parent.selector} - ${decl.prop}:  the value ${decl.value} in theme`)
//                     }
//                 })
//             }
//         }
//     }
// )


// const map = new Map()
// v7
// const abcCssPlugin = (opts => {
//     const {fileName} = opts
//
//     return (root) => {
//
//
//
//         root.walkDecls(decl => {
//             for (let key of map.keys()) {
//                 if (decl.value && decl.value.includes(key)) {
//                     error.push(`${h1(fileName)} \n ${red(decl.parent.selector)} - ${red(decl.prop)}:  the value ${decl.value} in theme - ${map.get(key)} `)
//                 }
//             }
//         })
//     }
// })

const promises = [
    ...gainScssPromises(),
    ...gainVuePromises(),
]


Promise.all(promises)
    .then(() => {
        if (error.length > 0) {
            error.forEach(err => {
                console.log(err)
            })

            error = []

            console.log(yellow('请修改！！'))
            process.exit(0)
        } else {
            console.log(green('success!'))

            error = []

            process.exit(0)
        }
    })




