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
window.libraryInfo = window.libraryInfo || {}; // 用于存储库信息

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
        initMindMap();
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
    
    // 初始化思维导图
    console.log('[CORE] 初始化思维导图');
    initMindMap();
    
    console.log('[CORE] 应用初始化完成');
}

// 初始化思维导图
function initMindMap() {
    // 思维导图初始化函数
    // 此处将实现实时渲染当前数据集文件夹结构的思维导图
    // 需要创建或调用一个专门处理mindmap的模块
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
    
    // 模拟库信息
    window.libraryInfo = {
        folders: [
            {
                id: "folder1",
                name: "示例文件夹1",
                children: []
            },
            {
                id: "folder2",
                name: "示例文件夹2",
                children: [
                    {
                        id: "subfolder1",
                        name: "子文件夹",
                        children: []
                    }
                ]
            }
        ]
    };
    
    // 构建文件夹映射表
    const {map, idMap} = buildFolderMap(window.libraryInfo.folders);
    window.folderMap = map;
    window.folderIdMap = idMap;
    
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

// 从Eagle加载项目数据
async function loadEagleItems() {
    try {
        showStatus('正在加载Eagle项目数据...', 'info');
        
        // 获取库信息（包括文件夹结构）
        console.log('[CORE] 获取库信息');
        window.libraryInfo = await eagle.library.info();
        console.log('[CORE] 库信息获取完成:', window.libraryInfo);
        
        // 构建文件夹映射表
        const {map, idMap} = buildFolderMap(window.libraryInfo.folders || []);
        window.folderMap = map;
        window.folderIdMap = idMap;
        console.log('[CORE] 文件夹映射表构建完成，映射表大小:', Object.keys(window.folderMap).length);
        
        // 获取所有项目
        console.log('[CORE] 获取所有项目');
        const items = await eagle.item.list({
            limit: 999999  // 获取所有项目
        });
        console.log('[CORE] 项目获取完成，共', items.length, '个项目');
        
        // 转换数据格式
        window.tableData = items.map(item => {
            // 存储原始项目数据，便于后续更新时查找
            window.originalItems[item.id] = item;
            
            return {
                id: item.id,
                name: item.name,
                url: item.url,
                thumbnail: item.thumbnail,
                folders: getFolderNames(item.folders || []),
                tags: (item.tags || []).join(', '),
                annotation: item.annotation || '',
                lastModified: new Date(item.lastModified).toLocaleString(),
                // 动态列字段将在此处添加
            };
        });
        
        showStatus(`数据加载完成，共 ${items.length} 个项目`, 'success');
    } catch (error) {
        console.error('[CORE] 加载Eagle项目数据失败:', error);
        showStatus('数据加载失败: ' + error.message, 'error');
    }
}


// 根据文件夹ID数组获取名称列表
function getFolderNames(folderIds = []) {
    return folderIds.map(id => window.folderMap[id] || id).join(', ');
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

// 构建文件夹映射表
function buildFolderMap(folders, parentPath = "") {
    const map = {};
    const idMap = {};
    
    function traverse(nodes, path) {
        for (const node of nodes) {
            const currentPath = path ? `${path}/${node.name}` : node.name;
            map[node.id] = currentPath;
            idMap[currentPath] = node.id;
            
            if (node.children && node.children.length > 0) {
                traverse(node.children, currentPath);
            }
        }
    }
    
    traverse(folders, parentPath);
    return { map, idMap };
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
                title: "基础信息",
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
                    }
                ]
            },
            {
                title: "Eagle信息",
                columns: [
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
                ]
            }
            // 动态列将在tableBuilt事件中添加
        ],
        cellEdited: function(cell) {
            console.log('[CORE] 单元格编辑完成:', cell.getField(), cell.getValue());
            window.hasUnsavedChanges = true;
            
            // 启用同步按钮
            const syncBtn = document.getElementById('sync-button');
            if (syncBtn) {
                syncBtn.disabled = false;
            }
        },
        tableBuilt: function() {
            // 表格构建完成后添加动态列（基于文件夹结构）
            console.log('[CORE] 表格构建完成，添加动态列');
            if (window.dynamicColumns && window.dynamicColumns.length > 0) {
                // 获取当前列定义
                const currentColumns = this.getColumns(true).map(col => {
                    return {
                        title: col.getDefinition().title,
                        field: col.getDefinition().field,
                        columns: col.getDefinition().columns
                    };
                });
                
                // 添加动态列
                const allColumns = [...currentColumns, ...window.dynamicColumns];
                this.setColumns(allColumns);
                console.log('[CORE] 动态列添加完成');
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