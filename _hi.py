from sre_parse import SPECIAL_CHARS
from bottle import Bottle, request, response, HTTPError, HTTPResponse, static_file
import json, re, webbrowser
import threading, queue, uuid

class ConsoleOperation:
    def __init__(self, name, origin, args):
        self.name = name
        self.origin = origin
        self.args = args

    def to_response(self):
        return HTTPResponse(
            status=200,
            body=json.dumps({
                "type": self.name,
                "content": self.args.get("content", ""),
                "co": self.args.get("co", 0),
                "newline": self.args.get("newline", "\n")
            }),
            content_type='application/json',
            charset='utf-8'
        )

class inputWaiter:
    def __init__(self):
        self.event = threading.Event()
        self.value = None

    def wait(self):
        self.event.wait()
        return self.value

SPECIAL_CHARS = {
    '>':'&gt;',
    '<':'&lt;',
    '&':'&amp;',
    '"':'&quot;',
    "'":'&#39;'
}

class HtmlIllustrator:
    def __init__(self):
        self.app = Bottle()
        self.__annotations__ = {}
        self.op_queue = queue.Queue()
        self.lock = threading.Lock()
        self.enabled_lib = {'css': [], 'js': []}

        @self.app.route('/', method='GET')
        def index():
            regex = re.compile(r'<!--\s*css\s*-->', re.IGNORECASE)
            with open('interface.html', 'r', encoding='utf-8') as f:
                html = f.read()
                return regex.sub(self.__gen_links(), html)

        @self.app.route('/static/<filepath:path>')
        def server_static(filepath):
            return static_file(filepath, root='./static')

        @self.app.route('/api?co=<co>&action=terminal', method='GET')
        def api_terminal(co):
            try:
                op = self.op_queue.get(timeout=30)
                return op.to_response()
            except queue.Empty:
                raise HTTPError(204, "No Content")

        @self.app.route('/api?co=<co>&action=input', method='POST')
        def api_input(co):
            data = request.json
            if not data or 'content' not in data:
                raise HTTPError(400, "Bad Request")
            content = data['content']
            if 'input_waiter' in self.__annotations__:
                iw = self.__annotations__.pop('input_waiter')
                iw.value = content
                iw.event.set()
                return HTTPResponse(status=200, body="OK")
            else:
                raise HTTPError(400, "No input waiter")

        @self.app.route('/api?co=<co>&action=clear', method='POST')
        def api_clear(co):
            with self.lock:
                while not self.op_queue.empty():
                    self.op_queue.get()
                return HTTPResponse(status=200, body="OK")

        @self.app.route('/api?terminal=true', method='POST')
        def terminate_program():
            raise KeyboardInterrupt()

    def enable(self, lib_type, url):
        if lib_type in self.enabled_lib:
            self.enabled_lib[lib_type].append(url)

    def run(self, host='localhost', port=8080):
        self.server = threading.Thread(target=self.app.run,kwargs={'host':host, 'port':port, 'debug':True})
        self.server.start()
        webbrowser.open(f'http://{host}:{port}')

    def __gen_links(self):
        links = []
        for css in self.enabled_lib['css']:
            links.append(f'<link rel="stylesheet" type="text/css" href="{css}">')
        for js in self.enabled_lib['js']:
            links.append(f'<script src="{js}"></script>')
        return '\n'.join(links)

    def print(self, content, co=0, newline='\n'):
        # 转义特殊字符
        content = ''.join(SPECIAL_CHARS.get(c, c) for c in content)
        with self.lock:
            op = ConsoleOperation('print', 'server', {
                'content': content,
                'co': co,
                'newline': newline
            })
            self.op_queue.put(op)

    def input(self, prompt=''):
        # 转义特殊字符
        prompt = ''.join(SPECIAL_CHARS.get(c, c) for c in prompt)
        # 轮询等待输入
        iw = inputWaiter()
        with self.lock:
            self.__annotations__['input_waiter'] = iw
            op = ConsoleOperation('input', 'server', {
                'content': prompt,
                'co': 0,
                'newline': ''
            })
            self.op_queue.put(op)
            return iw.wait()

if __name__ == '__main__':
    app = ConsoleApp()
    app.enabled_lib['js'].append('static/std-stdio.js')
