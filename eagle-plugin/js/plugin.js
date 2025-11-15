// 插件主入口文件
// 负责按顺序动态加载所有模块

(function() {
    console.log('[PLUGIN] 开始加载插件模块');
    
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
            // 基础模块
            await loadModule('js/modules/http-server.js');
            await loadModule('js/modules/data-processor.js');  // 数据处理模块（已包含文件夹工具功能）
            await loadModule('js/modules/data-sync.js');       // 数据同步模块
            await loadModule('js/modules/api-handlers.js');
            await loadModule('js/modules/api-router.js');
            
            // 通信协调模块
            await loadModule('js/modules/communication.js');
            
            console.log('[PLUGIN] 所有模块加载完成');
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
})();