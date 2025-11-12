// 通过动态加载方式引入各个模块
function loadModule(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load module: ${src}`));
        document.head.appendChild(script);
    });
}

// 按顺序加载所有模块
async function loadAllModules() {
    try {
        // 按依赖顺序加载模块
        await loadModule('js/modules/core.js');
        await loadModule('js/modules/data.js');
        await loadModule('js/modules/sync.js');
        await loadModule('js/modules/ui.js');
        await loadModule('js/modules/template.js');
        await loadModule('js/modules/multiheader.js');
        await loadModule('js/modules/mindmap.js');
        
    } catch (error) {
        console.error('[ERROR] 模块加载失败:', error);
    }
}

// 页面加载完成后开始加载模块
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllModules);
} else {
    loadAllModules();
}