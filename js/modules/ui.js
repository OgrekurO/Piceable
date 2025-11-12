// 初始化UI
function initUI() {
    console.log('[UI] 开始初始化UI');
    
    // 创建主容器
    let container = document.getElementById('eagle-ontology-manager');
    if (!container) {
        container = document.createElement('div');
        container.id = 'eagle-ontology-manager';
        document.body.appendChild(container);
        console.log('[UI] 创建了新的容器元素');
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建顶部工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
        <button id="refresh-btn" class="btn-primary">
            <i class="icon-refresh"></i>
            刷新
        </button>
        <div class="spacer"></div>
        <div class="search-box">
            <input type="text" id="search-input" placeholder="搜索项目...">
            <i class="icon-search"></i>
        </div>
    `;
    
    container.appendChild(toolbar);
    
    // 创建表格容器
    const tableContainer = document.createElement('div');
    tableContainer.id = 'table-container';
    tableContainer.className = 'table-container';
    container.appendChild(tableContainer);
    
    // 创建状态栏
    const statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    statusBar.className = 'status-bar';
    statusBar.textContent = '就绪';
    container.appendChild(statusBar);
    
    console.log('[UI] UI元素创建完成');
}

// 刷新数据
async function refreshData() {
    console.log('[UI] 点击刷新按钮');
    try {
        const data = await loadEagleItems();
        if (window.table) {
            window.table.setData(data);
            console.log('[UI] 表格数据刷新完成');
        }
    } catch (error) {
        console.error('[UI] 刷新数据失败:', error);
    }
}

// 过滤表格数据
function filterTable(keyword) {
    if (!window.table) {
        console.log('[UI] 表格未初始化');
        return;
    }
    
    if (!keyword) {
        // 如果没有关键词，显示所有数据
        window.table.clearFilter();
        return;
    }
    
    // 使用关键词过滤数据
    window.table.setFilter([
        {field: "name", type: "like", value: keyword},
        {field: "folders", type: "like", value: keyword},
        {field: "tags", type: "like", value: keyword},
        {field: "annotation", type: "like", value: keyword}
    ], "or");
}

// 绑定事件
function bindEvents() {
    console.log('[UI] 开始绑定事件');
    
    // 刷新按钮事件
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshData();
        });
    }
    
    // 导出CSV按钮事件
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            console.log('[UI] 点击导出CSV按钮');
            exportToCSV();
        });
    }
    
    // 数据可视化按钮事件（用于多级表头管理）
    const visualizationBtn = document.getElementById('visualization-btn');
    if (visualizationBtn) {
        // 启用按钮
        visualizationBtn.disabled = false;
        visualizationBtn.addEventListener('click', () => {
            console.log('[UI] 点击数据可视化按钮');
            // 显示多级表头管理界面
            if (typeof showMultiHeaderManager === 'function') {
                showMultiHeaderManager();
            } else {
                console.error('[UI] showMultiHeaderManager 函数未定义');
                showStatus('多级表头管理功能不可用', 'error');
            }
        });
    }
    
    // 搜索框事件
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const keyword = e.target.value.trim();
                console.log('[UI] 搜索关键词:', keyword);
                filterTable(keyword);
            }, 300);
        });
    }
    
    console.log('[UI] 事件绑定完成');
}

// 初始化表格
function initializeTable() {
    console.log('[UI] 开始初始化表格');
    
    // 确保表格容器存在
    const tableElement = document.getElementById('item-table');
    if (!tableElement) {
        console.error('[UI] 错误: 未找到表格容器元素 #item-table');
        showStatus('表格容器元素未找到', 'error');
        return;
    }
    
    console.log('[UI] 表格容器元素存在，开始创建Tabulator实例');
    
    window.table = new Tabulator("#item-table", {
        data: window.tableData,
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 20,
        paginationSizeSelector: [10, 20, 50, 100],
        movableColumns: true,
        resizableRows: true,
        columns: [
            {
                title: "基础信息",
                columns: [
                    {
                        title: "预览",
                        field: "thumbnail",
                        formatter: function(cell) {
                            const imageData = cell.getValue();
                            
                            if (imageData) {
                                // 使用img标签并添加错误处理
                                return `<img src="${imageData}" class="thumbnail" onerror="this.parentElement.innerHTML='<div style=\'width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;\'>无预览</div>'"/>`;
                            } else {
                                return '<div style="width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;">无预览</div>';
                            }
                        },
                        hozAlign: "center",
                        width: 80,
                        headerSort: false
                    },
                    {
                        title: "名称",
                        field: "name",
                        editor: function(cell, onRendered, success, cancel) {
                            // 创建输入框
                            var input = document.createElement("input");
                            input.setAttribute("type", "text");
                            input.style.padding = "4px";
                            input.style.width = "100%";
                            input.style.boxSizing = "border-box";
                            
                            // 设置初始值
                            input.value = cell.getValue();
                            
                            // 当输入框失去焦点时保存值
                            input.addEventListener("blur", function() {
                                console.log('[EDIT] 自定义编辑器 - 失去焦点，保存值:', input.value);
                                success(input.value);
                                // 触发同步
                                triggerSyncIfNeeded();
                            });
                            
                            // 当按下Enter键时保存值
                            input.addEventListener("keydown", function(e) {
                                if (e.key === "Enter") {
                                    console.log('[EDIT] 自定义编辑器 - 按下Enter，保存值:', input.value);
                                    e.preventDefault(); // 阻止默认行为
                                    success(input.value);
                                    // 触发同步
                                    triggerSyncIfNeeded();
                                }
                                if (e.key === "Escape") {
                                    console.log('[EDIT] 自定义编辑器 - 按下Escape，取消编辑');
                                    cancel();
                                }
                            });
                            
                            // 在编辑器渲染后聚焦到输入框
                            onRendered(function() {
                                console.log('[EDIT] 自定义编辑器 - 开始编辑，原值:', cell.getValue());
                                input.focus();
                            });
                            
                            return input;
                        },
                        validator: ["required"],
                        width: 200
                    }
                ]
            },
            {
                title: "Eagle信息",
                columns: [
                    {
                        title: "文件夹",
                        field: "folders",
                        editor: "input",
                        width: 150
                    },
                    {
                        title: "标签",
                        field: "tags",
                        editor: "input",
                        width: 200
                    },
                    {
                        title: "注释",
                        field: "annotation",
                        editor: "textarea",
                        formatter: "textarea",
                        width: 300,
                        cellClick: function(e, cell) {
                            console.log('[EDIT] 注释单元格被点击，ID:', cell.getRow().getData().id);
                        },
                        cellDblClick: function(e, cell) {
                            console.log('[EDIT] 注释单元格被双击，尝试进入编辑状态');
                            cell.edit(); // 尝试手动触发编辑
                        }
                    },
                    {
                        title: "最后修改",
                        field: "lastModified",
                        width: 180,
                        sorter: "date"
                    }
                ]
            }
            // 动态列将在tableBuilt事件中添加
        ],
        cellEditing: function(cell) {
            // 单元格开始编辑事件 - 增强版调试信息
            const row = cell.getRow();
            const rowData = row.getData();
            console.log('[EDIT] 开始编辑单元格:', {
                field: cell.getField(),
                oldValue: cell.getValue(),
                oldValueType: typeof cell.getValue(),
                id: rowData.id,
                name: rowData.name,
                folder: rowData.folders,
                timestamp: new Date().toISOString()
            });
        },
        cellEdited: function(cell) {
            // 单元格编辑完成事件
            console.log('[EDIT] 单元格编辑完成:', cell.getField(), '新值:', cell.getValue(), '行ID:', cell.getRow().getData().id);
            window.hasUnsavedChanges = true;
            
            // 自动同步数据到Eagle，无需点击同步按钮
            setTimeout(async () => {
                console.log('[SYNC] 开始自动同步数据到Eagle');
                showStatus('正在自动同步数据到Eagle...', 'info');
                await syncDataToEagle();
                console.log('[SYNC] 数据同步完成');
            }, 100);
        },
        cellEditCancelled: function(cell) {
            // 单元格编辑取消事件 - 增强版调试信息
            const row = cell.getRow();
            const rowData = row.getData();
            console.log('[EDIT] 单元格编辑已取消:', {
                field: cell.getField(),
                value: cell.getValue(),
                id: rowData.id,
                name: rowData.name
            });
        },
        tableBuilt: function() {
            // 表格构建完成后添加动态列（基于文件夹结构）
            console.log('[UI] 表格构建完成，添加动态列');
            console.log('[UI] 当前window.dynamicColumns:', window.dynamicColumns);
            if (window.dynamicColumns && window.dynamicColumns.length > 0) {
                // 获取当前列定义
                const currentColumns = this.getColumnDefinitions();
                console.log('[UI] 当前列定义:', currentColumns);
                
                // 添加动态列
                const allColumns = [...currentColumns, ...window.dynamicColumns];
                console.log('[UI] 合并后的列定义:', allColumns);
                this.setColumns(allColumns);
                console.log('[UI] 动态列添加完成');
            } else {
                console.log('[UI] 没有动态列需要添加');
            }
        }
    });
    
    console.log('[UI] 表格初始化完成');
}

// 触发同步的函数
function triggerSyncIfNeeded() {
    console.log('[SYNC] 手动触发同步检查');
    window.hasUnsavedChanges = true;
    
    // 端到端延迟触发同步，确保数据已经更新到表格中
    setTimeout(async () => {
        console.log('[SYNC] 开始自动同步数据到Eagle');
        showStatus('正在自动同步数据到Eagle...', 'info');
        await syncDataToEagle();
        console.log('[SYNC] 数据同步完成');
    }, 100);
}

// 导出数据到CSV
function exportToCSV() {
    console.log('[UI] 开始导出CSV');
    showStatus('正在导出CSV文件...', 'info');
    
    try {
        // 检查表格是否存在
        if (!window.table) {
            console.error('[UI] 表格未初始化');
            showStatus('表格未初始化，无法导出', 'error');
            return;
        }
        
        // 获取表格数据
        const tableData = window.table.getData();
        console.log(`[UI] 获取到 ${tableData.length} 条数据`);
        
        if (tableData.length === 0) {
            showStatus('没有数据可导出', 'warning');
            return;
        }
        
        // 使用Tabulator内置的CSV下载功能
        window.table.download("csv", "eagle-ontology-data.csv", {
            delimiter: ",",
            bom: true
        });
        
        showStatus(`成功导出 ${tableData.length} 条数据到CSV文件`, 'success');
        console.log('[UI] CSV导出完成');
    } catch (error) {
        console.error('[UI] 导出CSV失败:', error);
        showStatus('导出CSV失败: ' + error.message, 'error');
    }
}
