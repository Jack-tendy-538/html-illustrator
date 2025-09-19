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
    let input = form.querySelector('input[name="input"]').value;
    let co = form.getAttribute('co');

    // ���� POST ���󵽷�����
    fetch(`/api?co=${co}&action=input`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: input })
    })
        .then(response => {
            if (response.ok) {
                // �Ƴ���
                form.parentNode.removeChild(form);
                // ������ѯ��ȡ��һ������
                setTimeout(loop, TICK * 1000);
            }
        })
        .catch(err => {
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
                // û�����ݣ�������ѯ
                setTimeout(loop, TICK * 1000);
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;

            if (data.type === 'end') {
                // �������
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

                    // ��ӱ��ύ�¼�
                    let form = productDiv.querySelector(`form[co="${co}"]`);
                    if (form) {
                        form.onsubmit = function (e) {
                            e.preventDefault();
                            onInput(form);
                            return false;
                        };

                        // �۽������
                        form.querySelector('input[name="input"]').focus();
                    }
                }
                co = data.co;
                // ���ﲻ���� loop���ȴ��û�����
            }
        })
        .catch(err => {
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
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(run, 100);
});