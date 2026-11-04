# uu · 个人页面集合

[访问站点](https://su2vc.github.io/uuuuuuu/)

一个仓库、一个密码入口、多个独立设计的页面。不同密码进入对应页面，游戏纪念册是其中一个页面模块。

前端工程位于 [`demo/`](./demo/)，沿用现有目录以兼容部署。页面配置集中在 [`pageRegistry.js`](./demo/src/app/pageRegistry.js)，新增页面步骤见 [架构与扩展说明](./docs/architecture.md)。

```sh
cd demo
npm ci
npm run dev
```

校验：`npm run build`，再运行 `npm test`。
