// 同步数据到Eagle
async function syncDataToEagle() {
    console.log('[SYNC] 开始执行syncDataToEagle函数');
    if (!window.table) {
        console.log('[SYNC] 错误: 表格未初始化');
        showStatus('表格未初始化', 'error');
        return;
    }
    
    try {
        showStatus('正在同步数据到Eagle...', 'info');
        
        // 在同步开始前，先刷新文件夹映射表
        try {
            console.log('[SYNC] 刷新文件夹映射表');
            const libraryInfo = await eagle.library.info();
            const {map, idMap} = buildFolderMap(libraryInfo.folders || []);
            window.folderMap = map;
            window.folderIdMap = idMap;
            console.log('[SYNC] 文件夹映射表刷新完成，映射表大小:', Object.keys(window.folderMap).length);
        } catch (error) {
            console.error('[SYNC] 刷新文件夹映射表失败:', error);
        }
        
        // 获取当前表格数据
        const currentData = window.table.getData();
        console.log('[SYNC] 当前表格数据总数:', currentData.length);
        
        let modifiedCount = 0;
        let successCount = 0;
        let failCount = 0;
        
        // 遍历数据检测修改项
        for (const rowData of currentData) {
            const originalItem = window.originalItems[rowData.id];
            if (!originalItem) continue;
            
            // 检查是否有修改
            const nameChanged = rowData.name !== originalItem.name;
            const tagsChanged = rowData.tags !== (originalItem.tags || []).join(', ');
            const annotationChanged = rowData.annotation !== (originalItem.annotation || '');
            const foldersChanged = rowData.folders !== getFolderNames(originalItem.folders || []);
            
            // 检查动态列是否修改
            let dynamicColumnsChanged = false;
            if (window.dynamicColumns && Array.isArray(window.dynamicColumns)) {
                for (const column of window.dynamicColumns) {
                    const columnName = column.field;
                    if (rowData.hasOwnProperty(columnName) && 
                        originalItem.metaData && 
                        originalItem.metaData[columnName] !== rowData[columnName]) {
                        dynamicColumnsChanged = true;
                        break;
                    }
                }
            }
            
            if (nameChanged || tagsChanged || annotationChanged || foldersChanged || dynamicColumnsChanged) {
                console.log(`[SYNC] 检测到修改 - ID: ${rowData.id}, Name: ${nameChanged}, Tags: ${tagsChanged}, Annotation: ${annotationChanged}, Folders: ${foldersChanged}, DynamicColumns: ${dynamicColumnsChanged}`);
                modifiedCount++;
            }
        }
        
        console.log(`[SYNC] 检测到修改的项目数量: ${modifiedCount}`);
        showStatus(`正在同步 ${modifiedCount} 个项目的更改...`, 'info');
        
        if (modifiedCount === 0) {
            console.log('[SYNC] 没有需要同步的更改');
            showStatus('没有需要同步的更改', 'info');
            return;
        }
        
        // 处理每个修改的项目
        for (const rowData of currentData) {
            const originalItem = window.originalItems[rowData.id];
            if (!originalItem) continue;
            
            try {
                console.log(`[SYNC] 开始处理项目: ${rowData.id}`);
                
                let needSave = false;
                
                if (rowData.name !== originalItem.name) {
                    console.log(`[SYNC] 更新项目名称: ${originalItem.name} -> ${rowData.name}`);
                    originalItem.name = rowData.name;
                    needSave = true;
                }
                
                // 处理标签更新
                const originalTags = originalItem.tags ? originalItem.tags.join(', ') : '';
                if (rowData.tags !== originalTags) {
                    console.log(`[SYNC] 更新项目标签: ${originalTags} -> ${rowData.tags}`);
                    // 将逗号分隔的标签转换为数组
                    originalItem.tags = rowData.tags ? rowData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                    needSave = true;
                }
                
                if (rowData.annotation !== (originalItem.annotation || '')) {
                    console.log(`[SYNC] 更新项目注释: ${originalItem.annotation} -> ${rowData.annotation}`);
                    originalItem.annotation = rowData.annotation;
                    needSave = true;
                }
                
                // 处理文件夹更新（基于传统字段和动态列）
                const originalFolders = getFolderNames(originalItem.folders || []);
                if (rowData.folders !== originalFolders) {
                    console.log(`[SYNC] 更新项目文件夹: ${originalFolders} -> ${rowData.folders}`);
                    
                    // 将用户输入的文件夹字符串转换为文件夹ID数组
                    const folderNames = rowData.folders ? rowData.folders.split(',').map(folder => folder.trim()).filter(name => name.length > 0) : [];
                    const folderIds = [];
                    
                    for (const folderName of folderNames) {
                        try {
                            // 直接在当前的文件夹ID映射中查找
                            let folderId = window.folderIdMap[folderName];
                            
                            // 如果找不到文件夹ID，尝试创建新文件夹
                            if (!folderId) {
                                console.log(`[SYNC] 未找到文件夹 "${folderName}" 的ID，尝试创建新文件夹`);
                                folderId = await createFolderPath(folderName);
                            }
                            
                            if (folderId) {
                                folderIds.push(folderId);
                            }
                        } catch (createError) {
                            console.error(`[SYNC] 处理文件夹 "${folderName}" 失败:`, createError);
                            showStatus(`处理文件夹 "${folderName}" 失败: ${createError.message}`, 'error');
                            continue;
                        }
                    }
                    
                    // 更新原始项目的文件夹
                    originalItem.folders = folderIds;
                    needSave = true;
                }
                
                // 处理动态列数据（自定义元数据和文件夹操作）
                if (window.dynamicColumns && Array.isArray(window.dynamicColumns)) {
                    if (!originalItem.metaData) {
                        originalItem.metaData = {};
                    }
                    
                    let metaChanged = false;
                    let folderOperationNeeded = false;
                    const newFolderPaths = []; // 存储需要添加到的新文件夹路径
                    
                    // 处理每个动态列
                    for (const column of window.dynamicColumns) {
                        const columnName = column.field;
                        if (rowData.hasOwnProperty(columnName) && originalItem.metaData[columnName] !== rowData[columnName]) {
                            console.log(`[SYNC] 更新动态列数据: ${columnName} -> ${rowData[columnName]}`);
                            originalItem.metaData[columnName] = rowData[columnName];
                            metaChanged = true;
                            needSave = true;
                            
                            // 检查是否需要执行文件夹操作
                            // 如果该列有对应的文件夹路径映射，且值不为空，则需要执行文件夹操作
                            if (window.columnPathMap && window.columnPathMap[columnName]) {
                                const columnPath = window.columnPathMap[columnName];
                                const cellValue = rowData[columnName];
                                
                                if (cellValue && cellValue.trim() !== '') {
                                    // 解析单元格中的文件夹名称（可能包含多个，用逗号分隔）
                                    const folderNames = cellValue.split(',').map(name => name.trim()).filter(name => name);
                                    folderNames.forEach(folderName => {
                                        // 构造完整文件夹路径
                                        const fullPath = columnPath ? `${columnPath}/${folderName}` : folderName;
                                        newFolderPaths.push(fullPath);
                                        folderOperationNeeded = true;
                                    });
                                }
                            }
                        }
                    }
                    
                    // 如果需要执行文件夹操作
                    if (folderOperationNeeded) {
                        console.log(`[SYNC] 需要执行文件夹操作，新文件夹路径:`, newFolderPaths);
                        
                        // 获取当前项目所在的文件夹ID列表
                        let currentFolderIds = [...(originalItem.folders || [])];
                        
                        // 为每个新文件夹路径查找或创建文件夹
                        for (const folderPath of newFolderPaths) {
                            let folderId = window.folderIdMap[folderPath];
                            
                            // 如果找不到文件夹ID，尝试创建新文件夹
                            if (!folderId) {
                                console.log(`[SYNC] 未找到文件夹 "${folderPath}" 的ID，尝试创建新文件夹`);
                                folderId = await createFolderPath(folderPath);
                            }
                            
                            // 将文件夹ID添加到项目中（避免重复添加）
                            if (folderId && !currentFolderIds.includes(folderId)) {
                                currentFolderIds.push(folderId);
                            }
                        }
                        
                        // 更新项目的文件夹列表
                        originalItem.folders = currentFolderIds;
                        needSave = true;
                        console.log(`[SYNC] 项目文件夹列表已更新:`, currentFolderIds);
                    }
                    
                    if (metaChanged) {
                        console.log(`[SYNC] 项目 ${rowData.id} 的动态列数据已更新`);
                    }
                }
                
                // 保存修改
                if (needSave) {
                    console.log(`[SYNC] 保存项目: ${rowData.id}`);
                    await originalItem.save();
                    console.log(`[SYNC] 成功同步项目 ${rowData.id}`);
                    successCount++;
                }
            } catch (error) {
                console.error(`[SYNC] 同步项目 ${rowData.id} 失败:`, error);
                failCount++;
            }
        }
        
        console.log(`[SYNC] 同步完成: ${successCount} 个成功, ${failCount} 个失败`);
        
        // 刷新数据
        console.log('[SYNC] 开始刷新数据');
        await loadEagleItems();
        if (window.table) {
            window.table.setData(window.tableData);
        }
        console.log('[SYNC] 数据刷新完成');
        
        if (failCount === 0) {
            showStatus(`成功同步 ${successCount} 个项目的更改`, 'success');
        } else {
            showStatus(`同步完成: ${successCount} 个成功, ${failCount} 个失败`, 'warning');
        }
        
        // 重置更改状态
        window.hasUnsavedChanges = false;
        
        // 清除本次同步中创建的文件夹记录，以便下次同步时重新检查
        if (window.createdFolders) {
            window.createdFolders.clear();
        }

    } catch (error) {
        console.error('[SYNC] 同步数据到Eagle时发生错误:', error);
        showStatus('同步数据失败: ' + error.message, 'error');
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

// 递归创建文件夹路径的辅助函数
async function createFolderPath(folderPath) {
    console.log(`[SYNC] 创建文件夹路径: ${folderPath}`);
    
    // 检查文件夹是否已存在
    if (window.folderIdMap[folderPath]) {
        console.log(`[SYNC] 文件夹路径 "${folderPath}" 已存在，ID: ${window.folderIdMap[folderPath]}`);
        return window.folderIdMap[folderPath];
    }
    
    // 检查是否已经创建过但尚未刷新映射表
    if (window.createdFolders && window.createdFolders.has(folderPath)) {
        console.log(`[SYNC] 文件夹路径 "${folderPath}" 已创建过，ID: ${window.createdFolders.get(folderPath)}`);
        return window.createdFolders.get(folderPath);
    }
    
    const pathParts = folderPath.split('/');
    
    if (pathParts.length === 1) {
        // 根文件夹
        try {
            console.log(`[SYNC] 创建根文件夹: ${folderPath}`);
            const newFolder = await eagle.folder.create({
                name: folderPath
            });
            
            // 更新文件夹映射
            window.folderMap[newFolder.id] = folderPath;
            window.folderIdMap[folderPath] = newFolder.id;
            
            // 记录已创建的文件夹
            if (!window.createdFolders) window.createdFolders = new Map();
            window.createdFolders.set(folderPath, newFolder.id);
            
            console.log(`[SYNC] 成功创建根文件夹 "${folderPath}"，ID: ${newFolder.id}`);
            return newFolder.id;
        } catch (error) {
            console.error(`[SYNC] 创建根文件夹 "${folderPath}" 失败:`, error);
            throw error;
        }
    } else {
        // 子文件夹
        const parentPath = pathParts.slice(0, -1).join('/');
        const folderName = pathParts[pathParts.length - 1];
        
        // 递归创建父文件夹
        const parentId = await createFolderPath(parentPath);
        
        try {
            console.log(`[SYNC] 创建子文件夹: ${folderName} 在父文件夹: ${parentPath} (ID: ${parentId})`);
            const newFolder = await eagle.folder.createSubfolder(parentId, {
                name: folderName
            });
            
            const fullPath = `${parentPath}/${folderName}`;
            
            // 更新文件夹映射
            window.folderMap[newFolder.id] = fullPath;
            window.folderIdMap[fullPath] = newFolder.id;
            
            // 记录已创建的文件夹
            if (!window.createdFolders) window.createdFolders = new Map();
            window.createdFolders.set(fullPath, newFolder.id);
            
            console.log(`[SYNC] 成功创建子文件夹 "${fullPath}"，ID: ${newFolder.id}`);
            return newFolder.id;
        } catch (error) {
            console.error(`[SYNC] 创建子文件夹 "${folderName}" 失败:`, error);
            throw error;
        }
    }
}
