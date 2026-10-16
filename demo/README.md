# uu · 游戏纪念册

React + Vite 纯静态前端，13 款游戏，支持视频、照片组和文字回忆。每次进入默认第一款游戏，进入前的 URL hash 不影响初始选择。新增记录主要修改 `public/content.json`，不需要修改组件代码。

## 运行与验证

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 4173
npm run build
npm test
```

`npm test` 运行全部回归测试，其中包括构建产物检查，因此新检出项目需先执行 `npm run build`。`npm run build` 先检查内容结构和本地素材是否存在，再构建页面及 Sites 适配产物。单独检查内容使用 `npm run check:content`。

普通静态托管上传 `dist/client/`；无需服务端或 Steam API 密钥。保留的 Sites 适配文件不影响普通静态部署。请使用 HTTP 预览，不能直接以 `file://` 打开源码 `index.html`。

## 代码边界

- `App.jsx`：密码入口和懒加载边界。纪念册及 Three.js 在解锁后加载。
- `AlbumExperience.jsx`：内容请求、重试、开屏与纪念册切换。请求在卸载时取消。
- `content.js`：内容结构校验、加载及素材路径收集；构建和浏览器共用校验规则。
- `Album.jsx`：已提交的游戏、右侧滚动位置、弹窗状态。
- `GameNavigation.jsx`：局部滚动预览；`timelineMotion.js` 负责连续位移、对齐、点击旅行和中断，逐帧状态不传到整个纪念册。
- `MemoryBlocks.jsx`：视频、照片、文字组件及图片查看器；`GameIndex.jsx`：搜索目录。两类弹窗共用 `useModalDialog.js` 处理打开、关闭和焦点恢复。
- `Opening.jsx`：开屏交互和 React 生命周期；`openingScene.js`：Three.js 模型及渲染；`openingCamera.js`：镜头；`visibleFrameLoop.js`：可见时间与帧调度；`disposeScene.js`：GPU 资源清理。
- `EntryGate.jsx` / `entryRules.js`：输入联动和口令规则；`BirthdayCelebration.jsx`：生日庆祝。
- `assets.js`：统一处理素材地址。

样式按入口、开箱、回忆内容、基础布局拆分；统一在 `main.jsx` 中固定导入顺序，防止懒加载改变覆盖关系。调整样式请修改已有规则，避免在文件末尾继续叠加同一选择器的覆盖补丁。

## 编辑记录

修改 `public/content.json`，保持 `schemaVersion: 2`：

- `games`：按希望展示的顺序排列；`id` 唯一且稳定；`date` 使用 `YYYY-MM-DD`；`hours` 为非负数字。
- `character`：透明主体 PNG，页面自动应用内白外黄描边和错位剪影，不使用矩形宣传封面。
- `layout`：`trail`、`evidence`、`collage`、`roadtrip`、`duet`、`arcade` 六种编排。
- `paper` / `ink`：回忆卡片底色及辅助文字色。左侧背景独立使用暖色循环。
- `platform`：Steam 或手游等展示标签，没有平台 API 依赖。
- `memories`：每项有稳定 `id`、`title`、`date`，同一游戏内 ID 不重复。
  - `video`：`poster` 封面，`src` 填视频路径或 HTTPS 地址后使用真实播放器；留空时显示封面预览。`previewSeconds` 为正数，仅用于封面预览。
  - `gallery`：非空 `images` 数组，每张包含 `src` 与 `caption`。`presentation` 可用 `stack`、`strip`、`contact`。
  - `text`：`excerpt` 摘要，`paragraphs` 文字段落数组。`presentation` 可用 `note`、`letter`、`ticket`、`dialogue`、`postcard`。
  - `featuredVideo`：独立宽幅视频槽位；双影奇境 `split-special` 已预留，填入 `src` 即可。
- `avatars`：当前为一张圆形黄框头像，图片路径 `assets/avatar-birthday.png`，替换 `src` 和 `alt` 即可。

本地素材放在 `public/assets/`，配置填写 `assets/文件名`。构建会校验本地引用是否存在；远程链接不会在构建时请求，播放可用性需要单独验证。大视频后续接入外部存储即可，不建议提交进 Git。

日期、时长和文字仍为 mock。官方素材来源见 `public/assets/steam/sources.json`，蛋仔派对来自网易手游宣传素材。角色采用官方宣传素材辅助提取，少量遮挡部位可能经过补全。

## 交互约束

滚轮连续移动，无模拟惯性或切换冷却。停止输入 150ms 后就近对齐，260ms 内完成吸附，再切换右侧；点击按距离约 320–650ms 移动。新输入从当前显示位置接管；首尾越界尾事件不延后停稳。手机采用横向目录。

人物接近中心渐变至 1.14 倍，剪影小幅摆动，停稳时前景轻浮动。分隔线保留黄、橘双线和各自 2px 白边；左侧色区与橘线共享变换。镜头通过扩展画布避免盒盖裁切，不缩小盒子。

## 入口与生日

输入 `1020`，回车进入；最多可输入 8 位。无持久化解锁，刷新或重播需再次输入。输入页保留原生橘色光标、空输入待机动画和长度联动。

`src/entryRules.js` 的 `BIRTHDAY_TEST_MODE=true` 仍保留：任意日期解锁都播放 3 秒生日庆祝，自动结束，无继续按钮，可按 Esc 跳过。用户审核确认后再改为 false，恢复每年北京时间 10 月 20 日触发。

口令只用于进入仪式，纯静态页面及素材并非受保护资源；需要私密访问时应在托管层鉴权。
