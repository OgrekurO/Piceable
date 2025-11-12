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
        await loadModule('js/modules/mindmap.js');
        
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
        if (typeof window.mind !== 'undefined') {
            loadFolderDataToMindMap();
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
}

// 当数据准备好时初始化思维导图
function initializeMindMapWhenReady() {
    // 确保思维导图模块已加载
    if (typeof initMindMapPage === 'function') {
        initMindMapPage();
    } else {
        // 如果模块尚未加载，等待一段时间后重试
        setTimeout(() => {
            if (typeof initMindMapPage === 'function') {
                initMindMapPage();
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