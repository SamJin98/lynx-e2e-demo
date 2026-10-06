# lynx-e2e-demo

真实 ReactLynx + Lynx for Web + tester-army/e2e 本地实验。包含三级菜单和 80 项 scroll-view。范围是 Web runtime，尚未验证 iOS/Android 原生 Lynx、嵌套滚动或虚拟列表。

## 启动与测试

需要 Node.js ^22.22.3 或 >=24.8.0。

```sh
npm ci
npm run browser:install
npm run dev
```

打开 http://127.0.0.1:4180 。运行测试前停止 dev 服务，测试框架会自动启动服务。

```sh
npm test
cp .env.example .env
# 在本地编辑 .env，填入 OPENROUTER_API_KEY
npm run test:agent
npm run test:cache
```

确定性测试不调用模型。Agent 测试默认使用 OpenRouter 的 deepseek/deepseek-v4.1-flash；可在 .env 设置 OPENROUTER_MODEL=openai/gpt-6-luna，配置只允许这两个模型，不配置模型 fallback。单 worker、零重试，每个 agent.act 最多 16 次操作和 16 次模型调用，输入上下文上限 16000 tokens。步数限制不是美元硬上限，账户消费上限请在 OpenRouter 设置。没有 key 时 Agent 命令直接退出。

cache 为 read-write；成功操作通过后续精确断言确认后保存。test:cache 使用 strict-cache，失效记录会报错；没有记录的首次调用仍可能使用模型，因此它不是离线或零费用保证。

本地报告：results/local/report.json；Agent 报告：results/agent/report.json；缓存复测报告：results/cache/report.json。screenshots 和 evidence 保存本地截图及滚动位置。

cloud-experiment 保留原始云端 README、报告、截图与脚本，属于历史证据，不能当作本地运行结果。原 reproduce.sh 需要在原始包结构下执行。

## 本地验证（2026-10-06）

macOS arm64、Node.js v22.23.1、Chromium：三级菜单和滚动测试通过。13 次 swipe 到 Item 60，外层 window.scrollY 前后均为 0。未提供 OPENROUTER_API_KEY，尚未运行真实 AI 操作或缓存复测。Luna 通过 Chat Completions 调用，reasoningEffort 设置为 none，以支持工具调用。
