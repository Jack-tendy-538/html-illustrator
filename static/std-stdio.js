const TICK = 0.2;

function printf(content, co, newline = '\n') {
    if (newline) {
        newline = newline.replace(/\n/g, '<br />');
    }
    return `<p co="${co}">${content}${newline}</p>`;
}

function scanf(content, co) {
    return `
        <form co="${co}" action='onInput()'>
            <p>${content}</p>
            <div class="input">
                <input type="text" name="input" autofocus />
                <button type="submit">Enter</button>
            </div>
        </form>
    `;
}

let map = new Map();
map.set('print', printf);
map.set('input', scanf);

function onInput(form) {
    let inputElem = form.querySelector('input[name="input"]');
    let input = inputElem.value.trim();
    let co = form.getAttribute('co');
    let button = form.querySelector('button[type="submit"]');

    // 输入为空不提交
    if (!input) {
        inputElem.focus();
        inputElem.style.background = "#ffecec";
        return false;
    }

    // 禁用按钮防止重复提交
    button.disabled = true;

    fetch(`/api?co=${co}&action=input`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: input })
    })
        .then(response => {
            if (response.ok) {
                // 显示用户输入内容
                let productDiv = document.getElementById('product');
                if (productDiv) {
                    productDiv.insertAdjacentHTML('beforeend', `<p co="${co}" style="color:#888;">${input}</p>`);
                }
                // 移除表单
                form.parentNode.removeChild(form);
                setTimeout(loop, TICK * 1000);
            } else {
                button.disabled = false;
                inputElem.style.background = "#ffecec";
            }
        })
        .catch(err => {
            button.disabled = false;
            inputElem.style.background = "#ffecec";
            alert('网络错误，请重试');
            console.error('Input error:', err);
        });

    return false;
}

function terminate() {
    fetch('/api?terminate=true', {
        method: 'POST'
    })
        .then(res => {
            console.log('Terminated');
        })
        .catch(err => {
            console.error('Terminate error:', err);
        });
}

let co = 0;
function loop() {
    fetch(`/api?co=${co}&action=terminal`)
        .then(res => {
            if (res.status === 204) {
                // 没有内容，继续轮询
                setTimeout(loop, TICK * 1000);
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;

            if (data.type === 'end') {
                // 程序结束
                return;
            }

            if (data.type === 'print') {
                let html = map.get('print')(data.content, co, data.newline);
                let productDiv = document.getElementById('product');
                if (productDiv) {
                    productDiv.insertAdjacentHTML('beforeend', html);
                }
                co = data.co;
                setTimeout(loop, TICK * 1000);
            } else if (data.type === 'input') {
                let html = map.get('input')(data.content, co);
                let productDiv = document.getElementById('product');
                if (productDiv) {
                    productDiv.insertAdjacentHTML('beforeend', html);

                    // 添加表单提交事件
                    let form = productDiv.querySelector(`form[co="${co}"]`);
                    if (form) {
                        form.onsubmit = function (e) {
                            e.preventDefault();
                            onInput(form);
                            return false;
                        };

                        // 聚焦输入框
                        form.querySelector('input[name="input"]').focus();
                    }
                }
                co = data.co;
                // 这里不调用 loop，等待用户输入
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            setTimeout(loop, TICK * 1000);
        });
}

// 全局函数，供 HTML 调用
window.run = function () {
    loop();
};

window.terminate = terminate;

// 页面加载完成后自动启动
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(run, 100);
});