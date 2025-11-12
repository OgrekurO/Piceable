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
    console.log('[DATA] 构建文件夹树结构，输入folders:', folders, 'prefix:', prefix);
    const result = folders.map(folder => {
        const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
        const folderObj = {
            id: folder.id,
            name: folder.name,
            path: folderPath,
            children: folder.children && folder.children.length > 0 
                ? buildFolderTree(folder.children, folderPath)
                : []
        };
        return folderObj;
    });
    console.log('[DATA] 构建文件夹树结构结果:', result);
    return result;
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
    
    // 存储列字段到文件夹路径的映射关系
    window.columnPathMap = window.columnPathMap || {};
    
    // 为所有层级创建列，不仅仅是非叶子节点
    function processFolderNode(node, depth = 0) {
        const columnId = generateFolderColumnId(node.path);
        console.log(`[DATA] 处理节点: ${node.name}, 路径: ${node.path}, ID: ${columnId}, 深度: ${depth}`);
        
        // 记录列字段到文件夹路径的映射
        window.columnPathMap[columnId] = node.path;
        
        // 如果有子文件夹，创建组
        if (node.children && node.children.length > 0) {
            const columns = node.children.map(child => processFolderNode(child, depth + 1)).filter(col => col !== null);
            console.log(`[DATA] 节点 ${node.name} 的子列:`, columns);
            
            // 对于深度大于等于1的节点（即非根节点），如果子节点中有叶子节点，
            // 则添加一个"其他"列来显示这些叶子节点
            if (depth >= 1 && node.children.some(child => !child.children || child.children.length === 0)) {
                const otherColumnId = columnId + "_other";
                window.columnPathMap[otherColumnId] = node.path; // "其他"列也映射到父路径
                
                columns.push({
                    title: "其他",
                    field: otherColumnId,
                    editor: "input",
                    width: 150
                });
            }
            
            return {
                title: node.name,
                field: columnId,
                columns: columns
            };
        } else {
            // 叶子节点创建普通列
            console.log(`[DATA] 为叶子节点 ${node.name} 创建列`);
            return {
                title: node.name,
                field: columnId,
                editor: "input",
                width: 150
            };
        }
    }
    
    // 为每个根文件夹生成列定义，并过滤掉null值
    const columns = folderTree.map(rootNode => processFolderNode(rootNode, 0)).filter(col => col !== null);
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
            // 添加分组字段
            const groupingData = {
                countryGroup: '',  // 国家级分组字段
                regionGroup: ''    // 地区分组字段
            };
            
            if (item.folders && Array.isArray(item.folders)) {
                // 为每个项目所属的文件夹在对应列中填写最内层文件夹名称
                item.folders.forEach(folderId => {
                    const folderPath = window.folderMap[folderId];
                    if (folderPath) {
                        // 获取文件夹路径的所有父路径
                        const pathParts = folderPath.split('/');
                        
                        // 设置分组字段
                        if (pathParts.length >= 1) {
                            groupingData.countryGroup = pathParts[0];  // 第一层作为国家分组
                        }
                        if (pathParts.length >= 2) {
                            groupingData.regionGroup = pathParts[1];   // 第二层作为地区分组
                        }
                        
                        // 根据路径长度处理不同情况
                        if (pathParts.length === 1) {
                            // 单层路径，如"国外"
                            const columnId = generateFolderColumnId(folderPath);
                            if (!dynamicData[columnId]) {
                                dynamicData[columnId] = '';
                            }
                        } else if (pathParts.length === 2) {
                            // 两层路径，如"国外/@英国V&A博物馆"
                            const parentPath = pathParts[0];  // "国外"
                            const leafName = pathParts[1];    // "@英国V&A博物馆"
                            const columnId = generateFolderColumnId(parentPath);
                            if (dynamicData[columnId]) {
                                dynamicData[columnId] += ', ' + leafName;
                            } else {
                                dynamicData[columnId] = leafName;
                            }
                        } else if (pathParts.length >= 3) {
                            // 三层或更多层路径，如"国外/德国/德国埃森，世界文化遗产佐尔维尔矿区"
                            const parentPath = pathParts.slice(0, -1).join('/');  // "国外/德国"
                            const grandParentPath = pathParts.slice(0, -2).join('/'); // "国外"
                            const leafName = pathParts[pathParts.length - 1];         // "德国埃森，世界文化遗产佐尔维尔矿区"
                            
                            // 检查父路径是否有对应的列
                            const parentColumnId = generateFolderColumnId(parentPath);
                            if (window.dynamicColumns && 
                                JSON.stringify(window.dynamicColumns).includes(parentColumnId)) {
                                // 父路径列存在，直接放入
                                if (dynamicData[parentColumnId]) {
                                    dynamicData[parentColumnId] += ', ' + leafName;
                                } else {
                                    dynamicData[parentColumnId] = leafName;
                                }
                            } else {
                                // 父路径列不存在，放入祖父路径的"其他"列
                                const otherColumnId = generateFolderColumnId(grandParentPath) + "_other";
                                if (dynamicData[otherColumnId]) {
                                    dynamicData[otherColumnId] += ', ' + leafName;
                                } else {
                                    dynamicData[otherColumnId] = leafName;
                                }
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
                ...groupingData,   // 合并分组数据
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
    
    // 将文件夹名称转换为ID
    const folderIds = folderNames.map(name => {
        // 先直接查找精确匹配
        let folderId = window.folderIdMap[name];
        
        // 如果找不到，尝试模糊匹配
        if (!folderId) {
            const matchedName = Object.keys(window.folderIdMap).find(key => 
                key.includes(name) || name.includes(key)
            );
            if (matchedName) {
                folderId = window.folderIdMap[matchedName];
            }
        }
        
        return folderId;
    }).filter(id => id); // 过滤掉未找到的ID
    
    return folderIds;
}

// 将文件夹树结构转换为思维导图数据结构
function convertFolderTreeToMindMapData(folderTree) {
    console.log('[DATA] 开始转换文件夹树结构为思维导图数据，输入:', folderTree);
    
    // 验证输入数据
    if (!folderTree || !Array.isArray(folderTree)) {
        console.warn('[DATA] 无效的folderTree输入，使用默认值');
        folderTree = [];
    }
    
    console.log('[DATA] folderTree长度:', folderTree.length);
    if (folderTree.length > 0) {
        console.log('[DATA] folderTree[0]:', folderTree[0]);
        if (folderTree[0].children) {
            console.log('[DATA] folderTree[0].children长度:', folderTree[0].children.length);
            console.log('[DATA] folderTree[0].children:', folderTree[0].children);
        }
    }
    
    // 构建节点对象
    function buildNodeObj(node) {
        // 验证节点数据
        if (!node || !node.name) {
            console.warn('[DATA] 无效的节点数据，跳过:', node);
            return null;
        }
        
        const nodeObj = {
            topic: node.name,
            id: node.id || generateUniqueId(),
            expanded: true
        };
        
        console.log('[DATA] 构建节点对象:', nodeObj, '原始节点:', node);
        
        // 处理子节点
        if (node.children && Array.isArray(node.children) && node.children.length > 0) {
            const validChildren = node.children
                .map(buildNodeObj)
                .filter(child => child !== null);
            
            console.log('[DATA] 节点的子节点:', node.name, validChildren);
            
            if (validChildren.length > 0) {
                nodeObj.children = validChildren;
            }
        }
        
        return nodeObj;
    }
    
    // 生成唯一ID的辅助函数
    function generateUniqueId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 如果folderTree不为空，使用第一个文件夹作为根节点
    if (folderTree.length > 0 && folderTree[0].name) {
        const rootFolder = folderTree[0];
        const rootNode = {
            topic: rootFolder.name,
            id: rootFolder.id || 'root',
            expanded: true,
            children: []
        };
        
        console.log('[DATA] 创建根节点:', rootNode, '原始根文件夹:', rootFolder);
        
        // 添加子节点（如果有）
        if (rootFolder.children && rootFolder.children.length > 0) {
            const validNodes = rootFolder.children
                .map(buildNodeObj)
                .filter(node => node !== null);
            
            console.log('[DATA] 根节点的子节点:', validNodes);
            
            if (validNodes.length > 0) {
                rootNode.children = validNodes;
            }
        }
        
        console.log('[DATA] 成功转换文件夹树结构，输出:', rootNode);
        // 直接返回节点数据对象
        return rootNode;
    } else {
        // 如果没有文件夹数据，返回null，让调用者处理默认情况
        console.log('[DATA] 文件夹树为空，返回null');
        return null;
    }
}

// 文件夹筛选功能
function filterFoldersForMindMap(folderTree) {
    // 获取用户定义的筛选条件
    let excludedFolders = [];
    const savedFilter = localStorage.getItem('mindmapFolderFilter');
    if (savedFilter) {
        excludedFolders = savedFilter.split(',').map(name => name.trim().toLowerCase());
    } else {
        // 默认需要排除的文件夹名称列表
        excludedFolders = ['_预览', '_备份', 'temp', 'temporary', 'cache'];
    }
    
    function filterNode(node) {
        // 如果节点名称在排除列表中，则过滤掉
        if (excludedFolders.includes(node.name.toLowerCase())) {
            return null;
        }
        
        // 递归处理子节点
        if (node.children) {
            node.children = node.children
                .map(filterNode)
                .filter(child => child !== null);
        }
        
        return node;
    }
    
    return folderTree
        .map(filterNode)
        .filter(node => node !== null);
}
