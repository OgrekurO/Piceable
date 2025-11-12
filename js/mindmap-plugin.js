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
    
    // 首先尝试从 opener 窗口获取 libraryInfo 数据
    if (window.opener && !window.opener.closed && window.opener.libraryInfo) {
        window.libraryInfo = window.opener.libraryInfo;
        console.log('[MINDMAP PLUGIN] 从 opener 窗口获取到 libraryInfo 数据');
        // 数据获取成功后初始化思维导图
        initializeMindMapWhenReady();
    } else {
        // 如果 opener 没有数据，尝试通过插件 API 获取
        getLibraryInfoFromPluginAPI();
    }
    
    // 如果仍然没有数据，显示错误消息
    if (typeof window.libraryInfo === 'undefined') {
        showErrorMessage('无法获取文件夹数据，请返回主界面刷新数据后重试');
    }
}

// 通过插件 API 获取数据
function getLibraryInfoFromPluginAPI() {
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