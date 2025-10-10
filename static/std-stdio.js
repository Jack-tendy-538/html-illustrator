const TICK = 0.2;

// 非阻塞操作：打印
function printf(content, co, newline = '\n') {
    if (newline) {
        newline = newline.replace(/\n/g, '<br />');
    }
    return `<p co="${co}">${content}${newline}</p>`;
}

// 阻塞操作：输入
function scanf(content, co) {
    return `
        <form co="${co}">
            <p>${content}</p>
            <div class="input">
                <input type="text" name="input" autofocus />
                <button type="submit">Enter</button>
            </div>
        </form>
    `;
}

// 非阻塞操作：终止
function terminatef(content, co) {
    // 终止操作在前端可以立即执行，不需要等待
    console.log('Terminate operation received');
    terminate();
    return ''; // 终止操作不需要显示内容
}

// 操作映射表，同时标明阻塞类型
const operations = {
    'print': {
        func: printf,
        blocking: false
    },
    'input': {
        func: scanf,
        blocking: true
    },
    'terminate': {
        func: terminatef,
        blocking: false
    }
};

function onInput(form) {
    let $form = $(form);
    let $input = $form.find('input[name="input"]');
    let input = $input.val().trim();
    let co = $form.attr('co');
    let $button = $form.find('button[type="submit"]');

    // 检查输入是否为空
    if (!input) {
        $input.focus();
        $input.css('background', '#ffecec');
        return false;
    }

    $button.prop('disabled', true);

    $.ajax({
        url: `/api?co=${co}&action=input`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ content: input })
    })
        .done(function () {
            // 将输入内容显示在控制台
            let $productDiv = $('#product');
            if ($productDiv.length) {
                $productDiv.append(`<p co="${co}" style="color:#888;">${input}</p>`);
            }
            // 移除表单
            $form.remove();
            // 重新开始轮询
            setTimeout(loop, TICK * 1000);
        })
        .fail(function (err) {
            $button.prop('disabled', false);
            $input.css('background', '#ffecec');
            alert('提交失败，请重试');
            console.error('Input error:', err);
        });

    return false;
}

function terminate() {
    $.ajax({
        url: '/api?terminate=true',
        method: 'POST'
    })
        .done(function () {
            console.log('Terminated');
        })
        .fail(function (err) {
            console.error('Terminate error:', err);
        });
}

let co = 0;
function loop() {
    $.ajax({
        url: `/api?co=${co}&action=terminal`
    })
        .done(function (data) {
            if (data.type === 'end') {
                return;
            }

            let op = operations[data.type];
            if (op) {
                let html = op.func(data.content, co, data.newline);
                let $productDiv = $('#product');
                if ($productDiv.length) {
                    $productDiv.append(html);
                }

                // 如果是阻塞操作，则等待用户输入，不再继续轮询
                // 非阻塞操作则继续轮询
                if (!op.blocking) {
                    co = data.co;
                    setTimeout(loop, TICK * 1000);
                } else {
                    // 对于阻塞操作，我们设置表单提交事件，并在提交后重新开始轮询
                    let $form = $(`form[co="${co}"]`);
                    if ($form.length) {
                        $form.on('submit', function (e) {
                            e.preventDefault();
                            onInput(this);
                            return false;
                        });

                        $form.find('input[name="input"]').focus();
                    }
                    co = data.co;
                }
            } else {
                // 未知操作，继续轮询
                co = data.co;
                setTimeout(loop, TICK * 1000);
            }
        })
        .fail(function (err) {
            console.error('Fetch error:', err);
            setTimeout(loop, TICK * 1000);
        });
}

// 初始化，在HTML加载完成后运行
window.run = function () {
    loop();
};

window.terminate = terminate;

$(document).ready(function () {
    setTimeout(run, 100);
});