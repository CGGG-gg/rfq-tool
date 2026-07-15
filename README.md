# RFQ Tool — 图片转询价单

拍照/上传产品规格文档图片 → AI 自动识别提取 → 生成结构化 RFQ 询价单 → 发送供应商 → 报价比对。

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | Node.js + Express + MySQL + Knex |
| AI 识别 | DeepSeek Vision + Kimi (Moonshot) 双引擎并行 |
| 前端 | 微信小程序 (原生框架) |
| 开放 API | RESTful + Swagger 文档，供第三方网站调用 |
| 导出 | Excel (ExcelJS) + PDF (PDFKit) |

## 快速开始

### 1. 环境要求

- Node.js >= 18
- MySQL 5.7+ (端口 3307)
- 微信开发者工具 (小程序调试用)

### 2. 克隆项目

```bash
git clone https://github.com/CGGG-gg/rfq-tool.git
cd rfq-tool/server
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

| 配置项 | 说明 | 必填 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ |
| `KIMI_API_KEY` | Kimi (月之暗面) API 密钥 | 可选 |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | MySQL 连接信息 | ✅ |
| `DEV_MODE` | 开发模式：`true` 跳过微信登录 | 本地调试用 |
| `WECHAT_APPID/SECRET` | 微信小程序 AppID (生产环境) | 开发模式不需要 |
| `EXTERNAL_API_KEY` | 开放 API 鉴权 Key | 可选 |

### 4. 创建数据库

```bash
# 连接你的 MySQL
mysql -u root -p -P 3307

# 创建数据库和用户
CREATE DATABASE IF NOT EXISTS rfq_tool CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rfq_user'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON rfq_tool.* TO 'rfq_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. 运行迁移 & 启动

```bash
npm install
npm run migrate    # 创建数据表
npm run seed       # 导入示例供应商数据
npm run dev        # 启动开发服务器 (http://localhost:3000)
```

### 6. 启动小程序

1. 打开 **微信开发者工具**
2. 导入项目，选择 `miniprogram/` 目录
3. 在 `project.config.json` 中替换 `appid` 为你的小程序 AppID
4. 开始调试

## API 端点

### 内部 API (`/api/v1`)

供小程序调用。`DEV_MODE=true` 时无需登录。

```
POST   /api/v1/auth/login         登录
GET    /api/v1/auth/check         验证登录态
GET    /api/v1/rfqs               RFQ列表
POST   /api/v1/rfqs               创建RFQ
GET    /api/v1/rfqs/:id           RFQ详情
PUT    /api/v1/rfqs/:id           更新RFQ
DELETE /api/v1/rfqs/:id           删除RFQ
POST   /api/v1/rfqs/:id/items     添加行项目
PUT    /api/v1/rfqs/:id/items/:i  编辑行项目
DELETE /api/v1/rfqs/:id/items/:i  删除行项目
POST   /api/v1/rfqs/:id/images    上传图片
POST   /api/v1/rfqs/:id/recognize AI识别图片
POST   /api/v1/rfqs/:id/send      发送供应商
POST   /api/v1/rfqs/:id/close     关闭询价
GET    /api/v1/rfqs/:id/export/  Excel/PDF导出
GET    /api/v1/suppliers           供应商列表
POST   /api/v1/suppliers           创建供应商
GET    /api/v1/suppliers/:id       供应商详情
PUT    /api/v1/suppliers/:id       更新供应商
DELETE /api/v1/suppliers/:id       删除供应商
POST   /api/v1/uploads             上传图片
```

### 开放 API (`/openapi/v1`)

供第三方网站调用。需 `X-API-Key` Header 鉴权。

```
POST   /openapi/v1/rfq/from-image   上传图片 → 返回RFQ数据
POST   /openapi/v1/rfqs             创建RFQ
GET    /openapi/v1/rfqs             RFQ列表
GET    /openapi/v1/rfqs/:id         RFQ详情
POST   /openapi/v1/webhooks         注册Webhook
GET    /openapi/v1/webhooks         Webhook列表
DELETE /openapi/v1/webhooks/:id     删除Webhook
GET    /openapi/v1/docs             Swagger文档
```

## 项目结构

```
rfq-tool/
├── server/
│   ├── app.js                     入口
│   ├── knexfile.js                数据库配置
│   ├── .env.example               环境变量模板
│   └── src/
│       ├── config/                配置
│       ├── db/migrations/         数据库迁移
│       ├── db/seeds/              种子数据
│       ├── middleware/            认证/日志/错误处理
│       ├── models/                数据模型
│       ├── routes/                路由 (internal + openapi)
│       ├── services/              AI识别/导出/Webhook
│       └── swagger/               OpenAPI规范
└── miniprogram/
    ├── pages/                     小程序页面
    ├── components/                组件
    └── utils/                     工具函数
```
