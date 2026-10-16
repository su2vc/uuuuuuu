# uu

[打开纪念册](https://su2vc.github.io/uuuuuuu/)

一个记录多人游戏回忆的静态纪念册。React + Vite + Three.js，支持视频、图片和文字记录。

应用代码和素材位于 [`demo/`](demo/)，运行、内容编辑与架构说明见 [项目文档](demo/README.md)。

## GitHub Pages

仓库使用 GitHub Actions 自动部署：推送到 `main` 后，安装依赖、构建、运行测试并发布 `demo/dist/client/`。

在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。部署成功后，通过 Actions 的 `github-pages` 环境链接访问网站。

自定义域名在 **Settings → Pages → Custom domain** 设置，再按 GitHub 提示配置域名 DNS。当前构建使用相对素材路径，同时兼容仓库子路径与自定义域名。

网页中的日期、时长和回忆文字为示例内容。游戏宣传素材和角色的权利归原权利人，素材来源记录见 `demo/public/assets/steam/sources.json`。
