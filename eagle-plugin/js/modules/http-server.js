/**
 * HTTP服务器模块
 * 负责创建和配置HTTP服务器
 */

// 由于Eagle插件环境的限制，我们不能使用相对路径导入模块
// 使用立即执行函数包装以避免全局变量污染

var HTTPServerModule = (function() {
    // 确保必要的模块可用
    const http = require('http');
    const url = require('url');

    /**
     * 创建HTTP服务器
     * @param {Function} requestHandler - 请求处理函数
     * @returns {Object} 包含服务器实例和相关方法的对象
     */
    function createHTTPServer(requestHandler) {
        const server = http.createServer(requestHandler);
        
        /**
         * 设置CORS头
         * @param {Object} res - HTTP响应对象
         */
        function setCORSHeaders(res) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }
        
        /**
         * 处理预检请求
         * @param {Object} req - HTTP请求对象
         * @param {Object} res - HTTP响应对象
         * @returns {boolean} 是否处理了预检请求
         */
        function handlePreflight(req, res) {
            if (req.method === 'OPTIONS') {
                setCORSHeaders(res);
                res.writeHead(200);
                res.end();
                return true;
            }
            return false;
        }
        
        /**
         * 启动服务器
         * @param {number} port - 监听端口
         */
        function start(port = 3001) {
            server.listen(port, () => {
                console.log(`[HTTP_SERVER] HTTP服务已启动，监听端口${port}`);
            });
            
            server.on('error', (error) => {
                console.error(`[HTTP_SERVER] HTTP服务启动失败:`, error);
            });
        }
        
        return {
            server,
            setCORSHeaders,
            handlePreflight,
            start
        };
    }

    // 公共接口
    return {
        createHTTPServer
    };
})();

console.log('[HTTP_SERVER] HTTP服务器模块加载完成');