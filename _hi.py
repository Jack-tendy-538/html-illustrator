#from sre_parse import SPECIAL_CHARS
import json, re, webbrowser,time
import threading, queue, uuid, os

from wsgiref.simple_server import make_server, WSGIRequestHandler
from bottle import ServerAdapter
from bottle import Bottle, request, response, HTTPError, HTTPResponse, static_file

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

class BottleDaemonner:
    def __init__(self, hi, host='localhost', port=8080):
        self.hi = hi
        self.host = host
        self.port = port
        self.server_thread = None
        self.server = None  # 保存服务器实例引用
        
    def target(self):
        """启动服务器的目标函数"""
#        from bottle import ServerAdapter
        
        # 创建自定义服务器适配器，以便能够控制服务器
        class StoppableWSGIRefServer(ServerAdapter):
            def __init__(self, host='localhost', port=8080, **options):
                super().__init__(host, port, **options)
                self.srv = None
                
            def run(self, handler):
#                from wsgiref.simple_server import make_server, WSGIRequestHandler
                
                class QuietHandler(WSGIRequestHandler):
                    def log_request(self, *args, **kwargs):
                        pass  # 禁用请求日志
                
                self.srv = make_server(self.host, self.port, handler, handler_class=QuietHandler)
                self.srv.serve_forever()
                
            def shutdown(self):
                if self.srv:
                    self.srv.shutdown()
        
        # 使用可停止的服务器
        self.server = StoppableWSGIRefServer(host=self.host, port=self.port)
        self.hi.app.run(server=self.server)
    
    def start(self):
        """启动服务器线程"""
        self.server_thread = threading.Thread(target=self.target)
        self.server_thread.daemon = True
        self.server_thread.start()
    
    def stop(self):
        """停止服务器"""
        if self.server:
            try:
                # 发送关闭信号给服务器
                import requests
                try:
                    requests.post(f'http://{self.host}:{self.port}/api?terminate=true', timeout=1)
                except:
                    pass  # 忽略连接错误，服务器可能已经关闭
                
                # 停止服务器
                self.server.shutdown()
            except Exception as e:
                print(f"Error when closing server: {e}")
        
        if self.server_thread and self.server_thread.is_alive():
            self.server_thread.join(timeout=5)  # 等待线程结束，最多5秒
            
        # 清理资源
        self.server = None
        self.server_thread = None

class HtmlIllustrator:
    def __init__(self):
        self.app = Bottle()
        self.__annotations__ = {}
        self.op_queue = queue.Queue()
        self.lock = threading.Lock()
        self.enabled_lib = {'css': [], 'js': []}
        self.enable('js', 'std-stdio.js')
        self.enable('css', 'std-stdio.css')
        self.curr_co = 0
        self.bd = None
        @self.app.route('/', method='GET')
        def index():
            regex = re.compile(r'<!--\s*css\s*-->', re.IGNORECASE)
            with open('interface.html', 'r', encoding='utf-8') as f:
                html = f.read()
                return regex.sub(self.__gen_links(), html)

        @self.app.route('/static/<filepath>')
        def server_static(filepath):
            return static_file(filepath, root='./static/')

        @self.app.route('/api', method=['GET', 'POST'])
        def api():
            co = request.query.get('co')
            action = request.query.get('action')
            method = request.method
            return self.deal_with_api(co,action,method)

    def deal_with_api(self, co, action, method):
        if request.query.get('terminal') == 'close':
            threading.Thread(target=self._graceful_shutdown).start()
            return HTTPResponse(status=200, body="Closing...")
        # 清空队列
        if action == 'clear' and method == 'POST':
            with self.lock:
                while not self.op_queue.empty():
                    self.op_queue.get()
                return HTTPResponse(status=200, body="OK")
        # 终端操作
        if action == 'terminal' and method == 'GET':
            try:
                op = self.op_queue.get(timeout=30)
                return op.to_response()
            except queue.Empty:
                raise HTTPError(204, "No Content")
        # 输入处理
        if action == 'input' and method == 'POST':
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
        if request.query.get('terminate') == 'true' and request.method == 'POST':
            # 优雅关闭而不是强制退出
            threading.Thread(target=self._graceful_shutdown).start()
            return HTTPResponse(status=200, body="Shutting down...")
        # 未知请求
        return HTTPResponse(status=400, body="Invalid request")

    def enable(self, lib_type, url):
        if lib_type in self.enabled_lib:
            self.enabled_lib[lib_type].append(url)

    def run(self, host='localhost', port=8080):
        """运行服务器"""
        self.arg_server = (host, port)
        self.bd = BottleDaemonner(self, host, port)
        self.bd.start()  # 启动服务器线程
        webbrowser.open(f'http://{host}:{port}')

    def kill(self):
        """停止服务器"""
        if self.bd:
            self.bd.stop()
            self.bd = None

    def _graceful_shutdown(self):
        """优雅关闭服务器"""
#        import time
        time.sleep(0.5)  # 给响应一点时间
        if self.bd:
            self.bd.stop()

    def __gen_links(self):
        links = []
        for css in self.enabled_lib['css']:
            links.append(f'<link rel="stylesheet" type="text/css" href="static/{css}">')
        for js in self.enabled_lib['js']:
            links.append(f'<script src="static/{js}"></script>')
        return '\n'.join(links)

    def print(self, content, newline='\n'):
        self.curr_co += 1
        # 转义特殊字符
        content = ''.join(SPECIAL_CHARS.get(c, c) for c in content)
        with self.lock:
            op = ConsoleOperation('print', 'server', {
                'content': content,
                'co': self.curr_co,
                'newline': newline
            })
            self.op_queue.put(op)

    def input(self, prompt=''):
        self.curr_co += 1
        # 转义特殊字符
        prompt = ''.join(SPECIAL_CHARS.get(c, c) for c in prompt)
        # 轮询等待输入
        iw = inputWaiter()
        with self.lock:
            self.__annotations__['input_waiter'] = iw
            op = ConsoleOperation('input', 'server', {
                'content': prompt,
                'co': self.curr_co,
                'newline': ''
            })
            self.op_queue.put(op)
        return iw.wait()

if __name__ == '__main__':
    app = HtmlIllustrator()
    app.enabled_lib['js'].append('std-stdio.js')
    app.run()
    try:
        app.print("Hello, World!")
        app.print("This is a test of the HtmlIllustrator console.")
        name = app.input("Enter your name: ")
        app.print("Processing your input...")
        app.print(f"Hello, {name}!")
    except KeyboardInterrupt:
        print("Program terminated.")
