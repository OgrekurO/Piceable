// 思维导图模块 - 用于可视化和管理文件夹结构

// 初始化思维导图功能
async function initMindMap() {
    console.log('[MINDMAP] 初始化思维导图功能');
    
    // 创建思维导图UI
    createMindMapUI();
    
    // 加载Mind Elixir库
    await loadMindElixir();
    
    // 初始化思维导图实例
    initializeMindMapInstance();
    
    // 绑定事件
    bindMindMapEvents();
}

// 创建思维导图UI元素
function createMindMapUI() {
    console.log('[MINDMAP] 创建思维导图UI');
    
    // 在页面中添加思维导图按钮
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        const mindMapButton = document.createElement('button');
        mindMapButton.id = 'mindmap-btn';
        mindMapButton.textContent = '🧠 文件夹结构';
        mindMapButton.style.marginLeft = '10px';
        toolbar.appendChild(mindMapButton);
    }
    
    // 创建思维导图容器
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        const mindMapContainer = document.createElement('div');
        mindMapContainer.id = 'mindmap-container';
        mindMapContainer.style.height = 'calc(100vh - 150px)';
        mindMapContainer.style.display = 'none';
        mindMapContainer.style.margin = '10px';
        mindMapContainer.style.border = '1px solid #ddd';
        mindMapContainer.style.borderRadius = '8px';
        mindMapContainer.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <h3>文件夹结构视图</h3>
                <div>
                    <button id="mindmap-back-btn">🔙 返回表格</button>
                    <button id="mindmap-save-btn" style="margin-left: 10px;">💾 保存更改</button>
                </div>
            </div>
            <div id="mindmap" style="height: calc(100% - 50px);"></div>
        `;
        appContainer.appendChild(mindMapContainer);
    }
}

// 动态加载Mind Elixir库
function loadMindElixir() {
    return new Promise((resolve, reject) => {
        // 检查是否已经加载
        if (typeof MindElixir !== 'undefined') {
            resolve();
            return;
        }
        
        // 加载CSS样式
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
        cssLink.onload = () => {
            // 加载JS库
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js';
            script.onload = () => {
                // 等待模块加载完成
                setTimeout(() => {
                    resolve();
                }, 500);
            };
            script.onerror = () => reject(new Error('Failed to load MindElixir JS'));
            document.head.appendChild(script);
        };
        cssLink.onerror = () => reject(new Error('Failed to load MindElixir CSS'));
        document.head.appendChild(cssLink);
    });
}

// 初始化思维导图实例
async function initializeMindMapInstance() {
    // 等待MindElixir加载完成
    while (typeof MindElixir === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('[MINDMAP] 初始化思维导图实例');
    
    const mindmapContainer = document.getElementById('mindmap');
    if (!mindmapContainer) {
        console.error('[MINDMAP] 未找到思维导图容器');
        return;
    }
    
    // 思维导图配置
    const options = {
        el: '#mindmap',
        direction: MindElixir.RIGHT,
        draggable: true,
        editable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true
    };
    
    // 创建思维导图实例
    window.mind = new MindElixir(options);
    
    // 加载文件夹数据
    loadFolderDataToMindMap();
}

// 将文件夹数据加载到思维导图中
function loadFolderDataToMindMap() {
    console.log('[MINDMAP] 加载文件夹数据到思维导图');
    
    // 获取文件夹树结构
    const libraryInfo = window.libraryInfo || { folders: [] };
    const folderTree = buildFolderTree(libraryInfo.folders || []);
    
    // 转换为思维导图数据结构
    const mindMapData = convertFolderTreeToMindMapData(folderTree);
    
    // 初始化思维导图
    if (window.mind) {
        window.mind.init(mindMapData);
    }
}

// 将文件夹树结构转换为思维导图数据结构
function convertFolderTreeToMindMapData(folderTree, isRoot = true) {
    if (folderTree.length === 0) {
        return MindElixir.new('根文件夹');
    }
    
    function convertNode(node) {
        return {
            topic: node.name,
            id: node.id,
            children: node.children ? node.children.map(convertNode) : [],
            expanded: true
        };
    }
    
    if (isRoot) {
        // 创建一个根节点包含所有根文件夹
        return {
            nodeData: {
                topic: 'Eagle文件夹结构',
                id: 'root',
                children: folderTree.map(convertNode),
                expanded: true
            }
        };
    }
}

// 绑定思维导图相关事件
function bindMindMapEvents() {
    console.log('[MINDMAP] 绑定思维导图事件');
    
    // 思维导图按钮点击事件
    const mindMapButton = document.getElementById('mindmap-btn');
    if (mindMapButton) {
        mindMapButton.addEventListener('click', showMindMap);
    }
    
    // 返回表格按钮点击事件
    const backButton = document.getElementById('mindmap-back-btn');
    if (backButton) {
        backButton.addEventListener('click', hideMindMap);
    }
    
    // 保存更改按钮点击事件
    const saveButton = document.getElementById('mindmap-save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', saveMindMapChanges);
    }
    
    // 监听思维导图操作事件
    if (window.mind) {
        window.mind.bus.addListener('operation', handleMindMapOperation);
    }
}

// 显示思维导图视图
function showMindMap() {
    console.log('[MINDMAP] 显示思维导图视图');
    
    const tableContainer = document.querySelector('.table-container');
    const mindMapContainer = document.getElementById('mindmap-container');
    
    if (tableContainer) tableContainer.style.display = 'none';
    if (mindMapContainer) mindMapContainer.style.display = 'block';
    
    // 刷新思维导图数据
    loadFolderDataToMindMap();
}

// 隐藏思维导图视图
function hideMindMap() {
    console.log('[MINDMAP] 隐藏思维导图视图');
    
    const tableContainer = document.querySelector('.table-container');
    const mindMapContainer = document.getElementById('mindmap-container');
    
    if (tableContainer) tableContainer.style.display = 'block';
    if (mindMapContainer) mindMapContainer.style.display = 'none';
}

// 保存思维导图更改
function saveMindMapChanges() {
    console.log('[MINDMAP] 保存思维导图更改');
    showStatus('思维导图功能仍在开发中...', 'info');
}

// 处理思维导图操作事件
function handleMindMapOperation(operation) {
    console.log('[MINDMAP] 思维导图操作:', operation);
    // 这里可以处理添加、删除、编辑节点等操作
}