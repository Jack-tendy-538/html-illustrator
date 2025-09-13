from bottle import Bottle, request, response, HTTPError, HTTPResponse, static_file
import json, re
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

class ConsoleApp:
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

        @self.app.route('/api', method=['GET', 'POST'])
        def api():
            co = request.query.get('co', '0')
            action = request.query.get('action', 'terminal')
            input_value = request.query.get('input', None)
            # 这里可以根据 action 和 input_value 处理不同的终端操作
            # 示例：简单模拟终端输出和输入
            if input_value is not None:
                # 用户提交了输入，返回 print 操作
                return ConsoleOperation(
                    name="print",
                    origin="server",
                    args={"content": f"你输入了: {input_value}", "co": int(co) + 1, "newline": "<br />"}
                ).to_response()
            else:
                # 轮询时，交替返回 print 和 input
                if int(co) % 2 == 0:
                    return ConsoleOperation(
                        name="print",
                        origin="server",
                        args={"content": "欢迎使用终端，请输入内容：", "co": int(co) + 1, "newline": "<br />"}
                    ).to_response()
                else:
                    return ConsoleOperation(
                        name="input",
                        origin="server",
                        args={"content": "请输入内容：", "co": int(co) + 1}
                    ).to_response()

    def __gen_links(self):
        links = []
        for css in self.enabled_lib['css']:
            links.append(f'<link rel="stylesheet" type="text/css" href="{css}">')
        for js in self.enabled_lib['js']:
            links.append(f'<script src="{js}"></script>')
        return '\n'.join(links)

if __name__ == '__main__':
    app = ConsoleApp()
    app.enabled_lib['js'].append('static/std-stdio.js')
    # 如有CSS可添加
    # app.enabled_lib['css'].append('static/your-style.css')
    app.app.run(host='0.0.0.0', port=8080, debug=True)