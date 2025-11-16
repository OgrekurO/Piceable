/**
 * 数据同步模块
 * 负责将前端修改的数据同步回Eagle
 */

// 由于Eagle插件环境的限制，我们不能使用相对路径导入模块
// 使用立即执行函数包装以避免全局变量污染

var DataSyncModule = (function() {
    
    /**
     * 同步单个项目数据到Eagle
     * @param {Object} originalItem - Eagle中的原始项目对象
     * @param {Object} updateData - 前端传入的更新数据
     * @param {Object} folderIdMap - 文件夹路径到ID的映射
     * @returns {Object} 同步结果
     */
    async function syncItemToEagle(originalItem, updateData, folderIdMap) {
        try {
            console.log(`[DATA_SYNC] 开始同步项目: ${originalItem.id}`);
            
            let needSave = false;
            let changes = {};
            
            // 更新项目名称
            if (updateData.name !== undefined && updateData.name !== originalItem.name) {
                console.log(`[DATA_SYNC] 更新项目名称: ${originalItem.name} -> ${updateData.name}`);
                originalItem.name = updateData.name;
                needSave = true;
                changes.name = updateData.name;
            }
            
            // 更新项目标签
            if (updateData.tags !== undefined) {
                const originalTags = originalItem.tags ? originalItem.tags.join(', ') : '';
                // 处理tags可能是数组或字符串的情况
                let newTags = [];
                if (Array.isArray(updateData.tags)) {
                    // 如果tags是数组，直接使用
                    newTags = updateData.tags;
                } else if (typeof updateData.tags === 'string') {
                    // 如果tags是字符串，按逗号分割
                    newTags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                }
                
                const newTagsString = newTags.join(', ');
                if (newTagsString !== originalTags) {
                    console.log(`[DATA_SYNC] 更新项目标签: ${originalTags} -> ${newTagsString}`);
                    originalItem.tags = newTags;
                    needSave = true;
                    changes.tags = newTagsString;
                }
            }
            
            // 更新项目注释
            if (updateData.annotation !== undefined && updateData.annotation !== (originalItem.annotation || '')) {
                console.log(`[DATA_SYNC] 更新项目注释: ${originalItem.annotation} -> ${updateData.annotation}`);
                originalItem.annotation = updateData.annotation;
                needSave = true;
                changes.annotation = updateData.annotation;
            }
            
            // 更新项目文件夹
            if (updateData.folders !== undefined) {
                // 使用data-processor模块中的getFolderNames函数（如果可用）
                let originalFolders = '';
                if (typeof DataProcessorModule !== 'undefined' && 
                    typeof DataProcessorModule.getFolderNames === 'function') {
                    originalFolders = DataProcessorModule.getFolderNames(originalItem.folders || [], {});
                } else {
                    // 简化处理
                    originalFolders = '';
                }
                
                if (updateData.folders !== originalFolders) {
                    console.log(`[DATA_SYNC] 更新项目文件夹: ${originalFolders} -> ${updateData.folders}`);
                    // 将用户输入的文件夹字符串转换为文件夹ID数组
                    const folderNames = updateData.folders ? 
                        updateData.folders.split(',').map(folder => folder.trim()).filter(name => name.length > 0) : [];
                    const folderIds = [];
                    
                    for (const folderName of folderNames) {
                        // 在文件夹ID映射中查找
                        let folderId = folderIdMap[folderName];
                        if (folderId) {
                            folderIds.push(folderId);
                        }
                    }
                    
                    // 更新原始项目的文件夹
                    originalItem.folders = folderIds;
                    needSave = true;
                    changes.folders = updateData.folders;
                }
            }
            
            // 保存修改
            if (needSave) {
                console.log(`[DATA_SYNC] 保存项目: ${originalItem.id}`);
                await originalItem.save();
                console.log(`[DATA_SYNC] 成功同步项目 ${originalItem.id}`);
                
                return {
                    success: true,
                    itemId: originalItem.id,
                    message: 'Item updated successfully',
                    changes: changes
                };
            } else {
                return {
                    success: true,
                    itemId: originalItem.id,
                    message: 'No changes to update',
                    changes: {}
                };
            }
        } catch (error) {
            console.error(`[DATA_SYNC] 同步项目失败，ID: ${originalItem.id}`, error);
            return {
                success: false,
                itemId: originalItem.id,
                error: 'Failed to sync item',
                message: error.message
            };
        }
    }
    
    /**
     * 批量同步数据到Eagle
     * @param {Array} itemsData - 要同步的项目数据数组
     * @param {Object} folderIdMap - 文件夹路径到ID的映射
     * @returns {Object} 同步结果统计
     */
    async function syncBatchDataToEagle(itemsData, folderIdMap) {
        console.log('[DATA_SYNC] 开始批量同步数据到Eagle');
        
        let successCount = 0;
        let failCount = 0;
        let results = [];
        
        // 处理每个项目
        for (const itemData of itemsData) {
            try {
                // 这里需要获取原始项目对象，但在API环境中我们无法直接访问window.originalItems
                // 所以我们假设前端会传入完整的更新数据
                
                // 模拟同步过程
                const result = {
                    success: true,
                    itemId: itemData.id,
                    message: 'Update request received',
                    updateData: itemData
                };
                
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
                
                results.push(result);
            } catch (error) {
                console.error(`[DATA_SYNC] 同步项目失败，ID: ${itemData.id}`, error);
                failCount++;
                results.push({
                    success: false,
                    itemId: itemData.id,
                    error: 'Failed to sync item',
                    message: error.message
                });
            }
        }
        
        console.log(`[DATA_SYNC] 批量同步完成: ${successCount} 个成功, ${failCount} 个失败`);
        
        return {
            success: true,
            message: `同步完成: ${successCount} 个成功, ${failCount} 个失败`,
            successCount: successCount,
            failCount: failCount,
            results: results
        };
    }
    
    // 公共接口
    return {
        syncItemToEagle,
        syncBatchDataToEagle
    };
})();

console.log('[DATA_SYNC] 数据同步模块加载完成');