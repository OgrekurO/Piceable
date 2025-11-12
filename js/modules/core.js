// 动态加载Tabulator
function loadTabulator() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // 使用更新版本的Tabulator库，可能解决了userAgent相关的问题
        script.src = 'https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js';
        script.onload = () => {
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Failed to load Tabulator'));
        };
        document.head.appendChild(script);
    });
}

// 初始化全局变量
window.tableData = window.tableData || [];
window.table = window.table || null;
window.hasUnsavedChanges = window.hasUnsavedChanges || false;
window.folderMap = window.folderMap || {}; // 用于存储文件夹ID到名称的映射
window.folderIdMap = window.folderIdMap || {}; // 用于存储文件夹名称到ID的反向映射
window.originalItems = window.originalItems || {}; // 用于存储原始项目数据，便于更新时查找
window.isPluginReady = window.isPluginReady || false; // 标记插件是否已准备就绪
window.templates = window.templates || []; // 用于存储属性模板

// 插件创建时的回调
eagle.onPluginCreate(async (plugin) => {
    console.log('[CORE] Eagle插件已创建');
    window.isPluginReady = true;
});

// 插件运行时的回调
eagle.onPluginRun(async () => {
    console.log('[CORE] Eagle插件开始运行');
    
    // 等待插件准备就绪
    await new Promise(resolve => {
        const checkReady = setInterval(() => {
            if (window.isPluginReady) {
                clearInterval(checkReady);
                resolve();
            }
        }, 100);
    });
    
    console.log('[CORE] 插件已准备就绪，开始初始化应用');
    await initializeApp();
});

// 插件显示时的回调
eagle.onPluginShow(async () => {
    console.log('[CORE] Eagle插件已显示');
});

// 插件隐藏时的回调
eagle.onPluginHide(() => {
    console.log('[CORE] Eagle插件已隐藏');
});

// 初始化应用
async function initializeApp() {
    console.log('[CORE] 开始初始化应用');
    
    // 检查是否在Eagle环境中
    if (typeof eagle === 'undefined') {
        console.log('[CORE] 未检测到Eagle环境');
        // 在非Eagle环境中使用示例数据进行演示
        loadDemoData();
        initUI();
        bindEvents();
        initializeTable();
        return;
    }
    
    // 等待Tabulator加载完成
    if (typeof Tabulator === 'undefined') {
        try {
            console.log('[CORE] 开始加载Tabulator库');
            await loadTabulator();
            console.log('[CORE] Tabulator库加载完成');
        } catch (error) {
            console.error('[CORE] Tabulator库加载失败:', error);
            showStatus('界面库加载失败: ' + error.message, 'error');
            return;
        }
    }
    
    // 加载数据
    console.log('[CORE] 开始加载Eagle项目数据');
    await loadEagleItems();
    
    // 初始化UI
    initUI();
    
    // 绑定事件
    bindEvents();
    
    // 初始化表格
    console.log('[CORE] 初始化表格');
    initializeTable();
    
    console.log('[CORE] 应用初始化完成');
}

// 加载演示数据（用于非Eagle环境下的演示）
function loadDemoData() {
    showStatus('加载演示数据...', 'info');
    
    window.tableData = [
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
    
    showStatus(`已加载 ${window.tableData.length} 条演示数据`, 'success');
    const statusBarEl = document.getElementById('status-bar');
    if (statusBarEl) {
        statusBarEl.textContent = `演示模式 - 已加载 ${window.tableData.length} 条演示数据`;
    }
}

// 初始化UI
function initUI() {
    console.log('[CORE] 初始化UI');
    
    // 确保必要的DOM元素存在
    const container = document.getElementById('app-container');
    if (!container) {
        console.error('[CORE] 找不到app-container元素');
        return;
    }
}

// 绑定事件
function bindEvents() {
    console.log('[CORE] 绑定事件');
}

// 加载Eagle项目数据
async function loadEagleItems() {
    showStatus('正在加载项目数据...', 'info');
    
    try {
        // 获取所有文件夹
        const foldersResponse = await eagle.api.getFolders();
        if (foldersResponse.status === "success") {
            // 构建文件夹映射
            window.folderMap = {};
            window.folderIdMap = {};
            foldersResponse.data.forEach(folder => {
                buildFolderMap(folder, "");
            });
        }
        
        // 获取所有项目
        const itemsResponse = await eagle.api.v1.item.list({
            limit: 9999,
            type: "image"
        });
        
        if (itemsResponse.status === "success") {
            window.originalItems = {};
            window.tableData = itemsResponse.data.items.map(item => {
                // 存储原始项目数据
                window.originalItems[item.id] = item;
                
                return {
                    id: item.id,
                    name: item.name,
                    url: item.url || "",
                    thumbnail: item.thumbnail,
                    folders: getFolderPath(item.folderId),
                    tags: item.tags ? item.tags.join(",") : "",
                    annotation: item.annotation || "",
                    lastModified: new Date(item.modifyTime).toLocaleString()
                };
            });
            
            showStatus(`成功加载 ${window.tableData.length} 个项目`, 'success');
        } else {
            throw new Error(itemsResponse.message || "获取项目失败");
        }
    } catch (error) {
        console.error('[CORE] 加载数据失败:', error);
        showStatus('加载数据失败: ' + error.message, 'error');
        // 在非Eagle环境中使用演示数据
        if (typeof eagle === 'undefined') {
            loadDemoData();
        }
    }
}

// 构建文件夹路径映射
function buildFolderMap(folder, parentPath) {
    const currentPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
    window.folderMap[folder.id] = currentPath;
    window.folderIdMap[currentPath] = folder.id;
    
    if (folder.children && folder.children.length > 0) {
        folder.children.forEach(child => {
            buildFolderMap(child, currentPath);
        });
    }
}

// 根据文件夹ID获取完整路径
function getFolderPath(folderId) {
    return window.folderMap[folderId] || "未分类";
}

// 显示状态消息
function showStatus(message, type = 'info') {
    console.log(`[DEBUG] 显示状态消息: ${message}, 类型: ${type}`);
    
    // 更新状态栏
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = `status-bar status-${type}`;
    }
    
    // 显示通知（如果在Eagle环境中）
    if (typeof eagle !== 'undefined' && eagle.ui && eagle.ui.showNotification) {
        eagle.ui.showNotification(message, { 
            type: type,
            timeout: type === 'error' ? 0 : 3000
        });
    }
}

// 初始化表格
function initializeTable() {
    console.log('[CORE] 初始化表格');
    
    // 确保必要的DOM元素存在
    const tableElement = document.getElementById('item-table');
    if (!tableElement) {
        console.error('[CORE] 错误: 未找到表格容器元素 #item-table');
        showStatus('表格容器元素未找到', 'error');
        return;
    }
    
    // 初始化Tabulator表格
    window.table = new Tabulator("#item-table", {
        data: window.tableData,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 20,
        paginationSizeSelector: [10, 20, 50, 100],
        movableColumns: true,
        resizableRows: true,
        selectable: true, // 启用选择功能
        columns: [
            {
                title: "预览",
                field: "thumbnail",
                formatter: "image",
                formatterParams: {
                    height: "50px",
                    width: "50px"
                },
                hozAlign: "center",
                vertAlign: "middle",
                width: 80
            },
            {
                title: "名称",
                field: "name",
                editor: "input",
                validator: ["required"],
                width: 200
            },
            {
                title: "文件夹",
                field: "folders",
                editor: "input",
                width: 150
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
                formatter: "textarea"
            },
            {
                title: "最后修改时间",
                field: "lastModified",
                hozAlign: "center",
                width: 150
            }
        ],
        cellEdited: function(cell) {
            console.log('[CORE] 单元格编辑完成:', cell.getField(), cell.getValue());
            window.hasUnsavedChanges = true;
            
            // 启用同步按钮
            const syncBtn = document.getElementById('sync-button');
            if (syncBtn) {
                syncBtn.disabled = false;
            }
        }
    });
    
    console.log('[CORE] 表格初始化完成');
}

// 同步数据到Eagle（占位函数，实际实现在sync.js中）
async function syncDataToEagle() {
    console.log('[CORE] 开始同步数据到Eagle');
    showStatus('正在同步数据到Eagle...', 'info');
    
    // 这里应该调用sync.js中的实际同步逻辑
    // 例如：遍历数据，比较与 originalItems 的差异，调用 eagle.api.v1.item.update 等
    
    // 模拟一个异步操作
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[CORE] 数据同步到Eagle完成');
    showStatus('数据已同步到Eagle', 'success');
}

// 获取所有模板
function getTemplates() {
    return window.templates || [];
}

// 添加新模板
function addTemplate(template) {
    if (!window.templates) window.templates = [];
    
    // 检查ID是否已存在
    if (window.templates.some(t => t.id === template.id)) {
        console.warn('[CORE] 模板ID已存在:', template.id);
        return false;
    }
    
    window.templates.push(template);
    return true;
}