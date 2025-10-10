const TICK = 0.2;

// ��������������ӡ
function printf(content, co, newline = '\n') {
    if (newline) {
        newline = newline.replace(/\n/g, '<br />');
    }
    return `<p co="${co}">${content}${newline}</p>`;
}

// ��������������
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

// ��������������ֹ
function terminatef(content, co) {
    // ��ֹ������ǰ�˿�������ִ�У�����Ҫ�ȴ�
    console.log('Terminate operation received');
    terminate();
    return ''; // ��ֹ��������Ҫ��ʾ����
}

// ����ӳ���ͬʱ������������
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

    // ��������Ƿ�Ϊ��
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
            // ������������ʾ�ڿ���̨
            let $productDiv = $('#product');
            if ($productDiv.length) {
                $productDiv.append(`<p co="${co}" style="color:#888;">${input}</p>`);
            }
            // �Ƴ���
            $form.remove();
            // ���¿�ʼ��ѯ
            setTimeout(loop, TICK * 1000);
        })
        .fail(function (err) {
            $button.prop('disabled', false);
            $input.css('background', '#ffecec');
            alert('�ύʧ�ܣ�������');
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

                // �����������������ȴ��û����룬���ټ�����ѯ
                // �����������������ѯ
                if (!op.blocking) {
                    co = data.co;
                    setTimeout(loop, TICK * 1000);
                } else {
                    // ���������������������ñ��ύ�¼��������ύ�����¿�ʼ��ѯ
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
                // δ֪������������ѯ
                co = data.co;
                setTimeout(loop, TICK * 1000);
            }
        })
        .fail(function (err) {
            console.error('Fetch error:', err);
            setTimeout(loop, TICK * 1000);
        });
}

// ��ʼ������HTML������ɺ�����
window.run = function () {
    loop();
};

window.terminate = terminate;

$(document).ready(function () {
    setTimeout(run, 100);
});