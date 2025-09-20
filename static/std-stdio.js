const TICK = 0.2;

function printf(content, co, newline = '\n') {
    if (newline) {
        newline = newline.replace(/\n/g, '<br />');
    }
    return `<p co="${co}">${content}${newline}</p>`;
}

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

let map = new Map();
map.set('print', printf);
map.set('input', scanf);

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

    // ���ð�ť��ֹ�ظ��ύ
    $button.prop('disabled', true);

    $.ajax({
        url: `/api?co=${co}&action=input`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ content: input })
    })
        .done(function () {
            // ��ʾ�û����������
            let $productDiv = $('#product');
            if ($productDiv.length) {
                $productDiv.append(`<p co="${co}" style="color:#888;">${input}</p>`);
            }
            // �Ƴ���
            $form.remove();
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
                // �������
                return;
            }

            if (data.type === 'print') {
                let html = map.get('print')(data.content, co, data.newline);
                let $productDiv = $('#product');
                if ($productDiv.length) {
                    $productDiv.append(html);
                }
                co = data.co;
                setTimeout(loop, TICK * 1000);
            } else if (data.type === 'input') {
                let html = map.get('input')(data.content, co);
                let $productDiv = $('#product');
                if ($productDiv.length) {
                    $productDiv.append(html);

                    // ��ӱ��ύ�¼�
                    let $form = $(`form[co="${co}"]`);
                    if ($form.length) {
                        $form.on('submit', function (e) {
                            e.preventDefault();
                            onInput(this);
                            return false;
                        });

                        // �۽������
                        $form.find('input[name="input"]').focus();
                    }
                }
                co = data.co;
                // ���ﲻ���� loop���ȴ��û�����
            }
        })
        .fail(function (err) {
            console.error('Fetch error:', err);
            setTimeout(loop, TICK * 1000);
        });
}

// ȫ�ֺ������� HTML ����
window.run = function () {
    loop();
};

window.terminate = terminate;

// ҳ�������ɺ��Զ�����
$(document).ready(function () {
    setTimeout(run, 100);
});