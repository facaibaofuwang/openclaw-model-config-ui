// OpenClaw Model Config UI - Enhanced Version
let currentConfig = null;

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const success = document.getElementById('success');
const mainContent = document.getElementById('mainContent');
const currentModel = document.getElementById('currentModel');
const modelList = document.getElementById('modelList');
const providerList = document.getElementById('providerList');
const addProviderForm = document.getElementById('addProviderForm');

// Initialize
function init() {
    setupTabs();
    setupForms();
    loadConfig();
}

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
}

// Setup forms
function setupForms() {
    addProviderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addProvider();
    });
}

// Load configuration from file
async function loadConfig() {
    updateStatus('loading', '正在加载配置...');

    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('无法加载配置');
        }
        currentConfig = await response.json();
        updateStatus('connected', '配置已加载');
        displayConfig();
    } catch (e) {
        console.error('Failed to load config:', e);
        updateStatus('error', '加载失败');
        showError('无法加载配置文件: ' + e.message);
    }
}

// Add new provider
async function addProvider() {
    const providerName = document.getElementById('providerName').value.trim();
    const apiType = document.getElementById('apiType').value;
    const baseUrl = document.getElementById('baseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!providerName || !baseUrl) {
        showError('请填写必填字段');
        return;
    }

    try {
        const response = await fetch('/api/add-provider', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                providerName,
                apiType,
                baseUrl,
                apiKey
            })
        });

        if (!response.ok) {
            throw new Error('添加失败');
        }

        const result = await response.json();
        if (result.success) {
            showSuccess('供应商添加成功: ' + providerName);
            addProviderForm.reset();
            setTimeout(() => loadConfig(), 1000);
        } else {
            throw new Error(result.error || '添加失败');
        }
    } catch (e) {
        console.error('Failed to add provider:', e);
        showError('添加供应商失败: ' + e.message);
    }
}

// Add model to provider
function addModel(providerName) {
    openModelModal('add', providerName);
}

// Edit model
function editModel(providerName, model) {
    openModelModal('edit', providerName, model);
}

// Open model modal
function openModelModal(mode, providerName, model = null) {
    const modal = document.getElementById('modelModal');
    const title = document.getElementById('modalTitle');
    const providerInput = document.getElementById('modelProvider');
    const originalIdInput = document.getElementById('originalModelId');
    const idInput = document.getElementById('modelId');
    const nameInput = document.getElementById('modelName');
    const contextInput = document.getElementById('contextWindow');
    const maxInput = document.getElementById('maxTokens');
    const reasoningSelect = document.getElementById('reasoning');
    const costInputInput = document.getElementById('costInput');
    const costOutputInput = document.getElementById('costOutput');

    // Set title
    title.textContent = mode === 'add' ? '添加模型' : '编辑模型';

    // Set provider
    providerInput.value = providerName;
    originalIdInput.value = model ? model.id : '';

    if (model) {
        // Edit mode - fill with existing data
        idInput.value = model.id;
        nameInput.value = model.name || model.id;
        contextInput.value = model.contextWindow || 128000;
        maxInput.value = model.maxTokens || 4096;
        reasoningSelect.value = model.reasoning ? 'true' : 'false';
        costInputInput.value = model.cost?.input || 0;
        costOutputInput.value = model.cost?.output || 0;
    } else {
        // Add mode - clear form
        idInput.value = '';
        nameInput.value = '';
        contextInput.value = 128000;
        maxInput.value = 4096;
        reasoningSelect.value = 'false';
        costInputInput.value = 0;
        costOutputInput.value = 0;
    }

    modal.classList.add('active');
}

// Close model modal
function closeModelModal() {
    const modal = document.getElementById('modelModal');
    modal.classList.remove('active');
}

// Save model (add or edit)
async function saveModel() {
    const providerName = document.getElementById('modelProvider').value;
    const originalModelId = document.getElementById('originalModelId').value;
    const modelId = document.getElementById('modelId').value.trim();
    const modelName = document.getElementById('modelName').value.trim();
    const contextWindow = parseInt(document.getElementById('contextWindow').value) || 128000;
    const maxTokens = parseInt(document.getElementById('maxTokens').value) || 4096;
    const reasoning = document.getElementById('reasoning').value === 'true';
    const costInput = parseFloat(document.getElementById('costInput').value) || 0;
    const costOutput = parseFloat(document.getElementById('costOutput').value) || 0;

    if (!modelId) {
        showError('请填写模型 ID');
        return;
    }

    try {
        const response = await fetch('/api/save-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                providerName,
                originalModelId,
                model: {
                    id: modelId,
                    name: modelName || modelId,
                    reasoning,
                    input: ['text'],
                    cost: {
                        input: costInput,
                        output: costOutput,
                        cacheRead: 0,
                        cacheWrite: 0
                    },
                    contextWindow,
                    maxTokens
                }
            })
        });

        if (!response.ok) {
            throw new Error('保存失败');
        }

        const result = await response.json();
        if (result.success) {
            showSuccess(result.message || '模型保存成功');
            closeModelModal();
            setTimeout(() => loadConfig(), 1000);
        } else {
            throw new Error(result.error || '保存失败');
        }
    } catch (e) {
        console.error('Failed to save model:', e);
        showError('保存模型失败: ' + e.message);
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modelModal');
    if (e.target === modal) {
        closeModelModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModelModal();
    }
});

// Delete provider
async function deleteProvider(providerName) {
    if (!confirm(`确定要删除供应商 "${providerName}" 吗？`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete-provider', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ providerName })
        });

        if (!response.ok) {
            throw new Error('删除失败');
        }

        const result = await response.json();
        if (result.success) {
            showSuccess('供应商已删除');
            setTimeout(() => loadConfig(), 1000);
        } else {
            throw new Error(result.error || '删除失败');
        }
    } catch (e) {
        console.error('Failed to delete provider:', e);
        showError('删除供应商失败: ' + e.message);
    }
}

// Delete model
async function deleteModel(providerName, modelId) {
    if (!confirm(`确定要删除模型 "${modelId}" 吗？`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ providerName, modelId })
        });

        if (!response.ok) {
            throw new Error('删除失败');
        }

        const result = await response.json();
        if (result.success) {
            showSuccess('模型已删除');
            setTimeout(() => loadConfig(), 1000);
        } else {
            throw new Error(result.error || '删除失败');
        }
    } catch (e) {
        console.error('Failed to delete model:', e);
        showError('删除模型失败: ' + e.message);
    }
}

// Update model configuration
async function updateModel(modelId) {
    try {
        const response = await fetch('/api/update-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modelId })
        });

        if (!response.ok) {
            throw new Error('更新失败');
        }

        const result = await response.json();
        if (result.success) {
            showSuccess('模型已切换到: ' + modelId);
            setTimeout(() => loadConfig(), 1000);
        } else {
            throw new Error(result.error || '更新失败');
        }
    } catch (e) {
        console.error('Failed to update model:', e);
        showError('更新模型失败: ' + e.message);
    }
}

// Update status indicator
function updateStatus(status, text) {
    statusText.textContent = text;
    statusIndicator.classList.remove('connected');

    if (status === 'connected') {
        statusIndicator.classList.add('connected');
    }
}

// Display configuration
function displayConfig() {
    if (!currentConfig) {
        showError('无法加载配置');
        return;
    }

    loading.style.display = 'none';
    mainContent.style.display = 'block';

    // Display current model
    displayCurrentModel();

    // Display available models
    displayAvailableModels();

    // Display providers
    displayProviders();
}

// Display current model
function displayCurrentModel() {
    const primaryModel = currentConfig.agents?.defaults?.model?.primary || '未设置';
    const models = currentConfig.models?.providers || {};

    let modelInfo = null;
    for (const provider in models) {
        const providerModels = models[provider].models || [];
        const found = providerModels.find(m => {
            const fullId = `${provider}/${m.id}`;
            return fullId === primaryModel || m.id === primaryModel;
        });
        if (found) {
            modelInfo = {
                ...found,
                provider: provider,
                fullId: `${provider}/${found.id}`
            };
            break;
        }
    }

    if (modelInfo) {
        currentModel.innerHTML = `
            <h3>🎯 当前模型</h3>
            <div class="info">
                <div class="info-item">
                    <label>模型名称</label>
                    <span>${modelInfo.name || modelInfo.id}</span>
                </div>
                <div class="info-item">
                    <label>提供商</label>
                    <span>${modelInfo.provider}</span>
                </div>
                <div class="info-item">
                    <label>模型 ID</label>
                    <span>${modelInfo.fullId}</span>
                </div>
                <div class="info-item">
                    <label>上下文窗口</label>
                    <span>${modelInfo.contextWindow || 'N/A'} tokens</span>
                </div>
                <div class="info-item">
                    <label>最大输出</label>
                    <span>${modelInfo.maxTokens || 'N/A'} tokens</span>
                </div>
                <div class="info-item">
                    <label>推理模式</label>
                    <span>${modelInfo.reasoning ? '是' : '否'}</span>
                </div>
            </div>
        `;
    } else {
        currentModel.innerHTML = `
            <h3>🎯 当前模型</h3>
            <p>${primaryModel}</p>
        `;
    }
}

// Display available models
function displayAvailableModels() {
    const models = currentConfig.models?.providers || {};
    const primaryModel = currentConfig.agents?.defaults?.model?.primary || '';

    modelList.innerHTML = '';

    for (const provider in models) {
        const providerModels = models[provider].models || [];
        const providerInfo = models[provider];

        providerModels.forEach(model => {
            const fullId = `${provider}/${model.id}`;
            const isActive = fullId === primaryModel || model.id === primaryModel;

            const card = document.createElement('div');
            card.className = `model-card ${isActive ? 'active' : ''}`;
            card.innerHTML = `
                <h3>${model.name || model.id}</h3>
                <div class="provider">📦 ${provider}</div>
                <div class="details">
                    <div>🆔 ${model.id}</div>
                    <div>📊 上下文: ${model.contextWindow || 'N/A'} tokens</div>
                    <div>💬 最大输出: ${model.maxTokens || 'N/A'} tokens</div>
                    <div>🧠 推理: ${model.reasoning ? '是' : '否'}</div>
                    <div>💰 成本: ${model.cost?.input || 0}/${model.cost?.output || 0}</div>
                </div>
                <div class="model-card-buttons">
                    <button class="select-btn ${isActive ? 'selected' : ''}">
                        ${isActive ? '✓ 当前使用' : '选择此模型'}
                    </button>
                    <button class="select-btn btn-warning btn-sm" style="background: #ffc107; color: #212529;">
                        ✏️ 编辑
                    </button>
                </div>
            `;

            if (!isActive) {
                card.querySelector('.select-btn:not(.btn-warning)').addEventListener('click', () => {
                    updateModel(fullId);
                });
            }

            card.querySelector('.btn-warning').addEventListener('click', () => {
                editModel(provider, model);
            });

            modelList.appendChild(card);
        });
    }
}

// Display providers
function displayProviders() {
    const providers = currentConfig.models?.providers || {};
    const authProfiles = currentConfig.auth?.profiles || {};

    providerList.innerHTML = '';

    for (const providerName in providers) {
        const provider = providers[providerName];
        const models = provider.models || [];

        const card = document.createElement('div');
        card.className = 'provider-card';

        const modelTags = models.map(m => `<span class="model-tag">${m.name || m.id}</span>`).join('');

        card.innerHTML = `
            <h3>
                ${providerName}
                <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8em;" onclick="deleteProvider('${providerName}')">删除</button>
            </h3>
            <div class="provider-info">
                <div>🌐 Base URL: ${provider.baseUrl || 'N/A'}</div>
                <div>🔌 API: ${provider.api || 'N/A'}</div>
                <div>🔑 API Key: ${authProfiles[`${providerName}:default`] ? '已配置' : '未配置'}</div>
            </div>
            <div class="provider-models">
                <h4>📦 模型 (${models.length})</h4>
                <div class="model-tags">
                    ${modelTags || '<span style="color: #999;">暂无模型</span>'}
                </div>
                <button class="btn btn-primary" style="margin-top: 15px; padding: 8px 16px; font-size: 0.9em;" onclick="addModel('${providerName}')">➕ 添加模型</button>
            </div>
        `;

        providerList.appendChild(card);
    }
}

// Show error message
function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    success.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    success.textContent = message;
    success.style.display = 'block';
    error.style.display = 'none';

    setTimeout(() => {
        success.style.display = 'none';
    }, 3000);
}

// Start application
init();
