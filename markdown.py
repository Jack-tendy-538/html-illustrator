# markdown.py
import markdown as md
from bottle import HTTPResponse
import json
from . import _hi

def facilitate(hi_instance):
    """Ϊ HtmlIllustrator ʵ����� markdown ֧��"""
    
    # ���� markdown ��Ⱦ��صľ�̬�ļ�
    hi_instance.enable('js', 'markdown-render.js')
    
    # �洢 markdown ���ݵ��ֵ䣬�� co Ϊ��
    hi_instance.markdown_contents = {}
    
    # ע�� markdown API ·��
    def markdown_api_handler(request):
        co = request.query.get('co')
        if co and co in hi_instance.markdown_contents:
            content = hi_instance.markdown_contents.pop(co)
            # �� markdown ת��Ϊ HTML
            html_content = md.markdown(content)
            return HTTPResponse(
                status=200,
                body=json.dumps({'html': html_content}),
                content_type='application/json'
            )
        else:
            return HTTPResponse(404, "Markdown content not found")
    
    hi_instance.addon_url['markdown/api'] = markdown_api_handler
    
    # ��� printmd ����
    def printmd(self, content):
        self.curr_co += 1
        co = self.curr_co
        
        # �洢 markdown ����
        self.markdown_contents[co] = content
        
        # ���� markdown ����
        with self.lock:
            op = _hi.ConsoleOperation('markdown', 'server', {
                'content': '',  # ʵ������ͨ�� API ��ȡ
                'co': co,
                'newline': '\n'
            })
            self.op_queue.put(op)
    
    # �� printmd �����󶨵�ʵ��
    hi_instance.printmd = printmd.__get__(hi_instance, type(hi_instance))