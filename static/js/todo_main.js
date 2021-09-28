// Author：Monsterxiao
// QQ：421920240

const log = console.log.bind(console)
const e = selector => document.querySelector(selector)
const es = selector => document.querySelectorAll(selector)
const appendHtml = (element, html) => element.insertAdjacentHTML('beforeend', html)

// Classes names, 表现与 todo 状态关联的视觉效果
const CHECK = "fa-check-circle"
const UNCHECK = "fa-circle-thin"
const LINE_THROUGH = "completed"

// todo 的 HTML 模板
const templateTodo = (todo) => {
    let task = todo.task
    let id = todo.id
    let done = todo.done
    // 判断并初始化元素属性
    const DONE = (done === 'true') ? CHECK : UNCHECK
    const LINE = (done === 'true') ? LINE_THROUGH : ''

    let t = `
        <li class="todo-cell" data-id="${id}" data-done="${done}">
            <i class="fa todo-complete ${DONE} co"></i>
            <p class="todo-task ${LINE}" contenteditable="false">${task}</p>
            <i class="fa todo-delete fa-trash-o de"></i>
        </li>
    `
    return t
}

const insertTodo = (todo) => {
    let container = e('.todo-container')
    let html = templateTodo(todo)
    appendHtml(container, html)
}

const insertTodos = (todos) => {
    for (let t of todos) {
        insertTodo(t)
    }
}

const ajax = (method, path, data, callback) => {
    let r = new XMLHttpRequest()
    r.open(method, path, true)
    r.setRequestHeader('Content-Type', 'application/json')
    r.onreadystatechange = () => {
        if (r.readyState === 4) {
            let d = JSON.parse(r.response)
            callback(d)
        }
    }
    r.send(data)
}

const apiTodoAll = (callback) => {
    let method = 'GET'
    let path = '/todo/all'
    let data = ''
    ajax(method, path, data, callback)
}

const apiTodoAdd = (task, callback) => {
    let method = 'POST'
    let path = '/todo/add'
    let data = {
        task: task,
    }
    data = JSON.stringify(data)
    ajax(method, path, data, callback)
}

const apiTodoDelete = (id, callback) => {
    let method = 'GET'
    let path = '/todo/delete/' + String(id)
    let data = ''
    ajax(method, path, data, callback)
}

const apiTodoDone = (id, callback) => {
    let method = 'POST'
    let path = '/todo/done'
    let data = {
        id: Number(id),
    }
    data = JSON.stringify(data)
    ajax(method, path, data, callback)
}

const apiDeleteAll = (callback) => {
    let method = 'GET'
    let path = '/todo/delete_all'
    let data = ''
    ajax(method, path, data, callback)
}

const apiTodoUpdate = (todoId, data, callback) => {
    let method = 'POST'
    let path = '/todo/update/' + String(todoId)
    ajax(method, path, data, callback)
}

const actionAdd = (event) => {
    // 获取 input 的输入
    let input = e('#input-task')
    let value = input.value
    apiTodoAdd(value, (todo) => {
        log('add todo by button', todo)
        insertTodo(todo)
    })
    // 清空输入框的值
    input.value = ''
}

const actionDelete = (event) => {
    let self = event.target
    let todoCell = self.closest('.todo-cell')
    let todoId = todoCell.dataset.id
    apiTodoDelete(todoId, (todo) => {
        log('delete todo', todo)
        todoCell.remove()
    })
}

const actionDoneToggle = (event) => {
    let self = event.target
    let todoCell = self.closest('.todo-cell')
    let todoTask = todoCell.querySelector('.todo-task')
    let todoId = todoCell.dataset.id
    let d = todoCell.dataset.done

    // 判断圈圈的 class 是 CHECK 还是 UNCHECK，toggle 开关
    // 判断 todo-task 的 class 是否有
    self.classList.toggle(CHECK)
    self.classList.toggle(UNCHECK)
    todoTask.classList.toggle(LINE_THROUGH)

    // 改变 html 里面 done 的值
    todoCell.dataset.done = (d === 'false') ? 'true' : 'false'

    apiTodoDone(todoId,(todo) => {
        log('todo done', todo)
    })
}

const actionDeleteAll = () => {
    let todoCells =es('.todo-cell')
    for (let e of todoCells) {
        e.remove()
    }
    apiDeleteAll((todos) => {
        log('All have been deleted', todos)
    })
}

// 编辑功能
const actionEdit = (event) => {
    let self = event.target
    let todoCell = self.closest('.todo-cell')
    self.contentEditable = true
    self.focus()
}

// 绑定 Enter 的 keydown 事件, 判断enter是
// 添加 todo 还是 update todo
const bindEventEnterDelegate = () => {
    let container = e('.container')
    container.addEventListener('keydown',(event) => {
        // 监控键盘要用 event.key 而不是 event.target.key
        if (event.key === 'Enter') {
            event.preventDefault()
            log('用户按下 Enter')
            addByEnter(event)
            if (event.target.classList.contains('todo-task')) {
                updateByEnter(event)
            }
        }
    })
}

// 按 enter add todo
const addByEnter = (event) => {
    let input = e('#input-task')
    let task = input.value
    // 如果 task 输入框不为空，调用 apiTodoAdd
    if (task) {
        apiTodoAdd(task, (todo) => {
            log('add todo by Enter', todo)
            insertTodo(todo)
        })
        input.value = ''
    }
}

// 按 enter 确认编辑内容并调用 update api 更新后台数据
const updateByEnter = (event) => {
    let self = event.target
    // 关闭编辑功能
    self.contentEditable = false
    // 拿到 task 更新内容和 id
    let todoCell = self.closest('.todo-cell')
    let todoId = todoCell.dataset.id
    let data = {
        task: self.innerText,
    }
    // data 转 JSON 格式并发送
    data = JSON.stringify(data)
    apiTodoUpdate(todoId, data, (todo) => {
        log('update by enter, 更新成功', todo)
    })
}

// 事件委托，绑定 click 事件，对应调用： 添加，删除，删除全部，完成或未完成开关 或 编辑方法
const bindEventDelegate = () => {
    let container = e('.container')
    container.addEventListener('click', (event) => {
        let self = event.target
        let has = self.classList.contains.bind(self.classList)
        if (has('fa-plus-circle')) {
            log('click add')
            actionAdd(event)
        } else if (has('todo-delete')) {
            log('click delete')
            actionDelete(event)
        } else if (has('fa-refresh')) {
            log('click refresh')
            actionDeleteAll(event)
        } else if (has('todo-complete')) {
            log('click done toggle')
            actionDoneToggle(event)
        } else if (has('todo-task')) {
            log('edit task')
            actionEdit(event)
        }
    })
}

// 绑定事件
const bindEvents = () => {
    bindEventEnterDelegate()
    bindEventDelegate()
}

// 加载 todo 清单数据
const loadTodo = () => {
    apiTodoAll((todos) => {
        insertTodos(todos)
    })
}

// 加载日期
const loadTime = () => {
    let options = {
        weekday : "long", 
        month : "short", 
        day : "numeric"
    }
    let today = new Date()
    let date = e('#date')
    date.innerHTML = today.toLocaleDateString("ch", options)
}

const __main = () => {
    loadTime()
    loadTodo()
    bindEvents()
}
__main()