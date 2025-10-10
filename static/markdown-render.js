// static/markdown-render.js
// 扩展操作映射，添加 markdown 支持
if (typeof operations !== 'undefined') {
    operations['markdown'] = {
        func: function (content, co, newline) {
            // 从服务器获取 markdown 内容并渲染
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

            // 返回空字符串，实际内容通过 AJAX 插入
            return '';
        },
        blocking: false
    };
}

// 添加 markdown 内容的基本样式
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