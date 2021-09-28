const fs = require('fs')
const todoFilePath = 'db/todoList.json'

// 引入 express 并且创建一个 express 实例赋值给 app
const express = require('express')
const bodyParser = require('body-parser')

const { log } = require('./utils')

const app = express()

// 从 todoList.json 读取 todoList 数组
// 注意数据为空时，todoList.json的文本内容是[]
// 否则就需要判断json文件是否为空字符''
const loadTodoList = () => {
    let content = fs.readFileSync(todoFilePath, 'utf8')
    let t = JSON.parse(content)
    return t
}

// 保存 todoList 数组到 todoList.json
const saveTodos = function(todoList) {
    let s = JSON.stringify(todoList, null, 2)
    fs.writeFile(todoFilePath, s, (error) => {
        if (error !== null) {
            console.log('error', error)
        } else {
            console.log('保存成功')
        }
    })
}

// 配置静态文件目录
app.use(express.static('static'))
// 把前端发过来的数据自动用 json 解析
app.use(bodyParser.json())

const sendHtml = (response, path) => {
    let options = {
        encoding: 'utf-8',
    }
    fs.readFile(path, options, (error, data) => {
        log(`读取的 html 文件 ${path} 内容是`, data)
        // data 就是 http response 的 body
        response.send(data)
    })
}

const sendJSON = (response, data) => {
    let r = JSON.stringify(data)
    response.send(r)
}


app.get('/', (request, response) => {
    let path = 'template/index.html'
    sendHtml(response, path)
})

app.get('/todo/all', (requrest, response) => {
    let todoList = loadTodoList()
    sendJSON(response, todoList)
})

// add todo 后端处理
const todoAdd = (form) => {
    let todoList = loadTodoList()
    if (todoList.length === 0) {
        form.id = 1
    } else {
        let lastTodo = todoList[todoList.length - 1]
        form.id = lastTodo.id + 1
    }
    form.done = 'false'
    todoList.push(form)
    // 保存
    saveTodos(todoList)
    return form
}

app.post('/todo/add', (request, response) => {
    let form = request.body
    let todo = todoAdd(form)
    sendJSON(response, todo)
})


// todo done 的开关，处理 done 的 true and false
const todoDoneToggle = (form) => {
    let todoList = loadTodoList()
    for (let i = 0; i < todoList.length; i++) {
        let t = todoList[i]
        if (t.id === form.id) {
            t.done = (t.done === 'false') ? 'true' : 'false'
            log('todo done id', t.id)
            saveTodos(todoList)
            return t
            // form 只包含了 id，我需要全部的值，所以返回 t 而不是 form
        }
    }
}

app.post('/todo/done', (request, response) => {
    let form = request.body
    let done = todoDoneToggle(form)
    sendJSON(response, done)
})

// todo delete 后端处理
const todoDelete = (id) => {
    let todoList = loadTodoList()
    id = Number(id)
    let index = -1
    for (let i = 0; i < todoList.length; i++) {
        let t = todoList[i]
        if (t.id === id) {
            // 找到了
            index = i
            break
        }
    }
    if (index > -1) {
        // 找到了, 用 splice 函数删除
        let t = todoList.splice(index, 1)[0]
        // 保存
        saveTodos(todoList)
        return t
    } else {
        return {}
    }
}

// todo delete 路由
app.get('/todo/delete/:id', (request, response) => {
    // 动态路由的变量通过 request.params.名字 的方式拿到
    // 变量类型永远是 string
    let id = request.params.id
    log('delete id', id)
    let todo = todoDelete(id)
    sendJSON(response, todo)
})

// todo delete all 路由（清空todoList）
app.get('/todo/delete_all', (request, response) => {
    let t = loadTodoList()
    let todoList = []
    saveTodos(todoList)
    sendJSON(response, t)
})

// todo update 后端处理（更新对应的todo数据）
const todoUpdate = (id, form) => {
    let t = loadTodoList()
    log(form.task)
    for (let e of t) {
        if (e.id === Number(id)) {
            e.task = form.task
            saveTodos(t)
            return e
        }
    }
}
// update 的路由
app.post('/todo/update/:id', (request, response) => {
    let id = request.params.id
    let form = request.body
    log('update id', id)
    let todo = todoUpdate(id, form)
    sendJSON(response, todo)
})

const main = () => {
    let server = app.listen(5000, '0.0.0.0', () => {
        let host = server.address().address
        let port = server.address().port

        log(`应用实例，访问地址为 http://${host}:${port}`)
    })
}

main()