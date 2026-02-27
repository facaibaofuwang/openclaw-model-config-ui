# OpenClaw 模型配置 UI

> 🤖 使用 OpenClaw 自动化开发

一个用于管理 OpenClaw 大模型供应商和模型配置的可视化 Web 界面。

## 功能特性

- ✨ **可视化模型管理** - 直观地查看和选择可用的 AI 模型
- 📦 **供应商管理** - 添加、删除和配置多个模型供应商
- 🔑 **API Key 管理** - 安全地存储和管理 API 密钥
- 🎯 **一键切换** - 快速切换默认使用的模型
- 🌐 **实时状态** - 显示当前配置和连接状态
- 📱 **响应式设计** - 支持桌面和移动设备

## 技术栈

- **前端**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **后端**: Node.js HTTP 服务器
- **配置**: OpenClaw JSON 配置文件

## 安装与运行

### 前置要求

- Node.js (v14 或更高版本)
- OpenClaw 已安装并配置

### 快速开始

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/openclaw-model-config-ui.git
cd openclaw-model-config-ui
```

2. 启动服务器：
```bash
node server.js
```

3. 打开浏览器访问：
```
http://127.0.0.1:8188
```

## 使用说明

### 模型选择

1. 在"模型选择"标签页查看所有可用的模型
2. 每个模型卡片显示：
   - 模型名称和 ID
   - 供应商信息
   - 上下文窗口大小
   - 最大输出 tokens
   - 推理模式支持
3. 点击"选择此模型"按钮切换默认模型

### 供应商管理

1. 切换到"供应商管理"标签页
2. 填写供应商信息：
   - 供应商名称（如：openai, anthropic）
   - API 类型（OpenAI Completions/Chat, Anthropic 等）
   - Base URL
   - API Key（可选）
3. 点击"添加供应商"保存配置

### 添加模型

1. 在供应商卡片中点击"➕ 添加模型"
2. 输入模型信息：
   - 模型 ID（如：gpt-4, claude-3-opus）
   - 模型名称
   - 上下文窗口大小
   - 最大输出 tokens

## API 端点

服务器提供以下 REST API：

- `GET /api/config` - 获取当前配置
- `POST /api/update-model` - 更新默认模型
- `POST /api/add-provider` - 添加新供应商
- `POST /api/delete-provider` - 删除供应商
- `POST /api/add-model` - 添加模型到供应商
- `POST /api/delete-model` - 删除模型

## 配置文件

服务器默认读取 OpenClaw 配置文件：
```
/home/admin/.openclaw/openclaw.json
```

如需修改路径，请编辑 `server.js` 中的 `CONFIG_PATH` 常量。

## 安全说明

⚠️ **重要提示**：
- 服务器默认绑定到 `127.0.0.1`，仅允许本地访问
- API Key 存储在配置文件中，请确保文件权限正确
- 建议在生产环境中使用反向代理和 HTTPS

## 开发历史

本项目使用 **OpenClaw** 自动化开发完成，通过对话式 AI 辅助实现了：
- 前端界面设计与实现
- 后端 API 开发
- 配置文件读写逻辑
- 响应式样式设计

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。
