// D3.js思维导图实现
function initD3MindMap() {
    console.log('[D3 MINDMAP] 初始化D3.js思维导图');
    
    // 绑定事件
    bindD3MindMapEvents();
    
    // 初始化思维导图实例
    initializeD3MindMapInstance();
}

// 绑定思维导图相关事件
function bindD3MindMapEvents() {
    console.log('[D3 MINDMAP] 绑定思维导图事件');
}

// 初始化思维导图实例
function initializeD3MindMapInstance() {
    console.log('[D3 MINDMAP] 初始化思维导图实例');
    
    // 获取文件夹数据并渲染
    loadFolderDataToD3MindMap();
}

// 将文件夹数据加载到D3思维导图中
function loadFolderDataToD3MindMap() {
    console.log('[D3 MINDMAP] 加载文件夹数据到D3思维导图');
    
    // 获取文件夹树结构
    const libraryInfo = window.libraryInfo || { folders: [] };
    console.log('[D3 MINDMAP] libraryInfo:', libraryInfo);
    
    if (!libraryInfo.folders) {
        console.warn('[D3 MINDMAP] libraryInfo中缺少folders字段，使用空数组');
        libraryInfo.folders = [];
    }
    
    let folderTree = buildFolderTree(libraryInfo.folders || []);
    console.log('[D3 MINDMAP] folderTree:', folderTree);
    
    // 应用文件夹筛选
    folderTree = filterFoldersForMindMap(folderTree);
    console.log('[D3 MINDMAP] 筛选后的folderTree:', folderTree);
    
    // 转换为思维导图数据结构
    const mindMapData = convertFolderTreeToMindMapData(folderTree);
    console.log('[D3 MINDMAP] mindMapData:', mindMapData);
    
    // 渲染D3思维导图
    if (mindMapData) {
        renderD3MindMap(mindMapData);
    } else {
        console.error('[D3 MINDMAP] 无法渲染思维导图，缺少数据');
        showStatus('无法渲染思维导图，缺少数据', 'error');
    }
}

// 渲染D3思维导图
function renderD3MindMap(data) {
    console.log('[D3 MINDMAP] 渲染D3思维导图，数据:', data);
    
    // 清空现有的思维导图容器
    const container = document.getElementById('mindmap');
    if (!container) {
        console.error('[D3 MINDMAP] 未找到思维导图容器');
        return;
    }
    
    container.innerHTML = '';
    
    // 添加调试信息，判断是否正确获取container的宽高
    console.log('[D3 MINDMAP] Container 元素:', container);
    console.log('[D3 MINDMAP] Container clientWidth:', container.clientWidth);
    console.log('[D3 MINDMAP] Container clientHeight:', container.clientHeight);
    console.log('[D3 MINDMAP] Container offsetWidth:', container.offsetWidth);
    console.log('[D3 MINDMAP] Container offsetHeight:', container.offsetHeight);
    console.log('[D3 MINDMAP] Container computed style:', window.getComputedStyle(container));
    
    // 设置图表尺寸
    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 800;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height)  - 80;
    
    console.log('[D3 MINDMAP] 图表尺寸:', { width, height, cx, cy, radius });
    
    // 创建SVG容器
    const svg = d3.select('#mindmap')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'width: 100%; height: 100%; font: 12px sans-serif;');
    
    // 创建一个用于拖拽的组
    const g = svg.append('g');
    
    // 添加拖拽功能
    const zoom = d3.zoom()
        .scaleExtent([0.1, 8])  // 缩放范围
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // 创建层级结构布局
    const root = d3.hierarchy(data)
        .sort((a, b) => d3.ascending(a.data.topic, b.data.topic));
    
    // 使用径向布局
    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
    
    tree(root);
    
    // 绘制连接线
    const links = g.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#555')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5)
        .selectAll()
        .data(root.links())
        .join('path')
        .attr('d', d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y))
        .attr('transform', `translate(${width/2},${height/2})`);
    
    // 绘制节点
    const nodes = g.append('g')
        .selectAll()
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${width/2},${height/2}) rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr('class', 'node');
    
    // 添加节点圆点
    nodes.append('circle')
        .attr('fill', d => d.children ? '#555' : '#999')
        .attr('r', 12)
        .attr('class', 'node-circle')
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            // 点击节点时添加子节点
            addChildNode(d, this);
        });
    
    // 添加节点文本
    nodes.append('text')
        .attr('transform', d => `rotate(${d.x >= Math.PI ? 180 : 0})`)
        .attr('dy', '0.31em')
        .attr('x', d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
        .attr('paint-order', 'stroke')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('fill', 'currentColor')
        .text(d => d.data.topic)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            // 点击节点文本时也添加子节点
            addChildNode(d, this.parentNode);
        });
    
    console.log('[D3 MINDMAP] D3思维导图渲染完成');
}

// 添加子节点功能
function addChildNode(nodeData, nodeElement) {
    console.log('[D3 MINDMAP] 为节点添加子节点:', nodeData);
    
    // 显示自定义模态框用于输入新节点名称
    showAddNodeModal(nodeData);
}

// 显示添加节点模态框
function showAddNodeModal(nodeData) {
    const modal = document.getElementById('add-node-modal');
    const input = document.getElementById('new-node-name');
    const confirmBtn = document.getElementById('confirm-add-node');
    const cancelBtn = document.getElementById('cancel-add-node');
    const closeBtn = document.getElementById('close-modal');
    
    // 清空输入框
    input.value = '新节点';
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 确认按钮事件
    confirmBtn.onclick = function() {
        const newNodeName = input.value.trim();
        if (newNodeName) {
            createChildNode(nodeData, newNodeName);
        }
        modal.style.display = 'none';
    };
    
    // 取消按钮事件
    cancelBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    // 关闭按钮事件
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    // 点击模态框外部关闭
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// 创建子节点
function createChildNode(nodeData, newNodeName) {
    // 创建新节点数据
    const newNode = {
        topic: newNodeName,
        children: []
    };
    
    // 如果当前节点没有子节点数组，则创建一个
    if (!nodeData.data.children) {
        nodeData.data.children = [];
    }
    
    // 将新节点添加到当前节点的子节点数组中
    nodeData.data.children.push(newNode);
    
    // 重新渲染思维导图
    // 注意：这里需要重新构建数据结构
    const rootData = findRootData(nodeData);
    renderD3MindMap(rootData);
    
    showStatus(`成功添加子节点: ${newNodeName}`, 'success');
}

// 查找根节点数据
function findRootData(nodeData) {
    // 如果有父节点，继续向上查找
    if (nodeData.parent) {
        return findRootData(nodeData.parent);
    }
    // 如果没有父节点，这就是根节点
    return nodeData.data;
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