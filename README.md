# lynx-e2e-demo

真实 ReactLynx + Lynx for Web + tester-army/e2e 本地实验。当前为家具商品详情页：横向图片轮播、Finish、数量、购物袋和可展开详情。范围是 Web runtime，尚未验证 iOS/Android 原生 Lynx、嵌套滚动或虚拟列表。

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

本地报告：results/local/report.json；Agent 报告：results/agent/report.json；缓存复测报告：results/cache/report.json。screenshots 保存页面截图。

cloud-experiment 保留原始云端 README、报告、截图与脚本，属于历史证据，不能当作本地运行结果。原 reproduce.sh 需要在原始包结构下执行。

## 本地验证（2026-10-06）

macOS arm64、Node.js v22.23.1、Chromium。旧版本菜单与深列表验证结果属于历史实验；当前商品详情页另行验证横向轮播、分页点击、规格、数量、购物袋和详情展开。

## 官方示例来源

基于 https://lynxjs.org/learn/product-detail.html 的商品详情方向，采用 lynx-family/lynx-examples/examples/swiper 的主线程轮播 hooks 和官方配图，保留 Apache-2.0 LICENSE，见 src/swiper/NOTICE.md。商品名称、价格和规格是本项目的演示数据。颜色选项记录选择状态，图片轮播是独立操作。

Web engine 的 swipe 发送 wheel，官方组件监听 touch。server.mjs 将轮播区域的横向 wheel 转成 touch 事件，竖向 wheel 继续交给页面滚动。确定性测试分别覆盖 e2e wheel 适配和 Chromium CDP 真实触摸。修复了触摸吸附动画覆盖分页点击的问题。此适配只应用于 Web 预览，尚未运行原生设备。

Agent 启动脚本使用 --use-system-ca，让 Node 信任 macOS 系统证书，保持 TLS 校验开启。Luna 的 Chat Completions reasoningEffort 设置为 none。

当前商品页验证：确定性用例全部通过（含 CDP 触摸）。DeepSeek 两个 AI 用例通过，6 次模型调用，29.62 秒。第二遍通过，但只重放了轮播，购物流程 cache miss 并调用模型 7 次；尚未确认购物流程能稳定重放。报告见 results/agent 和 results/cache。

桌面鼠标适配：商品图区域监听 mouse pointerdown/move/up，转换为官方轮播的 touch 事件。Pointer capture 处理拖出区域后的松手，pointercancel、失焦时结束拖动。支持左拖、右拖和抓取光标。确定性测试已验证上述鼠标行为，现有 wheel、CDP touch 和购物操作均通过。

录屏已开启：e2e.config.ts 的 video 为 on。每个测试的原始 WebM 在 results/<run>/artifacts/.../video/video.webm，报告记录其路径。2026-10-06 已运行横滑缓存重放并生成视频，未新增模型调用。

横向连续拖动录屏：Horizontal drag moves continuously without clicking pagination 用真实鼠标 down/move/up，不点击分页。检查拖动途中位移在 -300px 与 -100px 之间，再断言图片 2 / 3；视频在 results/horizontal-drag-video。此用例为确定性测试，不调用 AI。
