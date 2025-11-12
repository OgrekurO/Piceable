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
            
            if (nameChanged || tagsChanged || annotationChanged || foldersChanged) {
                console.log(`[SYNC] 检测到修改 - ID: ${rowData.id}, Name: ${nameChanged}, Tags: ${tagsChanged}, Annotation: ${annotationChanged}, Folders: ${foldersChanged}`);
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
                
                // 处理文件夹更新
                const originalFolders = getFolderNames(originalItem.folders || []);
                if (rowData.folders !== originalFolders) {
                    console.log(`[SYNC] 更新项目文件夹: ${originalFolders} -> ${rowData.folders}`);
                    
                    // 将用户输入的文件夹字符串转换为文件夹ID数组
                    const folderNames = rowData.folders ? rowData.folders.split(',').map(folder => folder.trim()).filter(name => name.length > 0) : [];
                    const folderIds = [];
                    
                    for (const folderName of folderNames) {
                        // 直接在当前的文件夹ID映射中查找
                        let folderId = window.folderIdMap[folderName];
                        
                        // 如果找不到文件夹ID，尝试创建新文件夹
                        if (!folderId) {
                            console.log(`[SYNC] 未找到: 未找到文件夹 "${folderName}" 的ID，尝试创建新文件夹`);
                            
                            try {
                                // 解析文件夹路径，检查是否是子文件夹
                                const pathParts = folderName.split('/');
                                
                                if (pathParts.length === 1) {
                                    // 检查是否已经创建过同名根文件夹
                                    if (!window.createdFolders) window.createdFolders = new Map();
                                    
                                    if (!window.createdFolders.has(folderName)) {
                                        console.log(`[SYNC] 创建根文件夹: ${folderName}`);
                                        const newFolder = await eagle.folder.create({
                                            name: folderName
                                        });
                                        folderId = newFolder.id;
                                        console.log(`[SYNC] 成功创建根文件夹，ID: ${folderId}`);
                                        
                                        // 更新文件夹映射
                                        window.folderMap[folderId] = folderName;
                                        window.folderIdMap[folderName] = folderId;
                                        
                                        // 记录已创建的文件夹
                                        window.createdFolders.set(folderName, folderId);
                                    } else {
                                        folderId = window.createdFolders.get(folderName);
                                        console.log(`[SYNC] 根文件夹 "${folderName}" 已创建过，ID: ${folderId}`);
                                    }
                                } else {
                                    // 处理子文件夹
                                    const parentPath = pathParts.slice(0, -1).join('/');
                                    const folderNameOnly = pathParts[pathParts.length - 1];
                                    
                                    const parentId = window.folderIdMap[parentPath];
                                    if (parentId) {
                                        // 检查是否已经创建过同名子文件夹
                                        if (!window.createdFolders) window.createdFolders = new Map();
                                        const fullPath = `${parentPath}/${folderNameOnly}`;
                                        
                                        if (!window.createdFolders.has(fullPath)) {
                                            console.log(`[SYNC] 创建子文件夹: ${folderNameOnly} 在父文件夹: ${parentPath}`);
                                            const newFolder = await eagle.folder.createSubfolder(parentId, {
                                                name: folderNameOnly
                                            });
                                            folderId = newFolder.id;
                                            console.log(`[SYNC] 成功创建子文件夹，ID: ${folderId}`);
                                            
                                            // 更新文件夹映射
                                            window.folderMap[folderId] = fullPath;
                                            window.folderIdMap[fullPath] = folderId;
                                            
                                            // 记录已创建的文件夹
                                            window.createdFolders.set(fullPath, folderId);
                                        } else {
                                            folderId = window.createdFolders.get(fullPath);
                                            console.log(`[SYNC] 子文件夹 "${fullPath}" 已创建过，ID: ${folderId}`);
                                        }
                                    } else {
                                        console.log(`[SYNC] 警告: 父文件夹 "${parentPath}" 不存在，无法创建子文件夹 "${folderName}"`);
                                    }
                                }
                            } catch (error) {
                                console.error(`[SYNC] 创建文件夹 "${folderName}" 失败:`, error);
                            }
                        }
                        
                        // 只有当folderId有效时才添加到数组中
                        if (folderId) {
                            folderIds.push(folderId);
                        }
                    }
                    
                    // 更新项目文件夹（支持多个文件夹）
                    originalItem.folders = folderIds;
                    needSave = true;
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
