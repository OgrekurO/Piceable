// 多级表头管理模块

// 初始化多级表头系统
function initMultiHeaderSystem() {
    console.log('[MULTIHEADER] 初始化多级表头系统');
    
    // 绑定多级表头相关事件
    bindMultiHeaderEvents();
}

// 绑定多级表头相关事件
function bindMultiHeaderEvents() {
    console.log('[MULTIHEADER] 绑定多级表头事件');
    
    // 如果在HTML中添加了多级表头管理按钮，则在这里绑定事件
    // 暂时先留空，后续可以根据需要添加
}

// 创建示例多级表头结构
function createSampleMultiHeaderStructure() {
    // 示例：灯具本体 -> [发光体类型, 变压器, 电线与接头]
    const multiHeaderConfig = [
        { 
            title: "基本信息",
            columns: [
                { title: "预览", field: "thumbnail", formatter: "image", formatterParams: { height: "50px", width: "50px" }, hozAlign: "center", width: 80 },
                { title: "名称", field: "name", editor: "input", width: 200 }
            ]
        },
        {
            title: "灯具本体", 
            columns: [
                { title: "发光体类型", field: "lightType", editor: "input", width: 150 },
                { title: "变压器", field: "transformer", editor: "input", width: 150 },
                { title: "电线与接头", field: "wires", editor: "input", width: 150 }
            ]
        },
        {
            title: "安装信息",
            columns: [
                { 
                    title: "位置信息",
                    columns: [
                        { title: "安装位置", field: "location", editor: "input", width: 150 },
                        { title: "安装房间", field: "room", editor: "input", width: 150 }
                    ]
                },
                { 
                    title: "尺寸信息", 
                    columns: [
                        { title: "安装高度", field: "height", editor: "input", width: 150 },
                        { title: "投影面积", field: "area", editor: "input", width: 150 }
                    ]
                }
            ]
        },
        {
            title: "其他信息",
            columns: [
                { title: "文件夹", field: "folders", editor: "input", width: 150 },
                { title: "标签", field: "tags", editor: "input", width: 200 },
                { title: "注释", field: "annotation", editor: "textarea", formatter: "textarea", width: 300 },
                { title: "最后修改", field: "lastModified", width: 180 }
            ]
        }
    ];
    
    return multiHeaderConfig;
}

// 应用多级表头到表格
function applyMultiHeadersToTable(table, headerConfig) {
    if (!table || !headerConfig) {
        console.error('[MULTIHEADER] 表格或表头配置无效');
        return;
    }
    
    try {
        // 构建新的列定义，包含多级表头
        const columnDefinition = [];
        
        // 递归处理列定义，支持多级嵌套
        function processColumns(columns) {
            return columns.map(column => {
                // 如果是包含子列的组
                if (column.columns && Array.isArray(column.columns) && column.columns.length > 0) {
                    return {
                        title: column.title,
                        columns: processColumns(column.columns)
                    };
                } else {
                    // 普通列
                    return {
                        title: column.title,
                        field: column.field,
                        editor: column.editor,
                        formatter: column.formatter,
                        width: column.width,
                        headerSort: column.headerSort
                    };
                }
            });
        }
        
        // 按照配置添加列组
        headerConfig.forEach(group => {
            if (group.columns && Array.isArray(group.columns) && group.columns.length > 0) {
                // 创建列组
                const columnGroup = {
                    title: group.title,
                    columns: processColumns(group.columns)
                };
                
                // 如果有额外的列组属性，也添加进去
                Object.keys(group).forEach(key => {
                    if (key !== 'title' && key !== 'columns') {
                        columnGroup[key] = group[key];
                    }
                });
                
                columnDefinition.push(columnGroup);
            }
        });
        
        // 添加动态列（基于文件夹结构）
        if (window.dynamicColumns && window.dynamicColumns.length > 0) {
            columnDefinition.push(...window.dynamicColumns);
        }
        
        // 应用新的列定义到表格
        // 先检查表格是否已初始化
        if (table.setColumns) {
            table.setColumns(columnDefinition);
            console.log('[MULTIHEADER] 多级表头应用成功');
        } else {
            console.error('[MULTIHEADER] 表格未正确初始化');
        }
        
    } catch (error) {
        console.error('[MULTIHEADER] 应用多级表头时出错:', error);
    }
}

// 获取默认的多级表头配置
function getDefaultMultiHeaderConfig() {
    // 基于新的数据结构，固定的基础信息和Eagle信息列
    const fixedColumns = [
        { 
            title: "基础信息",
            columns: [
                { title: "预览", field: "thumbnail", formatter: "image", formatterParams: { height: "50px", width: "50px" }, hozAlign: "center", width: 80 },
                { title: "名称", field: "name", editor: "input", width: 200 }
            ]
        },
        {
            title: "Eagle信息",
            columns: [
                { title: "文件夹", field: "folders", editor: "input", width: 150 },
                { title: "标签", field: "tags", editor: "input", width: 200 },
                { title: "注释", field: "annotation", editor: "textarea", formatter: "textarea", width: 300 },
                { title: "最后修改", field: "lastModified", width: 180 }
            ]
        }
    ];
    
    return fixedColumns;
}

// 保存多级表头配置
function saveMultiHeaderConfig(config) {
    try {
        localStorage.setItem('eagle-ontology-multiheader-config', JSON.stringify(config));
        console.log('[MULTIHEADER] 多级表头配置已保存');
        return true;
    } catch (error) {
        console.error('[MULTIHEADER] 保存多级表头配置失败:', error);
        return false;
    }
}

// 加载多级表头配置
function loadMultiHeaderConfig() {
    try {
        const savedConfig = localStorage.getItem('eagle-ontology-multiheader-config');
        if (savedConfig) {
            console.log('[MULTIHEADER] 多级表头配置已加载');
            return JSON.parse(savedConfig);
        }
    } catch (error) {
        console.error('[MULTIHEADER] 加载多级表头配置失败:', error);
    }
    
    // 返回默认配置
    return getDefaultMultiHeaderConfig();
}

// 显示多级表头管理界面
function showMultiHeaderManager() {
    // 获取当前配置
    const currentConfig = loadMultiHeaderConfig();
    
    // 检查是否已经存在模态框，如果存在则先移除
    const existingModal = document.querySelector('.multiheader-modal');
    if (existingModal && document.body.contains(existingModal)) {
        document.body.removeChild(existingModal);
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'multiheader-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="multiheader-modal-content" style="
            background: white;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 80%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        ">
            <div class="modal-header" style="
                padding: 16px 24px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h2 style="margin: 0;">多级表头管理</h2>
                <button class="close-btn" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
            </div>
            
            <div class="modal-body" style="
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            ">
                <div class="header-config-info" style="margin-bottom: 24px; padding: 16px; background: #f0f8ff; border-radius: 4px;">
                    <p style="margin: 0;">您可以在此配置多级表头结构。每个组代表一行表头，组内的列代表该组下的子列。</p>
                </div>
                
                <div class="header-groups" id="header-groups-container">
                    ${renderHeaderGroups(currentConfig)}
                </div>
                
                <div style="margin-top: 24px; display: flex; gap: 12px;">
                    <button id="add-group-btn" class="btn-primary" style="background: #4285f4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        + 添加表头组
                    </button>
                    <button id="save-config-btn" class="btn-success" style="background: #34a853; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: auto;">
                        保存配置并应用
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 绑定事件
    bindMultiHeaderModalEvents(modal, currentConfig);
}

// 渲染表头组
function renderHeaderGroups(config) {
    return config.map((group, groupIndex) => `
        <div class="header-group" data-group-index="${groupIndex}" style="
            border: 1px solid #eee;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <input type="text" class="group-title" value="${group.title || ''}" placeholder="组名称" style="
                    font-weight: bold;
                    font-size: 16px;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    flex: 1;
                    margin-right: 12px;
                ">
                <div>
                    <button class="toggle-group-btn" data-group-index="${groupIndex}" style="
                        background: #f1f1f1;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 8px;
                    ">折叠</button>
                    <button class="remove-group-btn" style="
                        background: #ea4335;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">删除组</button>
                </div>
            </div>
            
            <div class="group-columns" style="margin-top: 12px;">
                ${renderGroupColumns(group.columns, groupIndex)}
            </div>
            
            <div style="margin-top: 12px;">
                <button class="add-column-btn" data-group-index="${groupIndex}" style="
                    background: #4285f4;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">+ 添加列</button>
                <button class="add-subgroup-btn" data-group-index="${groupIndex}" style="
                    background: #34a853;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 8px;
                ">+ 添加子组</button>
            </div>
        </div>
    `).join('');
}

// 渲染组内列（支持嵌套组）
function renderGroupColumns(columns, groupIndex, parentPath = '') {
    return columns.map((column, columnIndex) => {
        const currentPath = parentPath ? `${parentPath}-${columnIndex}` : `${groupIndex}-${columnIndex}`;
        
        // 如果是嵌套组
        if (column.columns && Array.isArray(column.columns)) {
            return `
                <div class="nested-group" data-path="${currentPath}" style="
                    border: 1px dashed #ccc;
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: #f5f5f5;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <input type="text" class="nested-group-title" data-path="${currentPath}" value="${column.title || ''}" placeholder="子组名称" style="
                            font-weight: bold;
                            padding: 4px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            flex: 1;
                            margin-right: 8px;
                        ">
                        <button class="remove-nested-group-btn" data-path="${currentPath}" style="
                            background: #ea4335;
                            color: white;
                            border: none;
                            padding: 4px 8px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        ">&times;</button>
                    </div>
                    <div class="nested-columns" style="margin-left: 16px;">
                        ${renderGroupColumns(column.columns, groupIndex, currentPath)}
                    </div>
                    <div style="margin-top: 8px;">
                        <button class="add-nested-column-btn" data-path="${currentPath}" style="
                            background: #4285f4;
                            color: white;
                            border: none;
                            padding: 4px 8px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        ">+ 添加子列</button>
                    </div>
                </div>
            `;
        } else {
            // 普通列
            return `
                <div class="group-column" data-path="${currentPath}" style="
                    display: flex;
                    gap: 12px;
                    margin-bottom: 8px;
                    padding: 8px;
                    background: #f9f9f9;
                    border-radius: 4px;
                ">
                    <input type="text" class="column-title" data-path="${currentPath}" value="${column.title || ''}" placeholder="列标题" style="
                        flex: 1;
                        padding: 6px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    ">
                    <input type="text" class="column-field" data-path="${currentPath}" value="${column.field || ''}" placeholder="字段名" style="
                        flex: 1;
                        padding: 6px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    ">
                    <button class="remove-column-btn" data-path="${currentPath}" style="
                        background: #ea4335;
                        color: white;
                        border: none;
                        padding: 6px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">&times;</button>
                </div>
            `;
        }
    }).join('');
}

// 绑定多级表头模态框事件
function bindMultiHeaderModalEvents(modal, config) {
    // 使用事件委托来处理动态添加的元素，避免重复绑定事件
    
    // 关闭按钮和点击背景关闭
    modal.addEventListener('click', (e) => {
        // 关闭按钮
        if (e.target.classList.contains('close-btn')) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
        
        // 点击背景关闭
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
    
    // 折叠/展开组
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-group-btn')) {
            const groupIndex = parseInt(e.target.getAttribute('data-group-index'));
            const groupElement = modal.querySelector(`.header-group[data-group-index="${groupIndex}"]`);
            const columnsContainer = groupElement.querySelector('.group-columns');
            const isCollapsed = columnsContainer.style.display === 'none';
            
            columnsContainer.style.display = isCollapsed ? 'block' : 'none';
            e.target.textContent = isCollapsed ? '折叠' : '展开';
        }
    });
    
    // 添加组按钮
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'add-group-btn') {
            config.push({
                title: "新组",
                columns: [
                    { title: "新列1", field: "newField1", editor: "input", width: 150 },
                    { title: "新列2", field: "newField2", editor: "input", width: 150 }
                ]
            });
            
            const container = modal.querySelector('#header-groups-container');
            if (container) {
                container.innerHTML = renderHeaderGroups(config);
            }
        }
    });
    
    // 删除组按钮
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-group-btn')) {
            const groupElement = e.target.closest('.header-group');
            if (groupElement) {
                const groupIndex = parseInt(groupElement.getAttribute('data-group-index'));
                config.splice(groupIndex, 1);
                
                const container = modal.querySelector('#header-groups-container');
                if (container) {
                    container.innerHTML = renderHeaderGroups(config);
                }
            }
        }
    });
    
    // 添加子组按钮
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-subgroup-btn')) {
            const groupIndex = parseInt(e.target.getAttribute('data-group-index'));
            
            if (!config[groupIndex].columns) {
                config[groupIndex].columns = [];
            }
            
            config[groupIndex].columns.push({
                title: "新子组",
                columns: [
                    { title: "子列1", field: "subField1", editor: "input", width: 150 },
                    { title: "子列2", field: "subField2", editor: "input", width: 150 }
                ]
            });
            
            const container = modal.querySelector('#header-groups-container');
            if (container) {
                container.innerHTML = renderHeaderGroups(config);
            }
        }
    });
    
    // 添加列按钮
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-column-btn')) {
            const groupIndex = parseInt(e.target.getAttribute('data-group-index'));
            
            if (!config[groupIndex].columns) {
                config[groupIndex].columns = [];
            }
            
            config[groupIndex].columns.push({
                title: "新列",
                field: `newField${Date.now()}`,
                editor: "input",
                width: 150
            });
            
            const container = modal.querySelector('#header-groups-container');
            if (container) {
                container.innerHTML = renderHeaderGroups(config);
            }
        }
    });
    
    // 添加嵌套列按钮
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-nested-column-btn')) {
            const path = e.target.getAttribute('data-path');
            const pathParts = path.split('-').map(Number);
            
            // 根据路径找到对应的嵌套组
            let targetGroup = config[pathParts[0]];
            for (let i = 1; i < pathParts.length; i++) {
                targetGroup = targetGroup.columns[pathParts[i]];
            }
            
            if (!targetGroup.columns) {
                targetGroup.columns = [];
            }
            
            targetGroup.columns.push({
                title: "新子列",
                field: `subField${Date.now()}`,
                editor: "input",
                width: 150
            });
            
            const container = modal.querySelector('#header-groups-container');
            if (container) {
                container.innerHTML = renderHeaderGroups(config);
            }
        }
    });
    
    // 删除列/子组按钮
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-column-btn') || 
            e.target.classList.contains('remove-nested-group-btn')) {
            const path = e.target.getAttribute('data-path');
            const pathParts = path.split('-').map(Number);
            
            // 找到父级并删除对应项
            if (pathParts.length === 2) {
                // 顶层组的列
                const groupIndex = pathParts[0];
                const columnIndex = pathParts[1];
                config[groupIndex].columns.splice(columnIndex, 1);
            } else {
                // 嵌套组的列
                let parentGroup = config[pathParts[0]];
                for (let i = 1; i < pathParts.length - 1; i++) {
                    parentGroup = parentGroup.columns[pathParts[i]];
                }
                const columnIndex = pathParts[pathParts.length - 1];
                parentGroup.columns.splice(columnIndex, 1);
            }
            
            const container = modal.querySelector('#header-groups-container');
            if (container) {
                container.innerHTML = renderHeaderGroups(config);
            }
        }
    });
    
    // 组标题输入框
    modal.addEventListener('input', (e) => {
        if (e.target.classList.contains('group-title')) {
            const groupElement = e.target.closest('.header-group');
            if (groupElement) {
                const groupIndex = parseInt(groupElement.getAttribute('data-group-index'));
                config[groupIndex].title = e.target.value;
            }
        }
    });
    
    // 嵌套组标题输入框
    modal.addEventListener('input', (e) => {
        if (e.target.classList.contains('nested-group-title')) {
            const path = e.target.getAttribute('data-path');
            const pathParts = path.split('-').map(Number);
            
            // 根据路径找到对应的嵌套组并更新标题
            let targetGroup = config[pathParts[0]];
            for (let i = 1; i < pathParts.length; i++) {
                targetGroup = targetGroup.columns[pathParts[i]];
            }
            targetGroup.title = e.target.value;
        }
    });
    
    // 列标题输入框
    modal.addEventListener('input', (e) => {
        if (e.target.classList.contains('column-title')) {
            const path = e.target.getAttribute('data-path');
            const pathParts = path.split('-').map(Number);
            
            // 根据路径找到对应的列并更新标题
            let targetColumn = config[pathParts[0]];
            for (let i = 1; i < pathParts.length; i++) {
                targetColumn = targetColumn.columns[pathParts[i]];
            }
            targetColumn.title = e.target.value;
        }
    });
    
    // 字段名输入框
    modal.addEventListener('input', (e) => {
        if (e.target.classList.contains('column-field')) {
            const path = e.target.getAttribute('data-path');
            const pathParts = path.split('-').map(Number);
            
            // 根据路径找到对应的列并更新字段名
            let targetColumn = config[pathParts[0]];
            for (let i = 1; i < pathParts.length; i++) {
                targetColumn = targetColumn.columns[pathParts[i]];
            }
            targetColumn.field = e.target.value;
        }
    });
    
    // 保存配置按钮
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'save-config-btn') {
            // 保存配置
            if (saveMultiHeaderConfig(config)) {
                showStatus('多级表头配置已保存', 'success');
                
                // 如果表格已存在，应用新的配置
                if (window.table) {
                    applyMultiHeadersToTable(window.table, config);
                }
                
                // 关闭模态框
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            } else {
                showStatus('保存配置失败', 'error');
            }
        }
    });
}

// 初始化多级表头系统
initMultiHeaderSystem();