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
        
        console.log(`[DATA_PROCESSOR] 构建文件夹映射表，前缀: "${prefix}", 文件夹数量: ${folders ? folders.length : 0}`);
        
        if (!folders || !Array.isArray(folders)) {
            console.log('[DATA_PROCESSOR] 文件夹数据无效或为空');
            return {map, idMap};
        }
        
        folders.forEach((folder, index) => {
            if (!folder || typeof folder !== 'object') {
                console.log('[DATA_PROCESSOR] 跳过无效的文件夹对象');
                return;
            }
            
            if (!folder.id) {
                console.log('[DATA_PROCESSOR] 跳过没有ID的文件夹对象');
                return;
            }
            
            const folderName = (folder.name && typeof folder.name === 'string' && folder.name.trim() !== '') ? folder.name.trim() : 'Unknown Folder';
            const folderPath = prefix ? `${prefix}/${folderName}` : folderName;
            
            console.log(`[DATA_PROCESSOR] 处理文件夹: ID=${folder.id}, 名称=${folderName}, 路径=${folderPath}`);
            
            map[folder.id] = folderPath;
            idMap[folderPath] = folder.id;
            
            // 递归处理子文件夹
            if (folder.children && folder.children.length > 0) {
                console.log(`[DATA_PROCESSOR] 处理 ${folder.children.length} 个子文件夹`);
                const {map: childMap, idMap: childIdMap} = buildFolderMap(folder.children, folderPath);
                Object.assign(map, childMap);
                Object.assign(idMap, childIdMap);
            }
        });
        
        console.log(`[DATA_PROCESSOR] 文件夹映射表构建完成，map大小: ${Object.keys(map).length}, idMap大小: ${Object.keys(idMap).length}`);
        return {map, idMap};
    }
    
    /**
     * 根据文件夹ID数组获取文件夹名称列表
     * @param {Array} folderIds - 文件夹ID数组
     * @param {Object} folderMap - 文件夹映射表
     * @returns {string} 逗号分隔的文件夹名称
     */
    function getFolderNames(folderIds, folderMap) {
        console.log(`[DATA_PROCESSOR] 处理文件夹ID数量: ${folderIds ? folderIds.length : 0}, 文件夹映射表大小: ${folderMap ? Object.keys(folderMap).length : 0}`);
        
        if (!folderIds || !Array.isArray(folderIds)) {
            console.log('[DATA_PROCESSOR] 文件夹ID无效或为空');
            return '';
        }
        
        if (!folderMap || typeof folderMap !== 'object') {
            console.log('[DATA_PROCESSOR] 文件夹映射表无效');
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
        
        console.log(`[DATA_PROCESSOR] 处理后的文件夹名称数量: ${result.split(', ').length}`);
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
        console.log(`[DATA_PROCESSOR] 创建文件夹路径: ${folderPath}`);
        
        // 检查文件夹是否已存在
        if (folderIdMap && folderIdMap[folderPath]) {
            console.log(`[DATA_PROCESSOR] 文件夹路径 "${folderPath}" 已存在，ID: ${folderIdMap[folderPath]}`);
            return folderIdMap[folderPath];
        }
        
        // 检查是否已经创建过但尚未刷新映射表
        if (createdFolders && createdFolders.has(folderPath)) {
            console.log(`[DATA_PROCESSOR] 文件夹路径 "${folderPath}" 已创建过，ID: ${createdFolders.get(folderPath)}`);
            return createdFolders.get(folderPath);
        }
        
        // 在HTTP API环境中，我们无法真正创建文件夹，只能模拟过程
        console.log(`[DATA_PROCESSOR] 在HTTP API环境中无法真正创建文件夹，仅模拟过程`);
        return null;
    }
    
    /**
     * 处理项目列表数据，转换为前端友好的格式
     * @param {Array} items - 原始项目数组
     * @param {Object} folderMap - 文件夹映射表
     * @returns {Array} 处理后的项目数组
     */
    function processItemsData(items, folderMap) {
        if (!items || !Array.isArray(items)) {
            console.log('[DATA_PROCESSOR] 输入项目数据无效或为空');
            return [];
        }
        
        console.log(`[DATA_PROCESSOR] 开始处理 ${items.length} 个项目`);
        console.log(`[DATA_PROCESSOR] folderMap大小: ${folderMap ? Object.keys(folderMap).length : 0}`);
        
        // 检查前几个项目的数据结构
        for (let i = 0; i < Math.min(3, items.length); i++) {
            console.log(`[DATA_PROCESSOR] 原始项目${i}:`, {
                id: items[i].id,
                name: items[i].name,
                hasUrl: !!items[i].url,
                hasThumbnailURL: !!items[i].thumbnailURL,
                hasThumbnailPath: !!items[i].thumbnailPath,
                folders: items[i].folders,
                hasTags: !!items[i].tags,
                hasAnnotation: !!items[i].annotation,
                hasLastModified: !!items[i].lastModified
            });
        }
        
        const result = items.map((item, index) => {
            try {
                // 检查项目是否有效
                if (!item || typeof item !== 'object') {
                    console.warn(`[DATA_PROCESSOR] 跳过无效项目，索引: ${index}`);
                    return null;
                }
                
                // 处理缩略图URL，优先使用thumbnailURL，其次是thumbnailPath，最后是url
                let thumbnailUrl = '';
                if (item.thumbnailURL && typeof item.thumbnailURL === 'string' && item.thumbnailURL.trim() !== '') {
                    thumbnailUrl = item.thumbnailURL.trim();
                    console.log(`[DATA_PROCESSOR] 使用thumbnailURL: ${item.id}`);
                } else if (item.thumbnailPath && typeof item.thumbnailPath === 'string' && item.thumbnailPath.trim() !== '') {
                    // 将本地文件路径转换为可通过HTTP访问的URL
                    const encodedPath = encodeURIComponent(item.thumbnailPath.trim());
                    thumbnailUrl = `http://localhost:3001/static/${encodedPath}`;
                    console.log(`[DATA_PROCESSOR] 使用thumbnailPath并转换为HTTP URL: ${item.id}`);
                } else if (item.url && typeof item.url === 'string' && item.url.trim() !== '') {
                    thumbnailUrl = item.url.trim();
                    console.log(`[DATA_PROCESSOR] 使用url: ${item.id}`);
                } else {
                    console.log(`[DATA_PROCESSOR] 没有可用的缩略图URL: ${item.id}`);
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
                
                // 记录处理后的字段信息（仅前几个项目）
                if (index < 3) {
                    console.log(`[DATA_PROCESSOR] 处理项目 ${item.id}: url=${!!processedItem.url}, thumbnail=${!!processedItem.thumbnail}, folders=${processedItem.folders}`);
                }
                
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
        console.log('[DATA_PROCESSOR] 开始处理库信息:', libraryInfo ? {
            name: libraryInfo.name,
            foldersCount: libraryInfo.folders ? libraryInfo.folders.length : 0
        } : '库信息为空');
        
        if (!libraryInfo || typeof libraryInfo !== 'object') {
            console.warn('[DATA_PROCESSOR] 库信息无效');
            return {
                libraryInfo: {},
                folderMap: {},
                folderIdMap: {}
            };
        }
        
        const {map, idMap} = buildFolderMap(libraryInfo.folders || []);
        console.log(`[DATA_PROCESSOR] 构建文件夹映射完成，folderMap大小: ${Object.keys(map).length}, folderIdMap大小: ${Object.keys(idMap).length}`);
        
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