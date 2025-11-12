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

// 构建文件夹树结构
function buildFolderTree(folders, prefix = '') {
    return folders.map(folder => {
        const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
        return {
            id: folder.id,
            name: folder.name,
            path: folderPath,
            children: folder.children && folder.children.length > 0 
                ? buildFolderTree(folder.children, folderPath)
                : []
        };
    });
}

// 为文件夹节点生成唯一标识符
function generateFolderColumnId(folderPath) {
    // 处理根路径的特殊情况
    if (folderPath === '') {
        return 'folder_root';
    }
    // 将路径转换为合法的字段名
    return 'folder_' + folderPath.replace(/[^a-zA-Z0-9]/g, '_');
}

// 生成基于文件夹结构的动态列定义
function generateDynamicColumns(folderTree) {
    console.log('[DATA] 开始生成动态列定义，文件夹树:', folderTree);
    
    // 为非叶子节点创建列（即文件夹路径的倒数第二层）
    function processFolderNode(node) {
        const columnId = generateFolderColumnId(node.path);
        console.log(`[DATA] 处理节点: ${node.name}, 路径: ${node.path}, ID: ${columnId}`);
        
        // 如果有子文件夹，创建组
        if (node.children && node.children.length > 0) {
            const columns = node.children.map(processFolderNode).filter(col => col !== null);
            console.log(`[DATA] 节点 ${node.name} 的子列:`, columns);
            // 只有当有非空子列时才创建列组
            if (columns.length > 0) {
                return {
                    title: node.name,
                    field: columnId,
                    columns: columns
                };
            } else {
                // 如果子列都为空，说明子节点都是叶子节点，这种情况下我们需要创建一个列来显示这些叶子节点
                // 但我们不创建列组，而是直接返回null
                console.log(`[DATA] 节点 ${node.name} 的子节点都是叶子节点，不创建列组`);
                return null;
            }
        } else {
            // 叶子节点不创建列
            console.log(`[DATA] 节点 ${node.name} 是叶子节点，不创建列`);
            return null;
        }
    }
    
    // 为每个根文件夹生成列定义，并过滤掉null值
    const columns = folderTree.map(processFolderNode).filter(col => col !== null);
    console.log('[DATA] 生成的动态列定义:', columns);
    
    return columns;
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
        
        // 构建文件夹树结构
        const folderTree = buildFolderTree(libraryInfo.folders || []);
        window.folderTree = folderTree;
        
        // 生成动态列定义
        const dynamicColumns = generateDynamicColumns(folderTree);
        window.dynamicColumns = dynamicColumns;
        
        console.log('[DATA] 文件夹映射构建完成，映射表大小:', Object.keys(window.folderMap).length);
        console.log('[DATA] 动态列定义生成完成，列数量:', dynamicColumns.length);
        
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
            
            // 构建动态列数据
            const dynamicData = {};
            if (item.folders && Array.isArray(item.folders)) {
                // 为每个项目所属的文件夹在对应列中填写最内层文件夹名称
                item.folders.forEach(folderId => {
                    const folderPath = window.folderMap[folderId];
                    if (folderPath) {
                        // 获取文件夹路径的所有父路径
                        const pathParts = folderPath.split('/');
                        // 只有当路径有多层时才处理
                        if (pathParts.length >= 2) {
                            // 获取倒数第二层路径（父文件夹）
                            const parentPath = pathParts.slice(0, -1).join('/');
                            // 获取最内层文件夹名称
                            const innerFolderName = pathParts[pathParts.length - 1];
                            // 为父文件夹对应的列设置最内层文件夹名称
                            const columnId = generateFolderColumnId(parentPath);
                            // 如果该列已存在值，则追加新的文件夹名称
                            if (dynamicData[columnId]) {
                                dynamicData[columnId] += ', ' + innerFolderName;
                            } else {
                                dynamicData[columnId] = innerFolderName;
                            }
                        } else if (pathParts.length === 1) {
                            // 根文件夹的情况，直接在根节点下显示
                            const columnId = generateFolderColumnId('');
                            if (dynamicData[columnId]) {
                                dynamicData[columnId] += ', ' + pathParts[0];
                            } else {
                                dynamicData[columnId] = pathParts[0];
                            }
                        }
                    }
                });
            }
            
            const result = {
                id: item.id,
                name: item.name,
                url: item.url || '',
                thumbnail: thumbnailUrl,
                folders: folders,
                tags: tags,
                annotation: item.annotation || '',
                lastModified: item.lastModified ? new Date(item.lastModified).toLocaleString() : '',
                ...dynamicData // 合并动态列数据
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
