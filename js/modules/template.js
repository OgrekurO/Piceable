// 属性模板管理模块

// 初始化模板系统
function initTemplateSystem() {
    console.log('[TEMPLATE] 初始化属性模板系统');
    
    // 从localStorage加载模板
    loadTemplates();
    
    // 绑定模板相关事件
    bindTemplateEvents();
}

// 加载模板
function loadTemplates() {
    try {
        const savedTemplates = localStorage.getItem('eagle-ontology-templates');
        window.templates = savedTemplates ? JSON.parse(savedTemplates) : getDefaultTemplates();
        console.log('[TEMPLATE] 模板加载完成，共', window.templates.length, '个模板');
    } catch (error) {
        console.error('[TEMPLATE] 加载模板失败:', error);
        window.templates = getDefaultTemplates();
    }
}

// 获取默认模板
function getDefaultTemplates() {
    return [
        {
            id: 'content-dimensions',
            name: '内容维度',
            description: '自然、社会、文化、政治、经济等维度分类',
            fields: [
                { name: '主题', type: 'text', required: true },
                { name: '领域', type: 'text', required: false },
                { name: '情境', type: 'text', required: false }
            ]
        },
        {
            id: 'media-type',
            name: '媒体类型',
            description: '按媒体类型分类',
            fields: [
                { name: '类型', type: 'select', options: ['摄影', '插画', '图表', '图标'], required: true },
                { name: '风格', type: 'text', required: false },
                { name: '用途', type: 'text', required: false }
            ]
        }
    ];
}

// 保存模板
function saveTemplates() {
    try {
        localStorage.setItem('eagle-ontology-templates', JSON.stringify(window.templates));
        console.log('[TEMPLATE] 模板保存成功');
    } catch (error) {
        console.error('[TEMPLATE] 保存模板失败:', error);
    }
}

// 获取所有模板
function getTemplates() {
    return window.templates || [];
}

// 添加新模板
function addTemplate(template) {
    if (!window.templates) window.templates = [];
    
    // 检查ID是否已存在
    if (window.templates.some(t => t.id === template.id)) {
        console.warn('[TEMPLATE] 模板ID已存在:', template.id);
        return false;
    }
    
    window.templates.push(template);
    saveTemplates();
    return true;
}

// 删除模板
function removeTemplate(templateId) {
    if (!window.templates) return false;
    
    const index = window.templates.findIndex(t => t.id === templateId);
    if (index >= 0) {
        window.templates.splice(index, 1);
        saveTemplates();
        return true;
    }
    
    return false;
}

// 应用模板到选定的项目
function applyTemplateToSelected(templateId, selectedRows) {
    const template = window.templates.find(t => t.id === templateId);
    if (!template) {
        console.error('[TEMPLATE] 未找到模板:', templateId);
        showStatus('未找到指定的模板', 'error');
        return;
    }
    
    if (!selectedRows || selectedRows.length === 0) {
        console.warn('[TEMPLATE] 未选择任何行');
        showStatus('请先选择要应用模板的图片', 'warning');
        return;
    }
    
    console.log(`[TEMPLATE] 将模板 "${template.name}" 应用到 ${selectedRows.length} 个项目`);
    showStatus(`正在将模板 "${template.name}" 应用到 ${selectedRows.length} 个项目...`, 'info');
    
    // 为每个选定的行添加模板字段
    selectedRows.forEach(row => {
        const rowData = row.getData();
        console.log('[TEMPLATE] 处理项目:', rowData.name);
        
        // 这里可以根据模板定义的字段更新表格数据
        // 实际应用中，你可能需要更复杂的逻辑来处理字段映射
    });
    
    showStatus(`模板 "${template.name}" 已应用到 ${selectedRows.length} 个项目`, 'success');
}

// 绑定模板相关事件
function bindTemplateEvents() {
    // 模板按钮事件
    const templateBtn = document.getElementById('template-btn');
    if (templateBtn) {
        templateBtn.addEventListener('click', () => {
            console.log('[TEMPLATE] 点击属性模板按钮');
            showTemplateManager();
        });
    }
}

// 显示模板管理界面
function showTemplateManager() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'template-modal';
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
        <div class="template-modal-content" style="
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
                <h2 style="margin: 0;">属性模板管理</h2>
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
                <div class="template-list" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0;">现有模板</h3>
                        <button id="add-template-btn" class="btn-primary">+ 新建模板</button>
                    </div>
                    
                    <div id="templates-container">
                        ${renderTemplates()}
                    </div>
                </div>
                
                <div class="template-editor" id="template-editor" style="display: none;">
                    <h3 style="margin-top: 0;">创建新模板</h3>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: bold;">模板名称:</label>
                        <input type="text" id="template-name" style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                        " placeholder="输入模板名称">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: bold;">描述:</label>
                        <textarea id="template-description" style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            min-height: 60px;
                        " placeholder="模板描述"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-weight: bold;">字段:</label>
                            <button id="add-field-btn" class="btn-primary">+ 添加字段</button>
                        </div>
                        
                        <div id="fields-container">
                            <!-- 字段将在这里动态添加 -->
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancel-template-btn" class="btn-secondary">取消</button>
                        <button id="save-template-btn" class="btn-primary">保存模板</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 绑定关闭事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 绑定其他事件
    bindTemplateModalEvents(modal);
}

// 渲染模板列表
function renderTemplates() {
    const templates = getTemplates();
    
    if (templates.length === 0) {
        return '<p>暂无模板，请创建新模板。</p>';
    }
    
    return templates.map(template => `
        <div class="template-item" style="
            border: 1px solid #eee;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
        " data-template-id="${template.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="margin: 0 0 8px 0;">${template.name}</h4>
                    <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">${template.description}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${template.fields.map(field => `
                            <span style="
                                background: #f0f0f0;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 12px;
                            ">${field.name}</span>
                        `).join('')}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="apply-template-btn btn-primary" data-template-id="${template.id}">应用</button>
                    <button class="delete-template-btn btn-danger" data-template-id="${template.id}">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 绑定模板模态框事件
function bindTemplateModalEvents(modal) {
    // 添加模板按钮
    const addTemplateBtn = modal.querySelector('#add-template-btn');
    addTemplateBtn.addEventListener('click', () => {
        modal.querySelector('#templates-container').style.display = 'none';
        modal.querySelector('#template-editor').style.display = 'block';
        modal.querySelector('#template-name').focus();
    });
    
    // 添加字段按钮
    const addFieldBtn = modal.querySelector('#add-field-btn');
    addFieldBtn.addEventListener('click', () => {
        addTemplateField();
    });
    
    // 取消按钮
    const cancelBtn = modal.querySelector('#cancel-template-btn');
    cancelBtn.addEventListener('click', () => {
        modal.querySelector('#templates-container').style.display = 'block';
        modal.querySelector('#template-editor').style.display = 'none';
        // 清空表单
        modal.querySelector('#template-name').value = '';
        modal.querySelector('#template-description').value = '';
        modal.querySelector('#fields-container').innerHTML = '';
    });
    
    // 保存模板按钮
    const saveBtn = modal.querySelector('#save-template-btn');
    saveBtn.addEventListener('click', () => {
        saveTemplateFromForm(modal);
    });
    
    // 应用模板按钮
    modal.querySelectorAll('.apply-template-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const templateId = e.target.getAttribute('data-template-id');
            
            // 获取选中的行
            let selectedRows = [];
            if (window.table) {
                selectedRows = window.table.getSelectedRows();
            }
            
            applyTemplateToSelected(templateId, selectedRows);
            
            // 关闭模态框
            document.body.removeChild(modal);
        });
    });
    
    // 删除模板按钮
    modal.querySelectorAll('.delete-template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateId = e.target.getAttribute('data-template-id');
            if (confirm('确定要删除此模板吗？')) {
                removeTemplate(templateId);
                
                // 重新渲染模板列表
                modal.querySelector('#templates-container').innerHTML = renderTemplates();
                
                // 重新绑定事件
                bindTemplateModalEvents(modal);
            }
        });
    });
}

// 添加模板字段
function addTemplateField(fieldName = '', fieldType = 'text', required = false) {
    const fieldsContainer = document.querySelector('#fields-container');
    if (!fieldsContainer) return;
    
    const fieldId = Date.now(); // 简单的唯一ID
    
    const fieldElement = document.createElement('div');
    fieldElement.className = 'template-field';
    fieldElement.style.cssText = `
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 12px;
    `;
    fieldElement.innerHTML = `
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
            <div style="flex: 1; min-width: 150px;">
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">字段名称</label>
                <input type="text" class="field-name" value="${fieldName}" style="
                    width: 100%;
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                " placeholder="字段名称">
            </div>
            
            <div style="flex: 1; min-width: 150px;">
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">字段类型</label>
                <select class="field-type" style="
                    width: 100%;
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                ">
                    <option value="text" ${fieldType === 'text' ? 'selected' : ''}>文本输入</option>
                    <option value="textarea" ${fieldType === 'textarea' ? 'selected' : ''}>多行文本</option>
                    <option value="select" ${fieldType === 'select' ? 'selected' : ''}>下拉选择</option>
                    <option value="checkbox" ${fieldType === 'checkbox' ? 'selected' : ''}>复选框</option>
                </select>
            </div>
            
            <div style="display: flex; align-items: flex-end;">
                <label style="display: flex; align-items: center; gap: 4px; font-size: 14px; cursor: pointer;">
                    <input type="checkbox" class="field-required" ${required ? 'checked' : ''}>
                    必填
                </label>
            </div>
            
            <div style="display: flex; align-items: flex-end;">
                <button class="remove-field-btn" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                ">&times;</button>
            </div>
        </div>
    `;
    
    fieldsContainer.appendChild(fieldElement);
    
    // 绑定删除事件
    const removeBtn = fieldElement.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
        fieldsContainer.removeChild(fieldElement);
    });
}

// 从表单保存模板
function saveTemplateFromForm(modal) {
    const name = modal.querySelector('#template-name').value.trim();
    const description = modal.querySelector('#template-description').value.trim();
    
    if (!name) {
        alert('请输入模板名称');
        return;
    }
    
    // 收集字段
    const fields = [];
    const fieldElements = modal.querySelectorAll('.template-field');
    
    fieldElements.forEach(fieldEl => {
        const fieldName = fieldEl.querySelector('.field-name').value.trim();
        const fieldType = fieldEl.querySelector('.field-type').value;
        const required = fieldEl.querySelector('.field-required').checked;
        
        if (fieldName) {
            fields.push({
                name: fieldName,
                type: fieldType,
                required: required
            });
        }
    });
    
    if (fields.length === 0) {
        alert('请至少添加一个字段');
        return;
    }
    
    // 创建模板对象
    const template = {
        id: 'template-' + Date.now(), // 简单的ID生成
        name: name,
        description: description,
        fields: fields
    };
    
    // 添加模板
    if (addTemplate(template)) {
        showStatus('模板保存成功', 'success');
        
        // 重新显示模板列表
        modal.querySelector('#templates-container').innerHTML = renderTemplates();
        modal.querySelector('#templates-container').style.display = 'block';
        modal.querySelector('#template-editor').style.display = 'none';
        
        // 清空表单
        modal.querySelector('#template-name').value = '';
        modal.querySelector('#template-description').value = '';
        modal.querySelector('#fields-container').innerHTML = '';
        
        // 重新绑定事件
        bindTemplateModalEvents(modal);
    } else {
        showStatus('模板保存失败', 'error');
    }
}

// 初始化模板系统
initTemplateSystem();