# HLWY 模型检查台

一个用于检测第三方 OpenAI 兼容接口是否存在模型掺水、降配或错配的 Web 应用。

它不是聊天页，而是一个面向验收和排查的检测工具：输入 `Base URL`、`API Key` 和模型名后，系统会真实调用目标接口，采集样本分布，并与本地保存的基线模型做相似度比对，输出检测报告。

## 功能概览

- 支持 OpenAI 官方地址和自定义 OpenAI 兼容 `chat/completions` 接口
- 首页直接发起检测，结果页自动刷新
- 基于浏览器工作区保存最近 100 条历史记录
- 支持生成只读分享链接
- 仅在数据库中保存检测结果，不保存完整 API Key
- 对目标 `Base URL` 做基础安全检查，默认拒绝 `http`、`localhost` 和私网地址

## 检测流程

1. 向目标模型重复发送固定中文提示词，请求它只返回 `1` 到 `355` 之间的随机数字
2. 从返回结果中提取有效数字，形成样本集合
3. 统计分桶分布和基础统计指标
4. 与数据库中的基线模型分布做相似度比较
5. 输出 Top 3 匹配结果、分布图和文字结论

当前实现要求：

- 单次检测采样数范围为 `50` 到 `100`
- 并发数范围为 `1` 到 `5`
- 至少收集到 `40` 个有效样本才会生成完整报告

## 技术栈

- Next.js 16 App Router
- React 19
- Prisma
- PostgreSQL
- Vitest

## 目录结构

```text
.
├── src/app                # 页面与 Route Handlers
├── src/components         # 报告与页面组件
├── src/lib                # 检测逻辑、校验、安全与序列化
├── prisma                 # Prisma schema 与 seed
├── docker                 # 容器启动脚本
├── Dockerfile
└── docker-compose.yml
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制模板：

```bash
cp .env.example .env
```

`.env` 默认内容如下：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hlwy_ai_checker?schema=public"
ALLOW_INSECURE_BASE_URLS="false"
```

可选地再设置：

```env
SITE_URL="http://127.0.0.1:3000"
```

环境变量说明：

- `DATABASE_URL`：PostgreSQL 连接串
- `ALLOW_INSECURE_BASE_URLS`：是否允许检测 `http` 或本地/私网地址，默认 `false`
- `SITE_URL`：站点绝对地址，用于 SEO 元数据和分享链接展示，未设置时默认 `http://127.0.0.1:3000`

### 3. 启动数据库并初始化 Prisma

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

说明：

- `prisma:push` 会把当前 schema 推送到数据库
- `prisma:seed` 会写入演示用基线数据

### 4. 启动开发服务器

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

## Docker Compose 部署

### 1. 复制部署配置

```bash
cp .env.compose.example .env.compose
```

### 2. 修改 `.env.compose`

至少确认这些值：

- `POSTGRES_PASSWORD`
- `APP_PORT`
- `SITE_URL`
- `ALLOW_INSECURE_BASE_URLS`

### 3. 构建并启动

```bash
docker compose --env-file .env.compose up -d --build
```

### 4. 停止服务

```bash
docker compose --env-file .env.compose down
```

容器启动时会自动执行：

- `prisma db push --skip-generate`
- `prisma db seed`
- `npm run start -- --hostname 0.0.0.0 --port 3000`

## 可用脚本

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## 主要页面

- `/`：发起检测
- `/runs`：查看当前浏览器工作区内的历史记录
- `/runs/[id]`：查看单次检测详情并生成分享链接
- `/share/[token]`：只读分享页

## API 路由

- `POST /api/workspace/ensure`：确保当前浏览器有可用工作区
- `GET /api/tests`：获取当前工作区最近检测记录
- `POST /api/tests`：创建检测任务
- `GET /api/tests/[id]`：获取单次检测详情
- `POST /api/tests/[id]/share`：为当前检测生成分享链接
- `GET /api/baselines`：获取当前启用的基线列表

`POST /api/tests` 请求体示例：

```json
{
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "model": "gpt-5.5",
  "sampleCount": 50,
  "concurrency": 3
}
```

## 数据与隐私边界

- 工作区通过 `hlwy_workspace_token` Cookie 绑定到浏览器
- 数据库中只保存 API Key 后四位用于展示，不保存完整明文 Key
- 分享页只展示检测结果，不暴露接口凭据
- 历史记录默认仅保留当前工作区最近 100 条

## 安全限制

默认情况下，系统会拒绝以下目标地址：

- 非 `https`
- `localhost`
- 私有 IPv4 地址
- 本地回环和常见私有 IPv6 地址
- DNS 解析后落到私网地址的域名

如果你只是在本地联调自建网关，可以把 `ALLOW_INSECURE_BASE_URLS=true` 打开，但这不应出现在公开生产环境。

## 基线数据说明

当前 `prisma/seed.ts` 写入的是演示基线，目的是让项目可以本地完整跑通。它适合开发、联调和界面验收，不适合直接作为正式生产判定依据。

如果你要把这个项目用于真实验收，应该替换为你自己采集和校准过的官方模型基线数据。

## 测试

当前仓库包含 `Vitest` 测试，已有用例位于：

- `src/lib/fingerprint.test.ts`

运行：

```bash
npm run test
```
