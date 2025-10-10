# markdown.py
import markdown as md
from bottle import HTTPResponse
import json
from . import _hi

def facilitate(hi_instance):
    """为 HtmlIllustrator 实例添加 markdown 支持"""
    
    # 启用 markdown 渲染相关的静态文件
    hi_instance.enable('js', 'markdown-render.js')
    
    # 存储 markdown 内容的字典，以 co 为键
    hi_instance.markdown_contents = {}
    
    # 注册 markdown API 路由
    def markdown_api_handler(request):
        co = request.query.get('co')
        if co and co in hi_instance.markdown_contents:
            content = hi_instance.markdown_contents.pop(co)
            # 将 markdown 转换为 HTML
            html_content = md.markdown(content)
            return HTTPResponse(
                status=200,
                body=json.dumps({'html': html_content}),
                content_type='application/json'
            )
        else:
            return HTTPResponse(404, "Markdown content not found")
    
    hi_instance.addon_url['markdown/api'] = markdown_api_handler
    
    # 添加 printmd 方法
    def printmd(self, content):
        self.curr_co += 1
        co = self.curr_co
        
        # 存储 markdown 内容
        self.markdown_contents[co] = content
        
        # 创建 markdown 操作
        with self.lock:
            op = _hi.ConsoleOperation('markdown', 'server', {
                'content': '',  # 实际内容通过 API 获取
                'co': co,
                'newline': '\n'
            })
            self.op_queue.put(op)
    
    # 将 printmd 方法绑定到实例
    hi_instance.printmd = printmd.__get__(hi_instance, type(hi_instance))