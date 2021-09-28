const log = console.log.bind(console)

// commonjs
module.exports = {
    // 'log': log,
    log,
}

// es6 导出模块
// export default log
// export { log }