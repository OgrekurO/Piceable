// 思维导图模块 - 用于可视化和管理文件夹结构

// 初始化思维导图功能
async function initMindMap() {
    console.log('[MINDMAP] 初始化思维导图功能');
    
    // 创建思维导图UI
    createMindMapUI();
    
    // 绑定事件
    bindMindMapEvents();
}

// 为新页面初始化思维导图功能
async function initMindMapPage() {
    console.log('[MINDMAP] 初始化思维导图页面');
    
    // 绑定页面事件
    bindMindMapPageEvents();
    
    // 初始化思维导图实例
    await initializeMindMapInstance();
}

// 创建思维导图UI元素（用于主页面）
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
        
        // 绑定跳转事件
        mindMapButton.addEventListener('click', () => {
            window.location.href = 'mindmap.html';
        });
    }
}

// 动态加载Mind Elixir库（使用官方推荐的ES模块方式）
async function loadMindElixir() {
    // 检查是否已经加载
    if (window.MindElixir) {
        return;
    }
    
    return new Promise((resolve, reject) => {
        // 创建样式链接
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
        cssLink.onload = () => {
            console.log('[MINDMAP] MindElixir样式加载完成');
        };
        document.head.appendChild(cssLink);
        
        // 动态导入MindElixir模块
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import MindElixir from 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js';
            window.MindElixir = MindElixir;
            document.dispatchEvent(new CustomEvent('mindelixir-loaded'));
        `;
        
        // 监听加载完成事件
        document.addEventListener('mindelixir-loaded', () => {
            console.log('[MINDMAP] MindElixir库加载完成');
            resolve();
        }, { once: true });
        
        script.onerror = () => {
            console.error('[MINDMAP] MindElixir库加载失败');
            reject(new Error('Failed to load MindElixir'));
        };
        
        document.head.appendChild(script);
    });
}

// 初始化思维导图实例
async function initializeMindMapInstance() {
    console.log('[MINDMAP] 初始化思维导图实例');
    
    // 确保MindElixir已加载
    try {
        await loadMindElixir();
    } catch (error) {
        console.error('[MINDMAP] 加载MindElixir失败:', error);
        showStatus('思维导图库加载失败: ' + error.message, 'error');
        return;
    }
    
    // 再次检查MindElixir是否可用
    if (!window.MindElixir) {
        console.error('[MINDMAP] MindElixir未正确加载');
        showStatus('思维导图库未正确加载', 'error');
        return;
    }
    
    const mindmapContainer = document.getElementById('mindmap');
    if (!mindmapContainer) {
        console.error('[MINDMAP] 未找到思维导图容器');
        return;
    }
    
    // 思维导图配置
    const options = {
        el: '#mindmap',
        direction: window.MindElixir.RIGHT, // 使用官方常量
        draggable: true,
        editable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true
    };
    
    // 创建思维导图实例
    window.mind = new window.MindElixir(options);
    
    // 加载文件夹数据
    loadFolderDataToMindMap();
}

// 将文件夹数据加载到思维导图中
function loadFolderDataToMindMap() {
    console.log('[MINDMAP] 加载文件夹数据到思维导图');
    
    // 确保MindElixir已定义
    if (!window.MindElixir) {
        console.error('[MINDMAP] MindElixir未定义');
        return;
    }
    
    // 获取文件夹树结构
    const libraryInfo = window.libraryInfo || { folders: [] };
    const folderTree = buildFolderTree(libraryInfo.folders || []);
    
    // 转换为思维导图数据结构
    const mindMapData = convertFolderTreeToMindMapData(folderTree);
    
    // 初始化思维导图
    if (window.mind && mindMapData) {
        // 使用正确的数据格式初始化
        window.mind.init(mindMapData);
    }
}

// 将文件夹树结构转换为思维导图数据结构
function convertFolderTreeToMindMapData(folderTree, isRoot = true) {
    // 确保MindElixir已定义
    if (!window.MindElixir) {
        console.error('[MINDMAP] MindElixir未定义，无法创建思维导图数据');
        return null;
    }
    
    if (folderTree.length === 0) {
        // 使用官方方法创建新数据
        return window.MindElixir.new('根文件夹');
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
    } else {
        // 处理非根节点情况
        return {
            nodeData: {
                topic: '文件夹结构',
                id: 'root',
                children: folderTree.map(convertNode),
                expanded: true
            }
        };
    }
}

// 绑定思维导图相关事件（用于主页面）
function bindMindMapEvents() {
    console.log('[MINDMAP] 绑定思维导图事件');
    
    // 思维导图按钮点击事件
    const mindMapButton = document.getElementById('mindmap-btn');
    if (mindMapButton) {
        mindMapButton.addEventListener('click', () => {
            window.location.href = 'mindmap.html';
        });
    }
}

// 绑定思维导图相关事件（用于新页面）
function bindMindMapPageEvents() {
    console.log('[MINDMAP] 绑定思维导图页面事件');
    
    // 保存更改按钮点击事件
    const saveButton = document.getElementById('mindmap-save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', saveMindMapChanges);
    }
    
    // 刷新数据按钮点击事件
    const refreshButton = document.getElementById('mindmap-refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshMindMapData);
    }
}

// 刷新思维导图数据
async function refreshMindMapData() {
    console.log('[MINDMAP] 刷新思维导图数据');
    showStatus('刷新数据中...', 'info');
    
    try {
        // 重新加载数据
        await refreshLibraryData();
        // 重新加载文件夹数据到思维导图
        loadFolderDataToMindMap();
        showStatus('数据刷新成功', 'success');
    } catch (error) {
        console.error('[MINDMAP] 刷新数据失败:', error);
        showStatus('数据刷新失败: ' + error.message, 'error');
    }
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

// 显示状态消息
function showStatus(message, type) {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        statusMessage.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
    
    // 同时更新状态栏
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
    }
}

// 刷新库数据的函数（如果不存在则创建一个）
async function refreshLibraryData() {
    // 如果在新页面中，尝试从主页面获取数据或重新加载
    if (typeof window.libraryInfo === 'undefined' && typeof window.parent !== 'undefined' && window.parent.libraryInfo) {
        window.libraryInfo = window.parent.libraryInfo;
    }
    
    // 如果仍然没有数据，尝试重新加载
    if (typeof window.libraryInfo === 'undefined') {
        // 这里可以添加重新加载数据的逻辑
        console.log('[MINDMAP] 需要重新加载库数据');
    }
}