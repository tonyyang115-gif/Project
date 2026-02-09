# 云函数配置模板说明

## config.json 文件作用

每个云函数都可以有自己的 `config.json` 配置文件，用于设置：
- 环境变量（envVariables）
- 权限配置（permissions）
- 超时时间等

## 模板文件

### 1. aiService.config.json
用于需要AI服务的云函数（如 aiService）

**包含环境变量**：
- `QWEN_API_KEY`：阿里云通义千问API密钥
- `ENV`：环境标识（production/development）

**使用方法**：
1. 复制到云函数目录
2. 重命名为 `config.json`
3. 替换 `QWEN_API_KEY` 为真实API密钥
4. 上传云函数时会自动应用配置

### 2. default.config.json
用于普通云函数（无需环境变量）

**使用方法**：
1. 复制到云函数目录
2. 重命名为 `config.json`
3. 上传云函数

## 安全提示

⚠️ **重要**：
- 不要将包含真实API Key的 `config.json` 提交到Git
- 添加到 `.gitignore`：`cloudfunctions/*/config.json`
- 团队成员各自配置自己的API Key

## 何时配置

**不是现在**：云函数尚未创建

**稍后配置**：在创建具体云函数时（任务1.4及之后）
