# Lynx + tester-army/e2e：云端实际实验

日期：2026-10-06（America/Los_Angeles）。所有源码、依赖、构建、服务器、浏览器、测试、截图、报告都在 OpenAI 云端 Linux x86_64 环境完成，目录 /workspace/scratch/36affdb2544a/lynx-e2e-cloud。没有使用用户的 Mac 或本地令牌。

## 做了什么

这是真实 ReactLynx 页面：src/index.tsx 使用 @lynx-js/react 的 root.render、useState、view/text/scroll-view 和 bindtap。Rspeedy 与官方 ReactLynx 插件编译出 dist/main.web.bundle，由官方 @lynx-js/web-core 注册的 lynx-view 加载。宿主 HTML 仅提供 lynx-view 和加载脚本，菜单及列表不是普通 HTML 模拟。

原生移动环境检查仍未发现 adb、emulator、xcrun 或 /dev/kvm；因此实际测试是 **Lynx for Web + e2e Web engine**，不是 Android/iOS Lynx，也不是 e2e mobile engine 测试。

## 固定版本

Node 24.19.0；e2e 0.18.0；@e2e-dev/web 0.13.0；@lynx-js/react 0.126.2；@lynx-js/rspeedy 0.18.0；@lynx-js/react-rsbuild-plugin 0.20.3；@lynx-js/web-core 0.26.2；TypeScript 5.9.3；playwright-core 1.63.0；Chrome Headless Shell 153.0.8010.12（revision 1243）。所有项目依赖固定精确版本，传递依赖由 package-lock.json 固定。

## 测试内容与结果

1. 三级菜单：初始不存在 Settings；点击 Account 后 Settings 出现；点击 Settings 后 Notifications 出现；点击 Notifications，精确验证 Selected: Notifications。状态变化由 ReactLynx useState + bindtap 产生。
2. scroll-view：80 行，每行 48px，内部视口约 278px。显式 list.swipe 移动内部滚动容器；第一次由 0 -> 210px；13 次手势后到 2730px。在点击前检查 Item 60 的 top/bottom 完整处于列表视口，然后点击，精确验证 Selected: Item 60。浏览器外层 window.scrollY 保持 0。截图显示 Item 58–63 与正确选择状态。
3. 故意失败：INTENTIONAL_FAIL=1 使第二项期望 Selected: Item 61，但实际为 Selected: Item 60。报告 ASSERTION_FAILED、退出码 1，并有 screen.txt、自动失败截图和 trace.zip。
4. 恢复：取消失败变量后，两项均通过，退出码 0。

pass runner 总耗时约 4.79s；fail 10.02s（包含5秒断言等待）；recovered 4.72s。最终确切数据见各 report.json 与 evidence/summary.json。

这不是虚拟化或分页列表；也不是可滚动外层加可滚动内层的嵌套滚动场景。外层保持 0 的检查只证明这次列表滚动没有改变页面位置，不能据此推断嵌套手势分发正确。三级菜单是逐级揭示的菜单路径，不包含浮层定位、悬停或遮挡陷阱。没有测性能掉帧、原生线程、原生 accessibility 映射，也没有用模型执行 agent.act。

## 实際发现与适配

- 明确 source.entry 指向 src/index.tsx，否则 Rspeedy 默认尝试 src/index.js，构建中出现 ReactWebpackPlugin Invariant failed。修复后编译成功。
- Rspeedy 配置加载需要 TypeScript，初次报 ERR_MODULE_NOT_FOUND；补装并固定 TypeScript 5.9.3。
- Lynx for Web 把组件渲染在 lynx-view 的开放 Shadow DOM 内。普通 body.innerText 看不到其内容，不代表页面为空；Playwright CSS selector 可以穿过开放 Shadow DOM。
- 本版本保留 accessibility-label/trait 属性，但这些按钮没有自动成为浏览器 getByRole('button') 的结果（探针计数为0）。因此测试用 browser.locator('[accessibility-label="Account"]') 等官方 Web engine 的 CSS 定位能力，不声称语义角色定位已验证。
- 仅 scrollUntilVisible + tap 不够严格：目标已存在 DOM，scrollUntilVisible 很快返回，而 tap 可能自动滚到目标。最终测试先用显式 swipe，再在点击前验证几何位置与真实 scrollTop，避免把点击自动滚动误称为手势验证。保留了 scroll-probe-failure.log。
- 手势之后需等滚动落定；初次立即测量时目标越过视口。最终每次慢速手势后等150ms，按目标位置选择方向，最多30次，最后做精确范围断言。此固定等待仅是小实验策略，复杂应用应使用滚动结束信号或稳定位置采样。
- 云端每次工具执行的网络隔离使单独启动服务器后在另一次 exec 中访问 localhost 出现连接拒绝。探针改为自身启动子进程；正式测试由 e2e app.command 启动服务器，位于相同执行上下文。
- 浏览器控制台出现 SDK iframe sandbox 与 WASM 初始化弃用警告；没有 pageerror。相关证据见 probe.log/browser-errors.json。没有改写第三方 SDK。

## 云端复现

```bash
bash reproduce.sh
```

脚本 npm ci -> npm run build -> pass -> 故意失败（要求退出1）-> recovered。runner 自动启动和清理 server.mjs，监听127.0.0.1:4180。报告存放 results/<stage>/report.json；trace 与自动失败截图在相邻 artifacts/；成功截图在 screenshots/。

另一云端环境第一次运行时 e2e 自动安装浏览器。若默认 Playwright CDN 像本会话上一轮那样返回HTML，可以在所有安装进程停止后从同版 Google 官方源安装：

```bash
curl -fL https://storage.googleapis.com/chrome-for-testing-public/153.0.8010.12/linux64/chrome-headless-shell-linux64.zip -o browser.zip
python3 - <<'PY'
import zipfile,os,pathlib
p=pathlib.Path.home()/'.cache/ms-playwright/chromium_headless_shell-1243'
with zipfile.ZipFile('browser.zip') as z:z.extractall(p)
os.chmod(p/'chrome-headless-shell-linux64/chrome-headless-shell',0o755)
(p/'INSTALLATION_COMPLETE').touch()
PY
```

浏览器与 node_modules 不打入实验包。系统共享库在本环境已具备，另一环境可能需 Playwright 系统依赖。

## 下一步适用范围

可以基于此实验继续验证 Lynx for Web 的嵌套滚动、虚拟列表、分页、浮层菜单。Android/iOS 路径还需要云端设备、Lynx宿主构建及系统 accessibility snapshot；本实验不能替代这些验证。真实AI自然语言操作仍缺少已授权的模型API凭证或云端订阅登录，没有假模型或冒充缓存数据。

## 官方来源

- https://lynxjs.org/guide/start/integrate-with-existing-apps.html
- https://lynxjs.org/guide/inclusion/accessibility.html
- https://github.com/lynx-family/lynx-stack
- https://github.com/tester-army/e2e

制品：src、构建配置、宿主server、测试与锁文件、reproduce.sh、dist编译bundle、原始报告/trace、截图、构建与运行日志。仅证据探针使用直接Playwright；正式交互用e2e的locator.tap/swipe，精确断言与runner报告。位置采样和成功截图通过 surfaceOf(engine).page() 读取，非e2e自动记录step；数据文件明确保留。

已执行 npm ci 清洁重装、重新构建、再次运行（results/clean），2/2通过。4轮引用制品均存在。哈希核对发现 pass 阶段菜单 trace 的实际SHA256与report记录不一致，其余全部一致；原因未定位，保留原文件与 artifact-audit.json，没有修改report掩盖。fail/recovered/clean三轮的全部引用制品均通过哈希核对。
