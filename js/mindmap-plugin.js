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
        
    } catch (error) {
        console.error('[ERROR] 模块加载失败:', error);
    }
}

// 页面加载完成后开始加载模块
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMindMapModules);
} else {
    loadMindMapModules();
}