/**
 * 数据处理模块
 * 负责处理从Eagle API获取的原始数据，转换为前端友好的格式
 */

// 由于Eagle插件环境的限制，我们不能使用相对路径导入模块
// 使用立即执行函数包装以避免全局变量污染

var DataProcessorModule = (function() {
    
    /**
     * 构建文件夹映射表
     * @param {Array} folders - 文件夹数组
     * @param {string} prefix - 父路径前缀
     * @returns {Object} 包含map和idMap的对象
     */
    function buildFolderMap(folders, prefix = '') {
        const map = {};
        const idMap = {};
        
        if (!folders || !Array.isArray(folders)) {
            return {map, idMap};
        }
        
        folders.forEach((folder, index) => {
            if (!folder || typeof folder !== 'object') {
                return;
            }
            
            if (!folder.id) {
                return;
            }
            
            const folderName = (folder.name && typeof folder.name === 'string' && folder.name.trim() !== '') ? folder.name.trim() : 'Unknown Folder';
            const folderPath = prefix ? `${prefix}/${folderName}` : folderName;
            
            map[folder.id] = folderPath;
            idMap[folderPath] = folder.id;
            
            // 递归处理子文件夹
            if (folder.children && folder.children.length > 0) {
                const {map: childMap, idMap: childIdMap} = buildFolderMap(folder.children, folderPath);
                Object.assign(map, childMap);
                Object.assign(idMap, childIdMap);
            }
        });
        
        return {map, idMap};
    }
    
    /**
     * 根据文件夹ID数组获取文件夹名称列表
     * @param {Array} folderIds - 文件夹ID数组
     * @param {Object} folderMap - 文件夹映射表
     * @returns {string} 逗号分隔的文件夹名称
     */
    function getFolderNames(folderIds, folderMap) {
        if (!folderIds || !Array.isArray(folderIds)) {
            return '';
        }
        
        if (!folderMap || typeof folderMap !== 'object') {
            return folderIds.join(', ');
        }
        
        const result = folderIds.map(folderId => {
            // 检查folderMap是否存在该ID的映射
            if (folderMap && typeof folderMap === 'object' && folderMap.hasOwnProperty(folderId)) {
                const folderName = folderMap[folderId];
                // 确保文件夹名称不为空
                if (folderName && typeof folderName === 'string' && folderName.trim() !== '') {
                    return folderName.trim();
                }
            }
            return folderId;
        })
        .filter(name => name && typeof name === 'string' && name.trim() !== '')
        .join(', ');
        
        return result;
    }
    
    /**
     * 递归创建文件夹路径的辅助函数
     * 注意：此函数在HTTP API环境中模拟实现，实际创建文件夹需要在pre-plugin环境中完成
     * @param {string} folderPath - 要创建的文件夹路径
     * @param {Object} folderIdMap - 当前的文件夹ID映射
     * @param {Object} createdFolders - 已创建的文件夹记录
     * @returns {Promise<string|null>} 文件夹ID或null
     */
    async function createFolderPath(folderPath, folderIdMap, createdFolders) {
        // 检查文件夹是否已存在
        if (folderIdMap && folderIdMap[folderPath]) {
            return folderIdMap[folderPath];
        }
        
        // 检查是否已经创建过但尚未刷新映射表
        if (createdFolders && createdFolders.has(folderPath)) {
            return createdFolders.get(folderPath);
        }
        
        // 在HTTP API环境中，我们无法真正创建文件夹，只能模拟过程
        return null;
    }
    
    /**
     * 处理项目列表数据，转换为前端友好的格式
     * @param {Array} items - 原始项目数组
     * @param {Object} folderMap - 文件夹映射表
     * @returns {Array} 处理后的项目数组
     */
    function processItemsData(items, folderMap) {
        console.log('[DATA_PROCESSOR] 开始处理项目数据，项目数量:', items ? items.length : 0);
        
        if (!items || !Array.isArray(items)) {
            console.log('[DATA_PROCESSOR] 项目数据无效或为空');
            return [];
        }
        
        const result = items.map((item, index) => {
            try {
                console.log(`[DATA_PROCESSOR] 处理项目 ${index}:`, {
                    id: item.id,
                    hasThumbnailPath: !!item.thumbnailPath,
                    thumbnailPath: item.thumbnailPath
                });
                
                // 检查项目是否有效
                if (!item || typeof item !== 'object') {
                    console.log(`[DATA_PROCESSOR] 跳过无效项目，索引: ${index}`);
                    return null;
                }
                
                // 增强版缩略图URL处理逻辑，按优先级顺序尝试多种来源
                let thumbnailUrl = '';
                
                // 1. 首先尝试使用thumbnailPath（本地文件路径）- 最高优先级
                // 因为thumbnailURL可能包含file://路径，我们需要优先处理thumbnailPath
                if (item.thumbnailPath && typeof item.thumbnailPath === 'string' && item.thumbnailPath.trim() !== '') {
                    try {
                        console.log(`[DATA_PROCESSOR] 处理本地缩略图路径: ${item.thumbnailPath}`);
                        // 获取干净的路径（移除file://前缀）
                        let cleanPath = item.thumbnailPath.trim();
                        if (cleanPath.startsWith('file://')) {
                            cleanPath = cleanPath.substring(7); // 移除'file://'前缀
                            console.log(`[DATA_PROCESSOR] 移除file://前缀后: ${cleanPath}`);
                        }
                        
                        // 规范化路径
                        cleanPath = cleanPath.replace(/\\/g, '/');
                        console.log(`[DATA_PROCESSOR] 规范化路径后: ${cleanPath}`);
                        const encodedPath = encodeURIComponent(cleanPath);
                        thumbnailUrl = `http://localhost:3001/static/${encodedPath}`;
                        console.log(`[DATA_PROCESSOR] 构造HTTP URL: ${thumbnailUrl}`);
                    } catch (pathError) {
                        console.warn(`[DATA_PROCESSOR] 路径处理失败: ${item.id}`, pathError);
                    }
                }
                // 2. 然后尝试使用thumbnailURL（远程缩略图URL），但要排除file://路径
                else if (item.thumbnailURL && typeof item.thumbnailURL === 'string' && item.thumbnailURL.trim() !== '' && !item.thumbnailURL.startsWith('file://')) {
                    thumbnailUrl = item.thumbnailURL.trim();
                    console.log(`[DATA_PROCESSOR] 使用远程缩略图URL: ${thumbnailUrl}`);
                } 
                // 3. 尝试从注释(annotation)中提取图片URL
                else if (item.annotation && typeof item.annotation === 'string' && item.annotation.trim() !== '') {
                    try {
                        const annotation = item.annotation.trim();
                        // 尝试从注释中提取第一个图片URL
                        const urlMatch = annotation.match(/https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|avif|ico)[^\s]*/i);
                        if (urlMatch && urlMatch[0]) {
                            thumbnailUrl = urlMatch[0];
                            console.log(`[DATA_PROCESSOR] 从注释中提取缩略图URL: ${thumbnailUrl}`);
                        }
                    } catch (annotationError) {
                        console.warn(`[DATA_PROCESSOR] 从注释提取URL失败: ${item.id}`, annotationError);
                    }
                }
                // 4. 最后作为备选，使用项目本身的url（如果是图片）
                else if (item.url && typeof item.url === 'string' && item.url.trim() !== '') {
                    const itemUrl = item.url.trim();
                    // 对于常见图片格式的URL，可以直接用作缩略图
                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.avif', '.ico'];
                    const isImageUrl = imageExtensions.some(ext => 
                        itemUrl.toLowerCase().endsWith(ext)
                    );
                    
                    if (isImageUrl) {
                        thumbnailUrl = itemUrl;
                        console.log(`[DATA_PROCESSOR] 使用项目URL作为缩略图: ${thumbnailUrl}`);
                    }
                    // 对于非图片URL，生成占位符或保持为空
                    else {
                        // 可以考虑集成第三方缩略图服务
                        // 例如：`https://api.thumbalizr.com/?url=${encodeURIComponent(itemUrl)}&width=300`
                        // 目前保持为空，前端会显示默认占位符
                        console.log(`[DATA_PROCESSOR] 项目URL不是图片格式，不作为缩略图: ${itemUrl}`);
                    }
                }
                
                // 确保url字段存在
                const url = (item.url && typeof item.url === 'string') ? item.url.trim() : '';
                
                // 处理文件夹名称
                let folderNames = '';
                if (item.folders && Array.isArray(item.folders)) {
                    folderNames = getFolderNames(item.folders, folderMap);
                    // 如果映射后仍然是ID，则使用原始ID
                    if ((!folderNames || folderNames.trim() === '') && item.folders.length > 0) {
                        folderNames = item.folders.join(', ');
                    }
                }
                
                const processedItem = {
                    id: item.id || '',
                    name: (item.name && typeof item.name === 'string') ? item.name.trim() : '',
                    url: url,
                    thumbnail: thumbnailUrl,
                    folders: (folderNames && typeof folderNames === 'string') ? folderNames.trim() : '',
                    tags: item.tags && Array.isArray(item.tags) ? item.tags.join(', ') : '',
                    annotation: (item.annotation && typeof item.annotation === 'string') ? item.annotation.trim() : '',
                    lastModified: item.lastModified ? new Date(item.lastModified).toLocaleString() : ''
                };
                
                console.log(`[DATA_PROCESSOR] 处理完成的项目 ${index}:`, {
                    id: processedItem.id,
                    thumbnail: processedItem.thumbnail
                });
                
                return processedItem;
            } catch (error) {
                console.error(`[DATA_PROCESSOR] 处理项目时出错，索引: ${index}`, error);
                return null;
            }
        })
        .filter(item => item !== null); // 过滤掉处理失败的项目
        
        console.log(`[DATA_PROCESSOR] 项目数据处理完成，共处理 ${result.length} 个项目`);
        return result;
    }
    
    /**
     * 处理库信息数据
     * @param {Object} libraryInfo - 原始库信息
     * @returns {Object} 处理后的库信息，包含文件夹映射表
     */
    function processLibraryInfo(libraryInfo) {
        if (!libraryInfo || typeof libraryInfo !== 'object') {
            return {
                libraryInfo: {},
                folderMap: {},
                folderIdMap: {}
            };
        }
        
        const {map, idMap} = buildFolderMap(libraryInfo.folders || []);
        
        return {
            libraryInfo: libraryInfo,
            folderMap: map,
            folderIdMap: idMap
        };
    }
    
    // 公共接口
    return {
        buildFolderMap,
        getFolderNames,
        processItemsData,
        processLibraryInfo
    };
})();

console.log('[DATA_PROCESSOR] 数据处理模块加载完成');