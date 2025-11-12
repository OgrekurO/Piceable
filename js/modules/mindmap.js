// 思维导图模块 - 用于可视化和管理文件夹结构

// 添加一个标志来跟踪MindElixir是否已经初始化
let mindElixirInitialized = false;

// 动态加载Regenerator Runtime
function loadRegeneratorRuntime() {
    return new Promise((resolve, reject) => {
        // 检查是否已经加载
        if (typeof regeneratorRuntime !== 'undefined') {
            resolve();
            return;
        }
        
        // 加载Regenerator Runtime
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.9/runtime.min.js';
        script.onload = () => {
            console.log('[MINDMAP] Regenerator Runtime加载完成');
            resolve();
        };
        script.onerror = () => {
            console.error('[MINDMAP] Regenerator Runtime加载失败');
            reject(new Error('Failed to load Regenerator Runtime'));
        };
        document.head.appendChild(script);
    });
}

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
    
    // 检查是否已经初始化过
    if (mindElixirInitialized) {
        console.log('[MINDMAP] MindElixir已经初始化，刷新数据');
        // 如果已经初始化，则只刷新数据
        loadFolderDataToMindMap();
        return;
    }
    
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

// 动态加载Mind Elixir库
async function loadMindElixir() {
    // 首先确保Regenerator Runtime已加载
    try {
        await loadRegeneratorRuntime();
    } catch (error) {
        console.error('[MINDMAP] 加载Regenerator Runtime失败:', error);
        throw error;
    }
    
    return new Promise((resolve, reject) => {
        // 检查是否已经加载
        if (window.MindElixir) {
            resolve();
            return;
        }
        
        // 加载CSS样式
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = './node_modules/mind-elixir/dist/MindElixir.css';
        cssLink.onload = () => {
            console.log('[MINDMAP] MindElixir样式加载完成');
        };
        document.head.appendChild(cssLink);
        
        // 加载JS库 - 使用IIFE版本确保在浏览器中可执行
        const script = document.createElement('script');
        script.src = './node_modules/mind-elixir/dist/MindElixir.iife.js';
        script.onload = () => {
            console.log('[MINDMAP] MindElixir库加载完成');
            // 等待一段时间确保库完全初始化
            setTimeout(() => {
                if (window.MindElixir) {
                    resolve();
                } else {
                    reject(new Error('MindElixir loaded but not available in global scope'));
                }
            }, 200);
        };
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
        direction: 2, // RIGHT (使用数字常量而不是MindElixir.RIGHT以避免作用域问题)
        draggable: true,
        editable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true
    };
    
    console.log('[MINDMAP] MindElixir配置:', options);
    
    // 创建思维导图实例
    window.mind = new window.MindElixir(options);
    console.log('[MINDMAP] 创建MindElixir实例:', window.mind);
    
    // 标记为已初始化
    mindElixirInitialized = true;
    
    // 加载文件夹数据
    loadFolderDataToMindMap();
}

// 将文件夹数据加载到思维导图中
function loadFolderDataToMindMap() {
    console.log('[MINDMAP] 加载文件夹数据到思维导图');
    
    // 获取文件夹树结构
    const libraryInfo = window.libraryInfo || { folders: [] };
    console.log('[MINDMAP] libraryInfo:', libraryInfo);
    
    if (!libraryInfo.folders) {
        console.warn('[MINDMAP] libraryInfo中缺少folders字段，使用空数组');
        libraryInfo.folders = [];
    }
    
    let folderTree = buildFolderTree(libraryInfo.folders || []);
    console.log('[MINDMAP] folderTree:', folderTree);
    
    // 应用文件夹筛选
    folderTree = filterFoldersForMindMap(folderTree);
    console.log('[MINDMAP] 筛选后的folderTree:', folderTree);
    
    // 转换为思维导图数据结构
    const mindMapData = convertFolderTreeToMindMapData(folderTree);
    console.log('[MINDMAP] mindMapData:', mindMapData);
    
    // 如果没有mindMapData，使用默认数据
    const finalMindMapData = mindMapData || window.MindElixir.new('Eagle文件夹结构').nodeData;
    
    // 初始化思维导图
    if (window.mind && finalMindMapData) {
        console.log('[MINDMAP] 准备初始化思维导图，数据:', finalMindMapData);
        
        try {
            // 使用init方法初始化数据，而不是在创建实例时传递数据
            console.log('[MINDMAP] 使用init方法初始化数据');
            
            // 构造正确的数据结构
            const initData = {
                nodeData: finalMindMapData
            };
            
            // 初始化MindElixir实例
            window.mind.init(initData);
            console.log('[MINDMAP] MindElixir初始化成功');
            
            // 检查更新后的nodeData
            console.log('[MINDMAP] 更新后的nodeData:', window.mind.nodeData);
            
            // 应用半圆弧布局
            setTimeout(() => {
                // 再次检查nodeData
                console.log('[MINDMAP] 延迟检查nodeData:', window.mind.nodeData);
                
                // 应用半圆弧布局
                applySemicircleLayout();
                console.log('[MINDMAP] 半圆弧布局应用完成');
            }, 100);
        } catch (error) {
            console.error('[MINDMAP] 初始化思维导图时发生错误:', error);
            console.error('[MINDMAP] 错误堆栈:', error.stack);
            showStatus('思维导图初始化失败: ' + error.message, 'error');
        }
    } else {
        console.error('[MINDMAP] 无法初始化思维导图，原因：', {
            hasMindInstance: !!window.mind,
            hasMindMapData: !!finalMindMapData,
            mindInstance: window.mind,
            mindMapData: finalMindMapData
        });
        showStatus('思维导图初始化失败：缺少实例或数据', 'error');
    }
}

// 应用半圆弧布局
function applySemicircleLayout() {
    console.log('[MINDMAP] 开始应用半圆弧布局');
    if (!window.mind) {
        console.warn('[MINDMAP] MindElixir实例不存在，无法应用布局');
        return;
    }
    
    console.log('[MINDMAP] 当前nodeData:', window.mind.nodeData);
    
    // 检查nodeData是否存在
    if (!window.mind.nodeData) {
        console.warn('[MINDMAP] nodeData不存在，无法应用布局');
        return;
    }
    
    // 获取所有节点
    const allNodes = getAllNodes(window.mind.nodeData);
    console.log('[MINDMAP] 所有节点:', allNodes);
    
    // 检查是否有节点
    if (allNodes.length === 0) {
        console.warn('[MINDMAP] 没有节点，无法应用布局');
        return;
    }
    
    // 计算半圆弧布局
    calculateSemicirclePositions(allNodes, window.mind);
    
    // 重新渲染
    if (typeof window.mind.layout === 'function') {
        window.mind.layout();
    }
    console.log('[MINDMAP] 半圆弧布局应用完成');
}

// 获取所有节点
function getAllNodes(nodeData) {
    // 检查nodeData是否存在
    if (!nodeData) {
        console.warn('[MINDMAP] getAllNodes: nodeData不存在');
        return [];
    }
    
    const nodes = [];
    
    function traverse(node) {
        // 检查节点是否存在
        if (!node) {
            return;
        }
        
        nodes.push(node);
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(traverse);
        }
    }
    
    traverse(nodeData);
    return nodes;
}

// 计算半圆弧布局位置
function calculateSemicirclePositions(nodes, mind) {
    if (nodes.length <= 1) return;
    
    // 获取根节点
    const rootNode = nodes[0];
    
    // 设置根节点位置在中心
    rootNode.root = true;
    rootNode.x = mind.container.offsetWidth / 2;
    rootNode.y = mind.container.offsetHeight / 2;
    
    // 处理子节点
    if (rootNode.children && rootNode.children.length > 0) {
        const childNodes = rootNode.children;
        const totalChildren = childNodes.length;
        
        // 如果只有一个子节点，放置在正上方
        if (totalChildren === 1) {
            const childNode = childNodes[0];
            childNode.x = rootNode.x;
            childNode.y = rootNode.y - 150;
            
            // 递归处理孙子节点
            if (childNode.children && childNode.children.length > 0) {
                positionGrandChildrenInSemicircle(childNode.children, childNode, 100);
            }
        } else {
            // 计算半圆弧上的位置（从左到右排列）
            for (let i = 0; i < totalChildren; i++) {
                // 从π到0的弧度范围（半圆，开口向上）
                const angle = Math.PI - (i / (totalChildren - 1)) * Math.PI;
                const radius = 200; // 半径
                
                const childNode = childNodes[i];
                childNode.x = rootNode.x + radius * Math.cos(angle);
                childNode.y = rootNode.y - radius * Math.sin(angle); // 负号使弧线向上
                
                // 递归处理孙子节点
                if (childNode.children && childNode.children.length > 0) {
                    positionGrandChildrenInSemicircle(childNode.children, childNode, 100);
                }
            }
        }
    }
}

// 在半圆弧中定位孙子节点
function positionGrandChildrenInSemicircle(children, parentNode, radius) {
    const totalChildren = children.length;
    
    // 如果只有一个子节点，放置在正下方
    if (totalChildren === 1) {
        const childNode = children[0];
        childNode.x = parentNode.x;
        childNode.y = parentNode.y + radius;
        return;
    }
    
    // 多个子节点时，在父节点下方半圆弧排列
    for (let i = 0; i < totalChildren; i++) {
        // 从π到0的弧度范围（半圆，开口向下）
        const angle = Math.PI - (i / (totalChildren - 1)) * Math.PI;
        const childNode = children[i];
        childNode.x = parentNode.x + (radius * 0.8) * Math.cos(angle);
        childNode.y = parentNode.y + (radius * 0.8) * Math.sin(angle); // 正号使弧线向下
        
        // 递归处理更深层的节点
        if (childNode.children && childNode.children.length > 0) {
            positionGrandChildrenInSemicircle(childNode.children, childNode, radius * 0.7);
        }
    }
}

// 文件夹筛选功能（专用于思维导图）
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
    if (typeof window.libraryInfo === 'undefined' && typeof window.opener !== 'undefined' && window.opener.libraryInfo) {
        window.libraryInfo = window.opener.libraryInfo;
    }
    
    // 如果仍然没有数据，尝试通过插件API重新加载
    if (typeof window.libraryInfo === 'undefined') {
        // 这里可以添加重新加载数据的逻辑
        console.log('[MINDMAP] 需要重新加载库数据');
        
        // 尝试从插件API获取数据
        if (typeof window.eagle !== 'undefined') {
            try {
                const libraryInfo = await window.eagle.library.info();
                window.libraryInfo = libraryInfo;
                console.log('[MINDMAP] 通过插件API获取到库信息');
            } catch (error) {
                console.error('[MINDMAP] 通过插件API获取库信息失败:', error);
            }
        }
    }
}