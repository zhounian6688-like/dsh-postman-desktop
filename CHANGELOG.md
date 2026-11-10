# Changelog

## 1.0.0 — 2026-11-10

首次发布。

- 侧边栏「发包台」面板：请求构建器、环境变量、集合树、历史、响应查看器、cURL 互转、CDN 源站探测。
- agent 工具 `http_request_desktop`，与面板共用同一条发送引擎。
- host 侧 `/api/dsh-postman-desktop` 路由族：`store` / `send` / `curl` / `history` / `probe` / `health`，同源校验。
- 零运行时依赖，只用 `node:` 内置模块；前端纯 `React.createElement`，无构建步骤。
