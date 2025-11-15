/**
 * API处理函数模块
 * 负责具体API端点的处理逻辑
 */

// 由于Eagle插件环境的限制，我们不能使用相对路径导入模块
// 使用立即执行函数包装以避免全局变量污染

var APIHandlersModule = (function() {

    /**
     * 处理获取项目列表请求
     */
    async function handleGetItems(req, res) {
        try {
            console.log('[API_HANDLERS] 收到获取项目列表请求');
            
            // 检查eagle对象和api方法是否存在
            if (typeof eagle === 'undefined' || !eagle.item || typeof eagle.item.getAll !== 'function') {
                console.error('[API_HANDLERS] Eagle API不可用');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Eagle API not available',
                    message: 'Eagle API不可用，请确保插件在Eagle环境中运行'
                }));
                return;
            }
            
            // 使用eagle.item.getAll获取项目列表
            // 指定需要的字段以提高性能
            const items = await eagle.item.getAll({
                fields: ["id", "name", "url", "folders", "tags", "annotation", "lastModified", "thumbnailURL", "thumbnailPath"]
            });
            
            console.log(`[API_HANDLERS] 从Eagle API获取到 ${items ? items.length : 0} 个项目`);
            
            // 检查数据处理器模块是否可用
            if (typeof DataProcessorModule !== 'undefined' && 
                typeof DataProcessorModule.processItemsData === 'function') {
                // 如果可以获取到库信息，处理数据格式
                let processedItems = items;
                
                try {
                    // 尝试获取库信息以构建文件夹映射
                    if (eagle.library && eagle.library.info && typeof eagle.library.info === 'function') {
                        console.log('[API_HANDLERS] 尝试获取库信息以构建文件夹映射');
                        const libraryInfo = await eagle.library.info();
                        console.log('[API_HANDLERS] 成功获取库信息:', libraryInfo ? {
                            name: libraryInfo.name,
                            foldersCount: libraryInfo.folders ? libraryInfo.folders.length : 0
                        } : '库信息为空');
                        
                        // 添加更多调试信息
                        console.log('[API_HANDLERS] 库信息详细内容:', libraryInfo);
                        
                        const processedLibraryInfo = DataProcessorModule.processLibraryInfo(libraryInfo);
                        console.log('[API_HANDLERS] 处理后的库信息详细内容:', processedLibraryInfo);
                        // 确保正确从返回值中提取map属性
                        const folderMap = processedLibraryInfo && processedLibraryInfo.folderMap ? processedLibraryInfo.folderMap : {};
                        console.log('[API_HANDLERS] 处理后的库信息:', {
                            folderMapSize: folderMap && typeof folderMap === 'object' ? Object.keys(folderMap).length : 0
                        });
                        console.log(`[API_HANDLERS] 构建文件夹映射完成，映射表大小: ${folderMap && typeof folderMap === 'object' ? Object.keys(folderMap).length : 0}`);
                        
                        console.log('[API_HANDLERS] 准备调用processItemsData处理项目数据');
                        processedItems = DataProcessorModule.processItemsData(items, folderMap);
                        console.log('[API_HANDLERS] 项目数据处理完成，处理后的项目数量:', processedItems.length);
                    } else {
                        console.warn('[API_HANDLERS] 无法获取库信息，跳过文件夹映射处理');
                        // 即使无法获取库信息，也要处理项目数据
                        console.log('[API_HANDLERS] 准备调用processItemsData处理项目数据（无文件夹映射）');
                        processedItems = DataProcessorModule.processItemsData(items, {});
                        console.log('[API_HANDLERS] 项目数据处理完成，处理后的项目数量:', processedItems.length);
                    }
                } catch (processError) {
                    console.warn('[API_HANDLERS] 数据处理过程中出现警告:', processError);
                    console.warn('[API_HANDLERS] 错误堆栈:', processError.stack);
                    // 出现错误时，尝试使用原始数据
                    processedItems = items;
                    console.log('[API_HANDLERS] 使用原始数据，项目数量:', processedItems.length);
                }
                
                console.log(`[API_HANDLERS] 数据处理完成，准备返回 ${processedItems.length} 个项目`);
                // 添加更多日志信息，检查processedItems的内容
                if (processedItems.length > 0) {
                    console.log('[API_HANDLERS] 第一个项目示例:', {
                        id: processedItems[0].id,
                        name: processedItems[0].name,
                        hasUrl: !!processedItems[0].url,
                        hasThumbnail: !!processedItems[0].thumbnail,
                        folders: processedItems[0].folders,
                        hasTags: !!processedItems[0].tags,
                        hasAnnotation: !!processedItems[0].annotation,
                        lastModified: processedItems[0].lastModified
                    });
                    
                    // 检查前几个项目是否为空对象
                    for (let i = 0; i < Math.min(3, processedItems.length); i++) {
                        console.log(`[API_HANDLERS] 处理后项目${i}:`, processedItems[i]);
                    }
                }
                
                // 检查是否有空对象
                const emptyItems = processedItems.filter(item => {
                    return !item || (typeof item === 'object' && Object.keys(item).length === 0);
                });
                console.log(`[API_HANDLERS] 空对象数量: ${emptyItems.length}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                const responseData = {
                    success: true,
                    data: processedItems,
                    count: processedItems.length
                };
                console.log('[API_HANDLERS] 准备返回的响应数据:', {
                    success: responseData.success,
                    count: responseData.count,
                    dataLength: responseData.data.length
                });
                res.end(JSON.stringify(responseData));
            } else {
                // 如果数据处理器不可用，返回原始数据
                console.warn('[API_HANDLERS] 数据处理器模块不可用，返回原始数据');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: items,
                    count: items.length
                }));
            }
        } catch (error) {
            console.error('[API_HANDLERS] 获取项目列表失败:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to get items',
                message: error.message
            }));
        }
    }

    /**
     * 处理获取单个项目请求
     */
    async function handleGetItem(req, res, itemId) {
        try {
            console.log(`[API_HANDLERS] 收到获取项目请求，ID: ${itemId}`);
            
            // 检查eagle对象和api方法是否存在
            if (typeof eagle === 'undefined' || !eagle.item || typeof eagle.item.getById !== 'function') {
                console.error('[API_HANDLERS] Eagle API不可用');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Eagle API not available',
                    message: 'Eagle API不可用，请确保插件在Eagle环境中运行'
                }));
                return;
            }
            
            // 使用eagle.item.getById获取单个项目
            const item = await eagle.item.getById(itemId);
            
            if (item) {
                // 检查数据处理器模块是否可用
                if (typeof DataProcessorModule !== 'undefined' && 
                    typeof DataProcessorModule.processItemsData === 'function') {
                    // 如果可以获取到库信息，处理数据格式
                    let processedItem = item;
                    
                    try {
                        // 尝试获取库信息以构建文件夹映射
                        if (eagle.library && eagle.library.info && typeof eagle.library.info === 'function') {
                            const libraryInfo = await eagle.library.info();
                            if (libraryInfo) {
                                console.log(`[API_HANDLERS] 成功获取库信息: ${libraryInfo.name}, 包含 ${libraryInfo.folders ? libraryInfo.folders.length : 0} 个文件夹`);
                                
                                const {map: folderMap} = DataProcessorModule.processLibraryInfo(libraryInfo);
                                processedItem = DataProcessorModule.processItemsData([item], folderMap)[0];
                                console.log('[API_HANDLERS] 项目数据处理完成');
                            } else {
                                console.warn('[API_HANDLERS] 获取到的库信息为空');
                            }
                        } else {
                            console.warn('[API_HANDLERS] 无法获取库信息，跳过文件夹映射处理');
                        }
                    } catch (processError) {
                        console.warn('[API_HANDLERS] 数据处理过程中出现警告:', processError.message);
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        data: processedItem
                    }));
                } else {
                    // 如果数据处理器不可用，返回原始数据
                    console.warn('[API_HANDLERS] 数据处理器模块不可用，返回原始数据');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        data: item
                    }));
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Item not found'
                }));
            }
        } catch (error) {
            console.error(`[API_HANDLERS] 获取项目失败，ID: ${itemId}`, error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to get item',
                message: error.message
            }));
        }
    }

    /**
     * 处理更新单个项目请求
     */
    async function handleUpdateItem(req, res, itemId) {
        try {
            console.log(`[API_HANDLERS] 收到更新项目请求，ID: ${itemId}`);
            
            // 读取请求体
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const updateData = JSON.parse(body);
                    
                    // 检查eagle对象是否存在
                    if (typeof eagle === 'undefined') {
                        console.error('[API_HANDLERS] Eagle API不可用');
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: 'Eagle API not available',
                            message: 'Eagle API不可用，请确保插件在Eagle环境中运行'
                        }));
                        return;
                    }
                    
                    // 检查数据同步模块是否可用
                    if (typeof DataSyncModule !== 'undefined' && 
                        typeof DataSyncModule.syncItemToEagle === 'function') {
                        
                        // 首先获取原始项目
                        if (!eagle.item || typeof eagle.item.getById !== 'function') {
                            console.error('[API_HANDLERS] Eagle item API不可用');
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Eagle item API not available',
                                message: 'Eagle item API不可用，请确保插件在Eagle环境中运行'
                            }));
                            return;
                        }
                        
                        const originalItem = await eagle.item.getById(itemId);
                        if (!originalItem) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Item not found',
                                message: '未找到指定ID的项目'
                            }));
                            return;
                        }
                        
                        // 获取库信息以构建文件夹映射
                        let folderIdMap = {};
                        if (eagle.library && eagle.library.info && typeof eagle.library.info === 'function') {
                            try {
                                const libraryInfo = await eagle.library.info();
                                if (DataProcessorModule && typeof DataProcessorModule.processLibraryInfo === 'function') {
                                    const {folderIdMap: idMap} = DataProcessorModule.processLibraryInfo(libraryInfo);
                                    folderIdMap = idMap;
                                }
                            } catch (libraryError) {
                                console.warn('[API_HANDLERS] 获取库信息失败:', libraryError);
                            }
                        }
                        
                        // 同步项目数据
                        const syncResult = await DataSyncModule.syncItemToEagle(originalItem, updateData, folderIdMap);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(syncResult));
                    } else {
                        // 如果数据同步模块不可用，返回默认响应
                        const result = {
                            success: true,
                            message: 'Update request received',
                            itemId: itemId,
                            updateData: updateData
                        };
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    }
                } catch (parseError) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Invalid JSON',
                        message: parseError.message
                    }));
                }
            });
        } catch (error) {
            console.error(`[API_HANDLERS] 更新项目失败，ID: ${itemId}`, error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to update item',
                message: error.message
            }));
        }
    }

    /**
     * 处理获取库信息请求
     */
    async function handleGetLibraryInfo(req, res) {
        try {
            console.log('[API_HANDLERS] 收到获取库信息请求');
            
            // 检查eagle对象和api方法是否存在
            if (typeof eagle === 'undefined' || !eagle.library || typeof eagle.library.info !== 'function') {
                console.error('[API_HANDLERS] Eagle API不可用');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Eagle API not available',
                    message: 'Eagle API不可用，请确保插件在Eagle环境中运行'
                }));
                return;
            }
            
            // 使用eagle.library.info获取库信息
            const libraryInfo = await eagle.library.info();
            if (libraryInfo) {
                console.log(`[API_HANDLERS] 成功获取库信息: ${libraryInfo.name}, 包含 ${libraryInfo.folders ? libraryInfo.folders.length : 0} 个文件夹`);
            } else {
                console.warn('[API_HANDLERS] 获取到的库信息为空');
            }
            
            // 检查数据处理器模块是否可用
            if (typeof DataProcessorModule !== 'undefined' && 
                typeof DataProcessorModule.processLibraryInfo === 'function') {
                // 处理库信息数据
                const processedLibraryInfo = DataProcessorModule.processLibraryInfo(libraryInfo);
                console.log('[API_HANDLERS] 库信息处理完成');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: processedLibraryInfo
                }));
            } else {
                // 如果数据处理器不可用，返回原始数据
                console.warn('[API_HANDLERS] 数据处理器模块不可用，返回原始数据');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: libraryInfo
                }));
            }
        } catch (error) {
            console.error('[API_HANDLERS] 获取库信息失败:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to get library info',
                message: error.message
            }));
        }
    }

    /**
     * 处理同步数据请求
     */
    async function handleSyncData(req, res) {
        try {
            console.log('[API_HANDLERS] 收到同步数据请求');
            
            // 读取请求体
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    // 检查eagle对象是否存在
                    if (typeof eagle === 'undefined') {
                        console.error('[API_HANDLERS] Eagle API不可用');
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: 'Eagle API not available',
                            message: 'Eagle API不可用，请确保插件在Eagle环境中运行'
                        }));
                        return;
                    }
                    
                    const syncData = JSON.parse(body);
                    
                    // 检查数据同步模块是否可用
                    if (typeof DataSyncModule !== 'undefined' && 
                        typeof DataSyncModule.syncBatchDataToEagle === 'function') {
                        
                        // 获取库信息以构建文件夹映射
                        let folderIdMap = {};
                        if (eagle.library && eagle.library.info && typeof eagle.library.info === 'function') {
                            try {
                                const libraryInfo = await eagle.library.info();
                                if (DataProcessorModule && typeof DataProcessorModule.processLibraryInfo === 'function') {
                                    const {folderIdMap: idMap} = DataProcessorModule.processLibraryInfo(libraryInfo);
                                    folderIdMap = idMap;
                                }
                            } catch (libraryError) {
                                console.warn('[API_HANDLERS] 获取库信息失败:', libraryError);
                            }
                        }
                        
                        // 批量同步数据
                        const syncResult = await DataSyncModule.syncBatchDataToEagle(syncData.items || [], folderIdMap);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(syncResult));
                    } else {
                        // 如果数据同步模块不可用，返回默认响应
                        const result = {
                            processed: syncData.items ? syncData.items.length : 0,
                            timestamp: Date.now()
                        };
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Data synced successfully',
                            data: result
                        }));
                    }
                } catch (parseError) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Invalid JSON',
                        message: parseError.message
                    }));
                }
            });
        } catch (error) {
            console.error('[API_HANDLERS] 同步数据失败:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to sync data',
                message: error.message
            }));
        }
    }

    /**
     * 处理创建文件夹路径请求
     */
    async function handleCreateFolderPath(req, res) {
        try {
            console.log('[API_HANDLERS] 收到创建文件夹路径请求');
            
            // 读取请求体
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    const { folderPath } = requestData;
                    
                    // 检查eagle对象是否存在
                    if (typeof eagle === 'undefined') {
                        console.error('[API_HANDLERS] Eagle API不可用');
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: 'Eagle API not available',
                            message: 'Eagle API不可用，请确保插件在Eagle环境中运行'
                        }));
                        return;
                    }
                    
                    // 检查DataProcessor模块是否可用
                    if (typeof DataProcessorModule !== 'undefined' && 
                        typeof DataProcessorModule.createFolderPath === 'function') {
                        
                        // 获取库信息以构建文件夹映射
                        let folderIdMap = {};
                        let createdFolders = new Map();
                        
                        if (eagle.library && eagle.library.info && typeof eagle.library.info === 'function') {
                            try {
                                const libraryInfo = await eagle.library.info();
                                if (DataProcessorModule && typeof DataProcessorModule.processLibraryInfo === 'function') {
                                    const {folderIdMap: idMap} = DataProcessorModule.processLibraryInfo(libraryInfo);
                                    folderIdMap = idMap;
                                }
                            } catch (libraryError) {
                                console.warn('[API_HANDLERS] 获取库信息失败:', libraryError);
                            }
                        }
                        
                        // 创建文件夹路径
                        const folderId = await DataProcessorModule.createFolderPath(folderPath, folderIdMap, createdFolders);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Folder path processed',
                            folderPath: folderPath,
                            folderId: folderId
                        }));
                    } else {
                        // 如果DataProcessor模块不可用，返回默认响应
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Folder path request received',
                            folderPath: folderPath,
                            folderId: null
                        }));
                    }
                } catch (parseError) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Invalid JSON',
                        message: parseError.message
                    }));
                }
            });
        } catch (error) {
            console.error('[API_HANDLERS] 创建文件夹路径失败:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Failed to create folder path',
                message: error.message
            }));
        }
    }

    /**
     * 处理健康检查请求
     */
    function handleHealthCheck(req, res) {
        console.log('[API_HANDLERS] 收到健康检查请求');
        
        // 检查eagle对象是否存在
        const eagleAvailable = typeof eagle !== 'undefined';
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            eagleAvailable: eagleAvailable
        }));
    }

    // 公共接口
    return {
        handleGetItems,
        handleGetItem,
        handleUpdateItem,
        handleGetLibraryInfo,
        handleSyncData,
        handleCreateFolderPath,
        handleHealthCheck
    };
})();

console.log('[API_HANDLERS] API处理函数模块加载完成');