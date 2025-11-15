/**
 * API路由模块
 * 负责处理请求路由和分发
 *
 * 由于Eagle插件环境的限制，我们不能使用相对路径导入模块
 * 使用立即执行函数包装以避免全局变量污染
 */

var APIRouterModule = (function() {

    /**
     * 路由请求到对应的处理函数
     * @param {Object} req - HTTP请求对象
     * @param {Object} res - HTTP响应对象
     * @param {Object} parsedUrl - 解析后的URL对象
     */
    async function routeRequest(req, res, parsedUrl) {
        const path = parsedUrl.pathname;
        const method = req.method;
        
        try {
            // 确保API处理模块已加载
            if (typeof APIHandlersModule === 'undefined') {
                console.error('[API_ROUTER] API处理模块未加载');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'API handlers module not available'
                }));
                return;
            }
            
            // 路由处理
            if (path === '/api/v1/health' && method === 'GET') {
                // 健康检查
                return await APIHandlersModule.handleHealthCheck(req, res);
            } else if (path === '/api/v1/items' && method === 'GET') {
                // 获取项目列表
                return await APIHandlersModule.handleGetItems(req, res);
            } else if (path.startsWith('/api/v1/item/') && method === 'GET') {
                // 获取单个项目
                const itemId = path.split('/')[4];
                if (itemId) {
                    return await APIHandlersModule.handleGetItem(req, res, itemId);
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Missing item ID'
                    }));
                    return;
                }
            } else if (path.startsWith('/api/v1/item/') && method === 'POST') {
                // 更新单个项目 (使用POST代替PUT)
                const itemId = path.split('/')[4];
                if (itemId) {
                    return await APIHandlersModule.handleUpdateItem(req, res, itemId);
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Missing item ID'
                    }));
                    return;
                }
            } else if (path === '/api/v1/library' && method === 'GET') {
                // 获取库信息
                return await APIHandlersModule.handleGetLibraryInfo(req, res);
            } else if (path === '/api/v1/sync' && method === 'POST') {
                // 同步数据
                return await APIHandlersModule.handleSyncData(req, res);
            } else if (path === '/api/v1/folder' && method === 'POST') {
                // 创建文件夹路径
                return await APIHandlersModule.handleCreateFolderPath(req, res);
            } else {
                // 404 Not Found
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Endpoint not found',
                    message: `Endpoint ${method} ${path} not found`
                }));
            }
        } catch (error) {
            console.error('[API_ROUTER] 处理请求时出错:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Internal Server Error',
                message: error.message
            }));
        }
    }

    // 公共接口
    return {
        routeRequest
    };
})();

// 添加更详细的初始化日志
console.log('[API_ROUTER] API路由模块加载完成');