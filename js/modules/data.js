// 构建文件夹映射表
function buildFolderMap(folders, prefix = '') {
    const map = {};
    const idMap = {};
    
    folders.forEach(folder => {
        const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
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

// 加载Eagle项目数据
async function loadEagleItems() {
    try {
        showStatus('正在读取Eagle素材库数据...', 'info');
        console.log('[DATA] 开始加载Eagle项目数据');
        
        // 检查是否在Eagle环境中
        if (typeof eagle === 'undefined') {
            throw new Error('未检测到Eagle环境');
        }
        
        // 获取库信息以构建文件夹映射
        const libraryInfo = await eagle.library.info();
        console.log('[DATA] 获取到库信息:', libraryInfo);
        const {map, idMap} = buildFolderMap(libraryInfo.folders || []);
        window.folderMap = map;
        window.folderIdMap = idMap;
        console.log('[DATA] 文件夹映射构建完成，映射表大小:', Object.keys(window.folderMap).length);
        
        // 获取项目数据
        const items = await eagle.item.get({
            limit: 10000,
            fields: ["id", "name", "url", "folders", "tags", "annotation", "lastModified", "thumbnailURL", "thumbnailPath"]
        });
        
        console.log('[DATA] 获取到', items.length, '个项目');
        window.originalItems = {}; // 清空原始项目数据
        
        // 转换数据格式以适配表格
        window.tableData = items.map(item => {
            // 保存原始项目数据（用于后续更新）
            window.originalItems[item.id] = item;
            
            // 处理文件夹信息
            let folders = '';
            if (item.folders && Array.isArray(item.folders)) {
                folders = item.folders.map(folderId => {
                    // 使用文件夹ID查找实际的文件夹路径
                    const folderName = window.folderMap[folderId] || folderId;
                    return folderName;
                }).filter(name => name !== '').join(', ');
            }
            
            // 处理标签信息
            let tags = '';
            if (item.tags && Array.isArray(item.tags)) {
                tags = item.tags.join(', ');
            }
            
            // 处理图片URL，优先使用thumbnailURL，其次是thumbnailPath，最后是url
            let thumbnailUrl = '';
            if (item.thumbnailURL) {
                thumbnailUrl = item.thumbnailURL;
            } else if (item.thumbnailPath) {
                thumbnailUrl = item.thumbnailPath;
            } else if (item.url) {
                thumbnailUrl = item.url;
            }
            
            const result = {
                id: item.id,
                name: item.name,
                url: item.url || '',
                thumbnail: thumbnailUrl,
                folders: folders,
                tags: tags,
                annotation: item.annotation || '',
                lastModified: item.lastModified ? new Date(item.lastModified).toLocaleString() : ''
            };
            
            return result;
        });
        
        console.log('[DATA] 数据转换完成，最终数据数量:', window.tableData.length);
        showStatus(`成功加载 ${window.tableData.length} 个项目`, 'success');
        const statusBarEl = document.getElementById('status-bar');
        if (statusBarEl) {
            statusBarEl.textContent = `就绪 - 已加载 ${window.tableData.length} 个项目`;
        }
        return window.tableData;
    } catch (error) {
        console.error('[DATA] 加载项目失败:', error);
        showStatus('加载项目失败: ' + error.message, 'error');
        return [];
    }
}

// 根据文件夹ID数组获取文件夹名称
function getFolderNames(folderIds) {
    if (!folderIds || !Array.isArray(folderIds)) return '';
    const result = folderIds.map(folderId => window.folderMap[folderId] || folderId)
        .filter(name => name !== '')
        .join(', ');
    return result;
}

// 处理用户输入的文件夹字符串，转换为文件夹ID数组
function parseFolderInput(folderInput) {
    if (!folderInput) return [];
    
    // 分割并清理文件夹名称
    const folderNames = folderInput.split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    // 查找对应的文件夹ID
    const folderIds = [];
    for (const folderName of folderNames) {
        const folderId = window.folderIdMap[folderName];
        if (folderId) {
            folderIds.push(folderId);
        } else {
            console.warn(`[DATA] 未找到文件夹 "${folderName}" 的ID`);
        }
    }
    
    return folderIds;
}
