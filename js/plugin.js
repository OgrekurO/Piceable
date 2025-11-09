// 引入Tabulator
document.write('<script src="https://unpkg.com/tabulator-tables@5.4.4/dist/js/tabulator.min.js"><\/script>');

let tableData = [];
let table = null;
let hasUnsavedChanges = false;
let folderMap = {}; // 用于存储文件夹ID到名称的映射
let originalItems = {}; // 用于存储原始项目数据，便于更新时查找

// 插件创建时的回调
eagle.onPluginCreate(async (plugin) => {
    console.log('Eagle Ontology Manager plugin created');
    console.log(plugin);
    showStatus('插件已创建', 'info');
});

// 插件运行时的回调
eagle.onPluginRun(async () => {
    console.log('Eagle Ontology Manager plugin running');
    showStatus('插件正在运行', 'info');
    initializeApp();
});

// 插件显示时的回调
eagle.onPluginShow(async () => {
    console.log('Eagle Ontology Manager plugin shown');
    showStatus('插件界面已显示', 'info');
});

// 插件隐藏时的回调
eagle.onPluginHide(() => {
    console.log('Eagle Ontology Manager plugin hidden');
});

// 初始化应用
async function initializeApp() {
    // 检查是否在Eagle环境中
    if (typeof eagle === 'undefined') {
        showStatus('警告：未检测到Eagle环境，部分功能可能无法使用', 'error');
        // 在非Eagle环境中使用示例数据进行演示
        loadDemoData();
        initializeTable();
        return;
    }
    
    // 等待Tabulator加载完成
    if (typeof Tabulator === 'undefined') {
        await new Promise(resolve => {
            const checkTabulator = setInterval(() => {
                if (typeof Tabulator !== 'undefined') {
                    clearInterval(checkTabulator);
                    resolve();
                }
            }, 100);
        });
    }
    
    // 初始化UI事件
    initializeUIEvents();
    
    // 加载数据
    await loadEagleItems();
    
    // 初始化表格
    initializeTable();
}

// 初始化UI事件
function initializeUIEvents() {
    // 刷新按钮
    document.getElementById('refresh-btn').addEventListener('click', async () => {
        showStatus('正在刷新数据...', 'info');
        await loadEagleItems();
        table.setData(tableData);
        showStatus(`数据刷新完成，共加载 ${tableData.length} 个项目`, 'success');
    });
    
    // 导出CSV按钮
    document.getElementById('export-csv-btn').addEventListener('click', () => {
        if (table) {
            table.download("csv", "eagle-ontology-data.csv");
            showStatus('数据已导出为CSV文件', 'success');
        }
    });
    
    // 同步按钮
    document.getElementById('sync-btn').addEventListener('click', async () => {
        showStatus('正在同步数据到Eagle...', 'info');
        await syncDataToEagle();
    });
    
    // 模板按钮
    document.getElementById('template-btn').addEventListener('click', () => {
        showStatus('属性模板功能将在后续版本中实现', 'info');
    });
    
    // 可视化按钮
    document.getElementById('visualization-btn').addEventListener('click', () => {
        showStatus('数据可视化功能将在后续版本中实现', 'info');
    });
    
    // 搜索框
    document.getElementById('search-box').addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        if (table) {
            table.setFilter((data) => {
                return data.name.toLowerCase().includes(searchText) || 
                       (data.tags && data.tags.toLowerCase().includes(searchText)) || 
                       (data.annotation && data.annotation.toLowerCase().includes(searchText));
            });
        }
    });
}

// 显示状态消息
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';
    }
    
    // 更新状态栏
    const statusBarEl = document.getElementById('status-bar');
    if (statusBarEl) {
        statusBarEl.textContent = message;
    }
    
    // 3秒后自动隐藏消息（但保持状态栏更新）
    if (type !== 'error' && statusEl) {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
    
    console.log(`[Eagle Ontology Manager] ${type.toUpperCase()}: ${message}`);
}

// 构建文件夹映射表
function buildFolderMap(folders, prefix = '') {
    const map = {};
    
    folders.forEach(folder => {
        const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
        map[folder.id] = folderPath;
        
        // 递归处理子文件夹
        if (folder.children && folder.children.length > 0) {
            const childMap = buildFolderMap(folder.children, folderPath);
            Object.assign(map, childMap);
        }
    });
    
    return map;
}

// 加载Eagle项目数据
async function loadEagleItems() {
    try {
        showStatus('正在读取Eagle素材库数据...', 'info');
        console.log('[DEBUG] 开始加载Eagle项目数据');
        
        // 获取库信息以构建文件夹映射
        const libraryInfo = await eagle.library.info();
        console.log('[DEBUG] 库信息获取完成:', libraryInfo);
        folderMap = buildFolderMap(libraryInfo.folders || []);
        console.log('[DEBUG] 文件夹映射构建完成，映射表大小:', Object.keys(folderMap).length);
        
        // 获取所有项目 - 使用正确的API方法和参数，并指定需要的字段
        // 添加thumbnailURL和thumbnailPath字段以获取缩略图信息
        const items = await eagle.item.get({
            fields: ["id", "name", "url", "folders", "tags", "annotation", "lastModified", "thumbnailURL", "thumbnailPath"]
        });
        
        console.log('[DEBUG] 获取到的项目数量:', items.length);
        console.log('[DEBUG] 前几个项目的示例:', items.slice(0, 3));
        
        // 存储原始项目数据，用于后续更新
        originalItems = {};
        items.forEach(item => {
            originalItems[item.id] = item;
        });
        
        // 转换数据格式以适应表格
        tableData = items.map((item, index) => {
            // 为前几个项目添加详细日志
            if (index < 3) {
                console.log(`[DEBUG] 处理项目 ${index}:`, item);
            }
            
            // 处理文件夹信息
            let folders = '';
            if (item.folders && Array.isArray(item.folders)) {
                folders = item.folders.map(folderId => {
                    // 使用文件夹ID查找实际的文件夹路径
                    const folderName = folderMap[folderId] || folderId;
                    if (index < 3) {
                        console.log(`[DEBUG] 文件夹ID ${folderId} 映射为:`, folderName);
                    }
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
            
            if (index < 3) {
                console.log(`[DEBUG] 项目 ${index} 的缩略图URL:`, thumbnailUrl);
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
            
            if (index < 3) {
                console.log(`[DEBUG] 项目 ${index} 处理后结果:`, result);
            }
            
            return result;
        });
        
        console.log('[DEBUG] 数据转换完成，最终数据数量:', tableData.length);
        showStatus(`成功加载 ${tableData.length} 个项目`, 'success');
        const statusBarEl = document.getElementById('status-bar');
        if (statusBarEl) {
            statusBarEl.textContent = `就绪 - 已加载 ${tableData.length} 个项目`;
        }
        return tableData;
    } catch (error) {
        console.error('[ERROR] 加载项目失败:', error);
        console.error('[ERROR] 错误堆栈:', error.stack);
        showStatus('加载项目失败: ' + error.message, 'error');
        return [];
    }
}

// 同步数据到Eagle
async function syncDataToEagle() {
    if (!table) {
        showStatus('表格未初始化', 'error');
        return;
    }
    
    try {
        showStatus('正在同步数据到Eagle...', 'info');
        
        // 获取表格中被修改的数据
        const modifiedData = table.getData().filter(row => {
            const original = originalItems[row.id];
            if (!original) return false;
            
            // 检查是否有字段被修改
            return row.name !== original.name || 
                   row.tags !== (original.tags ? original.tags.join(', ') : '') ||
                   row.annotation !== (original.annotation || '');
        });
        
        if (modifiedData.length === 0) {
            showStatus('没有需要同步的更改', 'info');
            return;
        }
        
        showStatus(`正在同步 ${modifiedData.length} 个项目的更改...`, 'info');
        
        // 逐个同步修改的数据
        let successCount = 0;
        let failCount = 0;
        
        for (const rowData of modifiedData) {
            try {
                const originalItem = originalItems[rowData.id];
                if (!originalItem) continue;
                
                // 更新项目属性
                let needSave = false;
                
                if (rowData.name !== originalItem.name) {
                    originalItem.name = rowData.name;
                    needSave = true;
                }
                
                // 处理标签更新
                const originalTags = originalItem.tags ? originalItem.tags.join(', ') : '';
                if (rowData.tags !== originalTags) {
                    // 将逗号分隔的标签转换为数组
                    originalItem.tags = rowData.tags ? rowData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                    needSave = true;
                }
                
                if (rowData.annotation !== (originalItem.annotation || '')) {
                    originalItem.annotation = rowData.annotation;
                    needSave = true;
                }
                
                // 只有在确实有更改时才保存
                if (needSave) {
                    // 保存更改
                    await originalItem.save();
                    successCount++;
                    console.log(`[DEBUG] 成功同步项目 ${rowData.id}`);
                } else {
                    // 即使没有更改也计为成功（因为数据在modifiedData中）
                    successCount++;
                }
            } catch (error) {
                console.error(`[ERROR] 同步项目 ${rowData.id} 失败:`, error);
                failCount++;
            }
        }
        
        // 刷新数据
        await loadEagleItems();
        table.setData(tableData);
        
        if (failCount === 0) {
            showStatus(`成功同步 ${successCount} 个项目的更改`, 'success');
        } else {
            showStatus(`同步完成: ${successCount} 个成功, ${failCount} 个失败`, failCount === 0 ? 'success' : 'error');
        }
        
        // 重置更改状态
        hasUnsavedChanges = false;
        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.disabled = true;
        }
    } catch (error) {
        console.error('[ERROR] 同步数据失败:', error);
        showStatus('同步数据失败: ' + error.message, 'error');
    }
}

// 加载演示数据（用于非Eagle环境下的演示）
function loadDemoData() {
    showStatus('加载演示数据...', 'info');
    
    tableData = [
        {
            id: "demo1",
            name: "示例图片1.jpg",
            url: "",
            thumbnail: "", 
            folders: "示例文件夹1",
            tags: "示例,标签1,标签2",
            annotation: "这是一条示例注释",
            lastModified: new Date().toLocaleString()
        },
        {
            id: "demo2",
            name: "示例图片2.png",
            url: "",
            thumbnail: "",
            folders: "示例文件夹2/子文件夹",
            tags: "示例,标签3",
            annotation: "这是另一条示例注释",
            lastModified: new Date().toLocaleString()
        }
    ];
    
    showStatus(`已加载 ${tableData.length} 条演示数据`, 'success');
    const statusBarEl = document.getElementById('status-bar');
    if (statusBarEl) {
        statusBarEl.textContent = `演示模式 - 已加载 ${tableData.length} 条演示数据`;
    }
}

// 初始化表格
function initializeTable() {
    console.log('[DEBUG] 开始初始化表格，数据量:', tableData.length);
    console.log('[DEBUG] 前几条数据示例:', tableData.slice(0, 3));
    
    table = new Tabulator("#item-table", {
        data: tableData,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 20,
        paginationSizeSelector: [10, 20, 50, 100],
        movableColumns: true,
        resizableRows: true,
        columns: [
            {
                title: "预览",
                field: "thumbnail",
                formatter: function(cell) {
                    const imageData = cell.getValue();
                    console.log('[DEBUG] 表格中图片数据:', imageData);
                    
                    if (imageData) {
                        // 使用img标签并添加错误处理
                        return `<img src="${imageData}" class="thumbnail" onerror="console.log('[DEBUG] 图片加载失败:', '${imageData}'); this.parentElement.innerHTML='<div style=\'width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;\'>无预览</div>'" onload="console.log('[DEBUG] 图片加载成功:', '${imageData}'); this.style.display='block'"/>`;
                    } else {
                        return '<div style="width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;">无预览</div>';
                    }
                },
                hozAlign: "center",
                width: 80,
                headerSort: false
            },
            {
                title: "名称",
                field: "name",
                editor: "input",
                width: 200,
                sorter: "string",
                validator: ["required"]
            },
            {
                title: "文件夹",
                field: "folders",
                width: 200
            },
            {
                title: "标签",
                field: "tags",
                editor: "input",
                width: 200
            },
            {
                title: "注释",
                field: "annotation",
                editor: "textarea",
                formatter: "textarea",
                width: 300
            },
            {
                title: "最后修改",
                field: "lastModified",
                width: 180,
                sorter: "date"
            }
        ],
        rowClick: function(e, row) {
            // 行点击事件
            console.log('[DEBUG] 行被点击:', row.getData());
        },
        cellEdited: function(cell) {
            // 单元格编辑完成事件
            hasUnsavedChanges = true;
            const syncBtn = document.getElementById('sync-btn');
            if (syncBtn) {
                syncBtn.disabled = false;
            }
            showStatus('检测到未保存的更改', 'info');
            console.log('[DEBUG] 单元格被编辑:', cell.getField(), cell.getValue());
        }
    });
    
    console.log('[DEBUG] 表格初始化完成');
    
    // 初始化时确保同步按钮是禁用的
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.disabled = true;
    }
}