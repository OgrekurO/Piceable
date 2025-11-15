// 通过动态加载方式引入思维导图相关模块
function loadModule(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load module: ${src}`));
        document.head.appendChild(script);
    });
}

// 按顺序加载思维导图相关模块
async function loadMindMapModules() {
    try {
        // 只加载思维导图必需的模块
        await loadModule('js/modules/data.js');
        await loadModule('js/modules/d3-mindmap.js');
        
        // 模块加载完成后执行初始化
        initializeMindMapPlugin();
    } catch (error) {
        console.error('[MINDMAP PLUGIN] 模块加载失败:', error);
    }
}

// 初始化思维导图插件
function initializeMindMapPlugin() {
    console.log('[MINDMAP PLUGIN] 初始化思维导图插件');
    
    // 页面加载完成后初始化思维导图
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMindMapPage);
    } else {
        initializeMindMapPage();
    }
}

// 初始化思维导图页面
async function initializeMindMapPage() {
    console.log('[MINDMAP PLUGIN] 初始化思维导图页面');
    
    // 绑定筛选功能事件
    bindFilterEvents();
    
    // 首先尝试从 opener 窗口获取 libraryInfo 数据
    if (window.opener && !window.opener.closed && window.opener.libraryInfo) {
        window.libraryInfo = window.opener.libraryInfo;
        console.log('[MINDMAP PLUGIN] 从 opener 窗口获取到 libraryInfo 数据');
        // 数据获取成功后初始化思维导图
        initializeMindMapWhenReady();
    } else {
        // 如果 opener 没有数据，尝试通过插件 API 获取
        await getLibraryInfoFromPluginAPI();
    }
    
    // 如果仍然没有数据，会在 getLibraryInfoFromPluginAPI 或其他数据源中处理初始化
    // 这里不再主动初始化，避免重复初始化
}

// 绑定筛选功能事件
function bindFilterEvents() {
    // 应用筛选按钮点击事件
    const applyFilterButton = document.getElementById('apply-filter');
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', applyFolderFilter);
    }
    
    // 回车键应用筛选
    const filterInput = document.getElementById('folder-filter');
    if (filterInput) {
        filterInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                applyFolderFilter();
            }
        });
    }
    
    // 恢复之前保存的筛选条件
    const savedFilter = localStorage.getItem('mindmapFolderFilter');
    if (savedFilter && filterInput) {
        filterInput.value = savedFilter;
    }
}

// 应用文件夹筛选
function applyFolderFilter() {
    const filterInput = document.getElementById('folder-filter');
    if (filterInput) {
        const filterText = filterInput.value.trim();
        if (filterText) {
            // 保存筛选条件到localStorage
            localStorage.setItem('mindmapFolderFilter', filterText);
        } else {
            // 清除筛选条件
            localStorage.removeItem('mindmapFolderFilter');
        }
        
        // 重新加载思维导图
        if (typeof loadFolderDataToD3MindMap === 'function') {
            loadFolderDataToD3MindMap();
        }
    }
}

// 通过插件 API 获取数据
async function getLibraryInfoFromPluginAPI() {
    if (typeof window.eagle !== 'undefined') {
        // 监听 plugin-create 事件，确保插件完全初始化后再调用API
        window.eagle.onPluginCreate(async () => {
            try {
                // 插件创建完成后调用 library.info() 方法获取数据
                window.libraryInfo = await window.eagle.library.info();
                console.log('[MINDMAP PLUGIN] 通过插件 API 获取到 libraryInfo 数据');
                // 数据获取成功后初始化思维导图
                initializeMindMapWhenReady();
            } catch (error) {
                console.error('[MINDMAP PLUGIN] 通过插件 API 获取数据失败:', error);
                showErrorMessage('通过插件 API 获取数据失败: ' + error.message);
            }
        });
    } else {
        console.log('[MINDMAP PLUGIN] window.eagle 未定义');
        // 即使没有eagle，也尝试初始化
        initializeMindMapWhenReady();
    }
    
    // 绑定导航栏和功能栏事件
    bindHeaderAndToolbarEvents();
}

// 绑定导航栏和功能栏事件
function bindHeaderAndToolbarEvents() {
    // 刷新数据按钮事件处理
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            try {
                // TODO: 实现刷新数据功能
                console.log('[MINDMAP] 刷新数据按钮被点击');
            } catch (error) {
                console.error('[MINDMAP] 刷新数据失败:', error);
            }
        });
    }
    
    // 属性模板按钮事件处理
    const templateBtn = document.getElementById('template-btn');
    if (templateBtn) {
        templateBtn.addEventListener('click', function() {
            // TODO: 实现属性模板功能
            console.log('[MINDMAP] 点击属性模板按钮');
        });
    }
    
    // 数据可视化按钮事件处理
    const visualizationBtn = document.getElementById('visualization-btn');
    if (visualizationBtn) {
        visualizationBtn.addEventListener('click', function() {
            // TODO: 实现数据可视化功能
            console.log('[MINDMAP] 点击数据可视化按钮');
        });
    }
    
    // 导出CSV按钮事件处理
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function() {
            console.log('[MINDMAP] 点击导出CSV按钮');
            // TODO: 实现导出CSV功能
            alert('导出CSV功能将在后续版本中实现');
        });
    }
    
    // 表格按钮事件处理
    const tableBtn = document.getElementById('table-btn');
    if (tableBtn) {
        tableBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // 分组控制事件处理
    const groupingSelect = document.getElementById('grouping-select');
    if (groupingSelect) {
        groupingSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            console.log('[MINDMAP] 分组方式更改:', selectedValue);
            // TODO: 实现分组功能
        });
    }
    
    // 页码选择器事件处理
    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            const pageSize = parseInt(this.value);
            console.log('[MINDMAP] 页码选择器更改:', pageSize);
            // TODO: 实现页码选择功能
        });
    }
    
    // 初始化思维导图缩放功能
    initMindMapZoom();
}

// 思维导图缩放功能
function initMindMapZoom() {
    const mindmapContainer = document.getElementById('mindmap-container');
    
    // 检查必要元素是否存在
    if (!mindmapContainer) {
        console.warn('[MINDMAP ZOOM] 未找到思维导图容器');
        return;
    }
    
    let scale = 1;
    
    // 添加鼠标滚轮缩放事件
    mindmapContainer.addEventListener('wheel', function(e) {
        // 检查是否按住了Ctrl键
        if (e.ctrlKey) {
            e.preventDefault();
            
            // 根据滚轮方向调整缩放比例 (使用较低的灵敏度0.05)
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            scale = Math.max(0.1, Math.min(3, scale + delta));
            
            // 应用缩放变换
            applyZoom();
        }
    });
    
    // 放大按钮事件
    const zoomInBtn = document.getElementById('zoom-in-btn');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            scale = Math.min(3, scale + 0.05);
            applyZoom();
        });
    }
    
    // 缩小按钮事件
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            scale = Math.max(0.1, scale - 0.05);
            applyZoom();
        });
    }
    
    // 重置缩放按钮事件
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', function() {
            scale = 1;
            applyZoom();
        });
    }
    
    // 应用缩放变换
    function applyZoom() {
        // 使用transform替代zoom以获得更好的浏览器兼容性
        mindmapContainer.style.transform = `scale(${scale})`;
        mindmapContainer.style.transformOrigin = 'center top';
    }
}

// 当数据准备好时初始化思维导图
function initializeMindMapWhenReady() {
    // 确保思维导图模块已加载
    if (typeof initD3MindMap === 'function') {
        initD3MindMap();
    } else {
        // 如果模块尚未加载，等待一段时间后重试
        setTimeout(() => {
            if (typeof initD3MindMap === 'function') {
                initD3MindMap();
            } else {
                console.error('[MINDMAP PLUGIN] 思维导图模块未正确加载');
                showErrorMessage('思维导图模块未正确加载');
            }
        }, 1000);
    }
}

// 显示错误消息
function showErrorMessage(message) {
    const statusMessage = document.getElementById('status-message');
    const statusBar = document.getElementById('status-bar');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message error';
        statusMessage.style.display = 'block';
    }
    if (statusBar) {
        statusBar.textContent = '数据加载失败';
    }
    console.error('[MINDMAP PLUGIN] ' + message);
}

// 页面加载完成后开始加载模块
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMindMapModules);
} else {
    loadMindMapModules();
}