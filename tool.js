const fs = require('fs');

const chalk = require('chalk');

const { green } = chalk.bold;
const h1 = chalk.red.bold;
const path = require('path');
const _ = require('lodash');
const { parse } = require('@vue/compiler-sfc');
const dir = require('@tool/node-dir');
const scssParse = require('postcss-scss/lib/scss-parse')
const yellow = chalk.bgCyan

let error = 0

const files = dir
    .files(path.join(__dirname, './src'), {
        sync: true,
        recursive: true,
    })
    .filter((file) => {
        return file.match(/\.(scss|vue)$/);
    });

const groupFileKeys = _.groupBy(files, (key) => {
    return _.split(key, '.')[1];
});

const scssFiles = _.reduce(groupFileKeys.scss, (res, cur) => {
    // 处理scss文件
    res[cur] = scssParse(fs.readFileSync(cur, 'utf-8'))
    return res;
}, {});


const vueFiles = _.reduce(groupFileKeys.vue, (res, cur) => {
    // 处理vue 文件的style； 转buffer
    let { styles } = parse(
        fs.readFileSync(path.resolve(cur), 'utf-8'),
    ).descriptor;



    // scoped 直接忽略 - 不会影响全局
    styles = styles.filter((style) => {
        return !style.attrs.scoped;

    });


    if (styles.length > 0) {
        const root = styles.map((o) => {
            // return Buffer.from(o.content, 'utf-8');
            return scssParse(o.content)
        });

        res[cur] = root;
    }


    return res;
}, {});

const map = new Map();

function joinSelector(root, prefix = '', fileName) {
    if (root.type === 'rule') {
        let s = '';
        if (prefix) s = `${prefix} ${root.selector}`;
        else s = root.selector;

        const css = root.nodes ? root.nodes.filter(o => o.type === 'decl').reduce((res, cur) => {
            res[cur.prop] = cur.value

            return res
        }, {}) : {}

        // && !_.isEqual(map.get(s).css, css)
        if (map.has(s)) {
            console.log(yellow('>>>>>>>>>> 冲突'))
            console.log(h1(`文件【${fileName}】\n"${s}": ${JSON.stringify(css, null, 4)} \n文件【${map.get(s).fileName}】 \n"${s}": ${JSON.stringify(map.get(s).css, null, 4)} `));
            error++;
        } else {
            map.set(s, {
                fileName,
                css
            });
        }

        prefix = `${prefix} ${root.selector}`;
    }

    if (root.nodes && root.nodes.length) {
        root.nodes.forEach((r) => {
            joinSelector(r, prefix, fileName);
        });
    }
}

// const abcConflictPlugin = ((opts) => {
//     const { fileName } = opts;
//
//     return (root) => {
//         joinSelector(root, '', fileName);
//     };
// });


//
function gainScssPromises() {
    return Object.keys(scssFiles).map((key) => {
        joinSelector(scssFiles[key], '', key)
        return Promise.resolve(scssFiles[key])
    });
}

function gainVuePromises() {
    const arr = [];

    Object.keys(vueFiles).map((key) => {
        vueFiles[key].forEach((b) => {
            joinSelector(b, '', key)
            return Promise.resolve(b)
        });
    });

    return arr;
}


const promises = [
    ...gainScssPromises(),
    ...gainVuePromises(),
];


Promise.all(promises)
    .then(() => {
        console.log(green(`done !!!!!, 存在 ${error} 条可能冲突。`));
    });
