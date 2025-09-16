const TICK = 0.2
function printf(content, co, newline = '\n') {
    if (newline) {
        newline = newline.replace('\n', '<br />');
    }
    return `<p co=${co}>${content}${newline}</p>`;
}
function scanf(content, co) {
    return `
        <form co=${co}>
            <p>${content}</p>
            <div class="input">
                <input type="text" name="input" autofocus />
                <button type="submit" accesskey='Enter'>Enter</button>
            </div>
        </form>
    `;
}
let map = new Map()
map.set('print', printf)
map.set('input', scanf)
function onInput() {
    // TODO: handle input
    // get the input value
    let input = this.querySelector('input[name="input"]').value;
    // remove the form
    this.parentNode.removeChild(this);
    // get the co
    let co = this.getAttribute('co');
    // send the input to the server /api?co=...input=...
    fetch(`/api?co=${co}&input=${encodeURIComponent(input)}`);
    return false;
}
function terminate() {
    fetch('/api?terminate=true', {
        method: 'POST'
    })
        .then(res => res.json())
        .then(data => {
            console.log('Terminated:', data);
        })
        .catch(err => {
            console.error(err);
        });
}
document.addEventListener('submit', function (e) {
    if (e.target && e.target.tagName === 'FORM' && e.target.hasAttribute('co')) {
        e.preventDefault();
        onInput.call(e.target);
    }
});
function run() {
    let co = 0;
    function loop() {
        fetch(`/api?co=${co}&action=terminal`)
            .then(res => res.json())
            .then(data => {
                if (data.type === 'end') {
                    // end of program
                    return;
                }
                if (data.type === 'print') {
                    let html = map.get('print')(data.content, co, data.newline);
                    document.body.insertAdjacentHTML('beforeend', html);
                    co = data.co;
                    setTimeout(loop, TICK * 1000);
                } else if (data.type === 'input') {
                    let html = map.get('input')(data.content, co);
                    document.body.insertAdjacentHTML('beforeend', html);
                    co = data.co;
                    // focus the input
                    let form = document.querySelector(`form[co='${co}']`);
                    if (form) {
                        form.querySelector('input[name="input"]').focus();
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }
    loop();
}