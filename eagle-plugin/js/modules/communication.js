/**
 * 通信协调模块 - 协调各通信模块的工作
 */

// 由于Eagle插件环境的限制，我们不能使用相对路径导入模块
// 使用立即执行函数包装以避免全局变量污染

var CommunicationModule = (function() {
    console.log('[COMMUNICATION] 通信协调模块已加载');

    /**
     * 启动HTTP服务
     */
    function startHTTPServer() {
        // 确保依赖模块已加载
        if (typeof HTTPServerModule === 'undefined' || typeof APIRouterModule === 'undefined') {
            console.error('[COMMUNICATION] 依赖模块未加载完成');
            return;
        }

        const { server, setCORSHeaders, handlePreflight, start } = HTTPServerModule.createHTTPServer(async (req, res) => {
            // 确保url模块可用
            const parsedUrl = typeof url !== 'undefined' ? url.parse(req.url, true) : { pathname: req.url, query: {} };
            
            // 设置CORS头
            setCORSHeaders(res);

            // 处理预检请求
            if (handlePreflight(req, res)) {
                return;
            }
            
            // 处理静态文件请求
            if (parsedUrl.pathname.startsWith('/static/')) {
                return handleStaticFileRequest(req, res, parsedUrl);
            }

            // 确保路由模块已加载
            if (typeof APIRouterModule !== 'undefined' && typeof APIRouterModule.routeRequest === 'function') {
                // 路由处理
                await APIRouterModule.routeRequest(req, res, parsedUrl);
            } else {
                console.error('[COMMUNICATION] 路由模块不可用');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Routing module not available'
                }));
            }
        });

        // 启动服务器
        start(3001);
    }

    /**
     * 处理静态文件请求
     * @param {Object} req - HTTP请求对象
     * @param {Object} res - HTTP响应对象
     * @param {Object} parsedUrl - 解析后的URL对象
     */
    function handleStaticFileRequest(req, res, parsedUrl) {
        try {
            // 确保fs和path模块可用
            if (typeof require === 'undefined') {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'File system access not available'
                }));
                return;
            }
            
            const fs = require('fs');
            const path = require('path');
            
            // 获取文件路径（移除/static/前缀）
            const filePath = decodeURIComponent(parsedUrl.pathname.substring(8)); // 移除'/static/'前缀
            
            // 安全检查：确保路径不包含危险字符
            if (filePath.includes('../') || filePath.includes('..\\') || filePath.startsWith('/')) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Forbidden path'
                }));
                return;
            }
            
            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'File not found'
                }));
                return;
            }
            
            // 检查是否为文件
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Path is not a file'
                }));
                return;
            }
            
            // 设置适当的Content-Type
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml'
            };
            
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            
            // 设置缓存头
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时缓存
            
            // 读取并发送文件
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            
            fileStream.on('error', (error) => {
                console.error('[COMMUNICATION] 文件读取错误:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Error reading file'
                }));
            });
            
        } catch (error) {
            console.error('[COMMUNICATION] 处理静态文件请求时出错:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Internal Server Error',
                message: error.message
            }));
        }
    }

    /**
     * 发送插件准备就绪消息
     */
    function sendReadyMessage() {
        console.log('[COMMUNICATION] 初始化通信模块');
        
        // 检查所有依赖是否已加载
        if (typeof HTTPServerModule === 'undefined' || 
            typeof APIHandlersModule === 'undefined' || 
            typeof APIRouterModule === 'undefined') {
            console.log('[COMMUNICATION] 依赖模块尚未加载完成，等待中...');
            // 等待一段时间后重试
            setTimeout(sendReadyMessage, 100);
            return;
        }
        
        // 启动HTTP服务
        startHTTPServer();
        
        console.log('[COMMUNICATION] 通信模块初始化完成，HTTP服务已启动');
    }

    // 公共接口
    return {
        sendReadyMessage
    };
})();

// 初始化通信模块
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // 给其他模块一些时间加载
        setTimeout(CommunicationModule.sendReadyMessage, 200);
    });
} else {
    // 给其他模块一些时间加载
    setTimeout(CommunicationModule.sendReadyMessage, 200);
}

console.log('[COMMUNICATION] 通信协调模块已加载');