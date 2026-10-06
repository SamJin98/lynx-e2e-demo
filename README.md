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

## 完整 Agent 流程

tests/journey.e2e.ts 通过 agent.act 完成拖图、详情展开、材质面板内滚动、规格数量、购物袋调整和移除。2026-10-06 最终关闭操作缓存运行通过，19 次模型调用，31.84 秒。鼠标位移 -315px、0 wheel、0 分页点击；材质面板 scrollTop=180，外层前后均为 190；Sand / Walnut 三件小计 $810，移除后 Bag (0)。results/agent-journey-final 保存报告和完整视频。

AI 使用 e2e 内置 drag 和 scroll_to 工具。为让浏览器观测识别 Lynx 控件，Web 宿主将 accessibility-label 与 button trait 映射为 ARIA 属性；透明图片区域用于内置 drag 定位。鼠标/滚轮到触摸的 Web 适配仍属于本项目，不是 e2e 或 Lynx 原生移动引擎。

npm run test:agent 和 npm run test:cache 已包含完整流程。每阶段限制 4–8 次操作和模型调用；整个流程超时 300 秒，无测试重试。

## OpenRouter Decisions 对比

`E2E_DECISIONS=1` 使用 `@e2e-dev/decision` 和本项目 `openrouter-decisions.ts` 适配器，通过 `https://openrouter.ai/api/alpha/decisions` 调用 `openai/gpt-6-luna-decisions`。沿用 OPENROUTER_API_KEY，无模型 fallback。该接口使用 state/questions，不是 Chat Completions。

完整流程的拖拽阶段明确使用 DeepSeek agent，因为官方 decision executor v1 不提供 drag。其余阶段用 Decisions。官方 executor 也只提供 viewport scroll，没有 scroll_to 和指定滚动容器。不要将这版称为纯 Decisions 完整流程。

```sh
NODE_OPTIONS=--use-system-ca E2E_TELEMETRY_DISABLED=1 E2E_DECISIONS=0 npx e2e run tests/journey.e2e.ts --no-cache --output results/deepseek-comparison
NODE_OPTIONS=--use-system-ca E2E_TELEMETRY_DISABLED=1 E2E_DECISIONS=1 npx e2e run tests/journey.e2e.ts --no-cache --output results/decisions-comparison
# 两版支持的相同购物用例，各重复三次。
NODE_OPTIONS=--use-system-ca E2E_TELEMETRY_DISABLED=1 E2E_DECISIONS=0 npx e2e run tests/agent.e2e.ts --grep 'selects finish' --repeat-each 3 --no-cache --output results/deepseek-shopping-comparison
NODE_OPTIONS=--use-system-ca E2E_TELEMETRY_DISABLED=1 E2E_DECISIONS=1 npx e2e run tests/agent.e2e.ts --grep 'selects finish' --repeat-each 3 --no-cache --output results/decisions-shopping-comparison
```

2026-10-06 完整流程：DeepSeek 通过，33.23 秒、19 次模型调用。Decisions 混合版在第二阶段停止：实际 scroll 和 tap 已执行，但两次 completion check 都返回 inconclusive；9.57 秒是中止耗时，不能算完整流程提速。详见 results/decisions-comparison-1 和 results/deepseek-comparison-1。

相同购物用例（选 Sand、数量 2、加入购物袋），两版各三次关闭操作缓存：DeepSeek 完整测试耗时 3.14 / 3.49 / 4.06 秒，Decisions 为 3.35 / 3.16 / 2.67 秒，均全部通过。中位数分别 3.49 与 3.16 秒，Decisions 约快 9.5%。样本较小，不代表完整流程速度；provider prompt cache 仍启用。最终配置复测 Decisions 购物用例通过。

## 完整混合流程接手规则

两版使用同一个 tests/journey.e2e.ts 和相同业务断言。Decisions 模式的拖拽、指定材质面板滚动直接交给 DeepSeek。其他步骤先用 Decisions；AUTOMATION_UNSUPPORTED 和 MODEL_PROVIDER_FAILED 可接手；真实产品失败继续抛出，接口错误保留在步骤报告中。接手前检查精确目标状态，已满足则继续，否则让 DeepSeek 从当前页面完成剩余要求，避免重复操作。截图和 agent-journey-routing.json 记录路由。

2026-10-06 results/decisions-hybrid-final 完整流程通过，129.03 秒，27 次 Decisions、7 次 DeepSeek 调用。Agent 的部分完成确认仍是 blocked，由原有精确状态检查确认结果；不能称为每个 Decisions 步骤都通过。屏幕外控件点击等待导致速度明显低于之前纯 DeepSeek。所有原业务断言保留。

同一份最终测试的纯 DeepSeek 复测（results/deepseek-hybrid-baseline）通过，39.67 秒、18 次调用。两版均关闭 e2e 操作缓存，provider prompt cache 保持启用；这是单轮完整流程比较，不是统计速度基准。

## Decisions 耗时排查与复测

129.03 秒那轮的两段耗时 47.709 秒和 45.854 秒，存在六次 14.76 秒左右的点击等待（合计约 88.6 秒）。日志显示模型反复点击弹层遮挡的 Choose frame，并在选择 Walnut 后重新打开面板，导致随后 Sand 也被遮挡。不是这六次请求的模型推理耗时。

Web 宿主现将弹层标为 aria-modal dialog，并将遮挡的 product-scroll 设为 inert/aria-hidden；面板关闭后恢复。两版共用此修正。测试明确要求 Walnut 选择后面板关闭，并保留所有业务、手势和嵌套滚动断言。

复测保留全部失败：decisions-modal-fixed 为 29.35 秒通过和接口失败；decisions-modal-confirm 确认 OpenRouter HTTP 502；deepseek-modal-fixed 为 21.37 秒通过和错误工具调用导致 Bag (0) 断言失败。加入接口失败接手后，decisions-resilient-final 两轮完整通过，22.58 / 17.96 秒，关闭 e2e 操作缓存。两轮都出现 HTTP 502，但精确状态确认任务已完成后继续；不能说纯 Decisions 全部步骤成功。现阶段速度接近纯 DeepSeek，样本不足以断言稳定更快。

## 提交订单与 confetti

购物袋新增 Submit order，保存规格、数量和总价，清空购物袋并显示 Order confirmed。演示订单只存于页面状态。成功页使用 48 个 Lynx view 和 CSS keyframes 显示 confetti。完整 Agent 测试在移除商品检查后重新加入三件 Sand / Walnut，提交 $810 订单，断言订单明细、Bag (0)、confetti 节点和实际动画位移。2026-10-06 Decisions + DeepSeek 接手版关闭操作缓存运行通过，45.92 秒。报告和视频在 results/agent-order-confetti，截图在 screenshots/agent-order-confetti.png。

## 下单展示录屏

独立用例 tests/order-demo.e2e.ts 只展示选 Sand、加入两件、购物袋改成三件、提交 $720 的 Sand / Oak 演示订单及 confetti，不包含拖图、材质面板或移除再加入。两版共用该用例，关闭操作缓存。2026-10-06 Decisions 完整通过 9.97 秒、12 次 Decisions 调用，本轮未用 DeepSeek；纯 DeepSeek 完整通过 23.62 秒、7 次调用。含结尾 3 秒庆祝展示，仅为单轮耗时。原始视频和报告在 results/order-demo-decisions、results/order-demo-deepseek。

下单展示现已恢复开头的商品图真实横向拖拽。两版共用同一用例：拖到图 2、选 Sand、加购两件、购物袋改为三件、提交 $720 订单和 confetti。2026-10-06 两版手势记录均为鼠标 -315px、0 wheel、0 分页点击；Decisions 版拖拽由 DeepSeek 执行（2 次调用），其余下单为 Decisions（12 次调用），完整通过 11.92 秒；纯 DeepSeek（9 次调用）通过 16.96 秒。报告视频在 results/order-drag-decisions 和 results/order-drag-deepseek。前一版未包含横向拖拽的录屏为历史版本。

下单录屏的拖动已放慢：测试在 Agent 拖动期间对真实 mouse.move 插值，随后恢复原始输入方法，没有改视频播放速度或修改依赖。e2e 内置 drag 当前没有可传的持续时间参数。两版实测均为 -315px，持续约 2.42 秒，0 wheel、0 分页点击。Decisions 混合版通过 15.02 秒，纯 DeepSeek 通过 19.57 秒；报告与视频见 results/order-slow-drag-decisions 和 results/order-slow-drag-deepseek。

横向拖动再次调整为约 1.2 秒，图片拖动区域左右各外移 20px，使实际拖动从 315px 增加到 355px。两版分别实测 1.216 / 1.226 秒，0 wheel、0 分页点击，图片 2 和下单断言均通过。Decisions 混合版 13.34 秒、纯 DeepSeek 18.25 秒，见 results/order-medium-drag-decisions、results/order-medium-drag-deepseek。
