# 架构与页面扩展

采用一个 Git 仓库、一个前端应用、多个页面模块。密码负责选择页面，页面自行拥有内容、布局和内部交互。新增页面放进当前仓库的 `demo/src/pages/`，不需要另建仓库或在子目录初始化 Git。

## 目录职责

```text
demo/
  src/
    main.jsx                   # React 启动与公共样式
    app/
      App.jsx                  # 入口、页面装载、浏览器导航
      pageRegistry.js          # 页面 id、名称、密码、开放开关、加载函数
      pageAccess.js            # 当前解锁状态是否匹配目标页面
      global.css               # 站点基础样式和加载状态
    entry/
      EntryGate.jsx            # 共用密码页
      entryRules.js            # 密码匹配，不包含页面业务
      EntryBlocked.jsx         # 共用「未营业」状态
      *.css
    pages/
      game-album/
        index.jsx              # 纪念册的唯一对外入口
        AlbumExperience.jsx    # 生日、盒子、相册流程
        birthdayRules.js       # 纪念册专属生日规则
        ...                    # 纪念册组件、内容解析、动效及样式
      <后续页面 id>/
        index.jsx
        ...
    shared/
      navigation.js            # 构造和解析页面 URL
      assets.js                # 本地、OSS 素材地址解析
      audio/                   # 共用音频上下文与音效
      components/              # 错误边界等共用组件
      hooks/                   # 可复用的交互 hooks
  public/
    content.json               # 现有纪念册内容，保留兼容路径
    assets/                    # 现有素材，保留兼容路径
  tests/
  scripts/
  worker/
docs/
  architecture.md
```

保留 `demo/` 工程目录和现有静态资源路径，GitHub Pages 与当前打包流程继续使用原位置。新页面新增本地素材时，使用 `public/assets/<页面 id>/`；新增 JSON 等数据使用 `public/pages/<页面 id>/`，避免与纪念册内容重名。各页面内部可以按复杂度继续拆分，不提前创建空目录。

## 密码与路由

当前实际配置：`1020` → `game-album` → `#/game-album`。纪念册保留 `blocked: true`，因此解锁后仍显示「未营业」。这个开关属于单个页面，不会阻断以后其他密码对应的页面。

URL 使用 hash 路由，适配 GitHub Pages 的仓库子路径和静态托管，无需新增路由依赖或配置服务端重写：

```text
#/                         共用密码入口
#/game-album               纪念册入口
#/game-album/peak          纪念册内部的 PEAK 内容
#/<页面 id>/<内部路径>      后续页面自己的内部导航
```

密码匹配决定进入哪个页面，当前 URL 不会改变密码对应的目标。页面 id 必须唯一，密码也必须唯一；目前沿用输入框的 1–8 位数字限制，前导零保留。重复 id、重复密码或无效配置会直接报错。

解锁信息只放在 React 内存中，不写入 URL、浏览器存储或历史 state。直接访问页面链接与刷新都先显示密码页。浏览器返回入口或切换其他页面时清除当前解锁状态，页面内部切换不清除。纪念册进入时沿用从第一款游戏开始的行为。

## 新增页面

下面的 `new-idea` 和 `123456` 仅为接入示例，未注册为实际页面。

1. 创建 `demo/src/pages/new-idea/index.jsx`，导出默认页面组件：

   ```jsx
   import styles from './page.module.css';

   export default function NewIdeaPage({ entry }) {
     return <main className={styles.page}>
       <h1>我的新页面</h1>
     </main>;
   }
   ```

   同目录创建 `page.module.css`：

   ```css
   .page {
     min-height: 100svh;
     padding: 24px;
   }
   ```

2. 在 `demo/src/app/pageRegistry.js` 的数组中增加：

   ```js
   {
     id: 'new-idea',
     title: '我的新页面',
     password: '123456',
     blocked: false,
     load: () => import('../pages/new-idea/index.jsx'),
   },
   ```

3. 运行 `npm run build` 和 `npm test`，本地输入新密码检查页面及浏览器返回行为。

无需修改密码组件、应用外壳或纪念册。页面收到的 `entry` 包含 `pageId` 与 `enteredAt`，不包含原始密码；纪念册通过进入时间判断是否播放生日庆祝。

## 模块约束

- 页面按需加载：公共入口不提前加载纪念册、Three.js 或其他页面内容。进入未开放页面也不加载其页面包。
- 页面样式随页面加载。纪念册现有样式限制在 `.game-album-page` 下；新页面优先使用 CSS Modules，避免样式留在页面切换后的 CSS 中时影响其他页面。
- 页面不互相导入私有组件。出现实际复用后，再把能力移到 `shared/`；生日规则等业务留在所属页面。
- 页面自行清理定时器、动画、视频与音频。纪念册退出时停止其音效和背景音乐。
- 新页面的内部导航使用 `shared/navigation.js` 的 `pageHash(id, segments)` 与 `parsePageHash(hash)`，不要覆盖外层页面 id。

## 访问边界

这里的密码是静态页面的分流口令，不是保密鉴权；前端代码和静态素材可被查看。如果未来要保护私密内容，需要在服务端或托管层校验访问权限。
