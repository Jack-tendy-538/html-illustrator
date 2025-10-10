// static/markdown-render.js
// ��չ����ӳ�䣬��� markdown ֧��
if (typeof operations !== 'undefined') {
    operations['markdown'] = {
        func: function (content, co, newline) {
            // �ӷ�������ȡ markdown ���ݲ���Ⱦ
            $.ajax({
                url: `/markdown/api?co=${co}`,
                method: 'GET',
                success: function (data) {
                    let $productDiv = $('#product');
                    if ($productDiv.length) {
                        $productDiv.append(`<div co="${co}" class="markdown-content">${data.html}</div>`);
                    }
                },
                error: function (err) {
                    console.error('Failed to fetch markdown content:', err);
                    let $productDiv = $('#product');
                    if ($productDiv.length) {
                        $productDiv.append(`<p co="${co}" style="color:red;">Error loading markdown content</p>`);
                    }
                }
            });

            // ���ؿ��ַ�����ʵ������ͨ�� AJAX ����
            return '';
        },
        blocking: false
    };
}

// ��� markdown ���ݵĻ�����ʽ
$(document).ready(function () {
    $('head').append(`
        <style>
            .markdown-content {
                margin: 10px 0;
                padding: 10px;
                border-left: 3px solid #007acc;
                background: #f8f9fa;
            }
            .markdown-content h1, .markdown-content h2, .markdown-content h3 {
                margin-top: 0;
                color: #333;
            }
            .markdown-content code {
                background: #e9ecef;
                padding: 2px 4px;
                border-radius: 3px;
            }
            .markdown-content pre {
                background: #2d2d2d;
                color: #f8f8f2;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
        </style>
    `);
});