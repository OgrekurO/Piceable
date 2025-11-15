// 刷新数据
async function refreshData() {
    try {
        const data = await loadEagleItems();
        if (window.table) {
            // 直接更新表格数据
            window.table.setData(data);
        }
    } catch (error) {
        console.error('[UI] 刷新数据失败:', error);
    }
}



// 初始化表格
function initializeTable() {
    // 确保表格容器存在
    const tableElement = document.getElementById('item-table');
    if (!tableElement) {
        console.error('[UI] 错误: 未找到表格容器元素 #item-table');
        showStatus('表格容器元素未找到', 'error');
        return;
    }
    
    // 销毁现有表格实例（如果存在）
    if (window.table) {
        window.table.destroy();
    }
    
    // 创建基础网格表格
    window.table = new Tabulator("#item-table", {
        data: window.tableData || [],
        layout: "fitColumns", // 使用fitColumns布局
        movableColumns: false, // 禁止移动列
        resizableRows: false, // 禁止调整行高
        sortable: false, // 禁止排序
        pagination: "local", // 启用本地分页
        paginationSize: 50, // 默认每页显示50条
        columns: [
            {
                title: "预览",
                field: "thumbnail",
                formatter: function(cell) {
                    const imageData = cell.getValue();
                    
                    if (imageData) {
                        return `<div class="image-cell"><img src="${imageData}" class="thumbnail" style="width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<div style=\'width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;\'>无预览</div>'"/></div>`;
                    } else {
                        return '<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;">无预览</div>';
                    }
                },
                hozAlign: "center",
                width: 100,
                headerSort: false
            },
            {
                title: "名称",
                field: "name",
                width: 200
            },
            {
                title: "文件夹",
                field: "folders",
                width: 150
            },
            {
                title: "标签",
                field: "tags",
                width: 200
            },
            {
                title: "注释",
                field: "annotation",
                width: 300
            },
            {
                title: "最后修改",
                field: "lastModified",
                width: 180
            }
        ]
    });
    
    // 使用轮询方式确保在表格完全初始化后再绑定事件
    function bindRowClickEvent() {
        if (window.table) {
            window.table.on("rowClick", function(e, row) {
                // 更新详情面板
                updateDetailsPanel(row.getData());
            });
        } else {
            setTimeout(bindRowClickEvent, 100);
        }
    }
    
    // 启动轮询
    bindRowClickEvent();
    
    // 绑定页码选择器事件
    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            const pageSize = parseInt(this.value);
            if (window.table) {
                window.table.setPageSize(pageSize);
            }
        });
    }
}

// 绑定分组控制事件
function bindGroupingControlEvents() {
    const groupingSelect = document.getElementById('grouping-select');
    if (groupingSelect && window.table) {
        groupingSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue) {
                // 设置分组
                window.table.setGroupBy(selectedValue);
                
                // 设置自定义组头
                window.table.setGroupHeader(function(value, count, data, group) {
                    return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " 项)</span>";
                });
            } else {
                // 清除分组
                window.table.setGroupBy(false);
            }
        });
    }
}

// 触发同步的函数
function triggerSyncIfNeeded() {
    window.hasUnsavedChanges = true;
    
    // 端到端延迟触发同步，确保数据已经更新到表格中
    setTimeout(async () => {
        showStatus('正在自动同步数据到Eagle...', 'info');
        await syncDataToEagle();
    }, 100);
}

// 导出数据到CSV
function exportToCSV() {
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
    } catch (error) {
        console.error('[UI] 导出CSV失败:', error);
        showStatus('导出CSV失败: ' + error.message, 'error');
    }
}
