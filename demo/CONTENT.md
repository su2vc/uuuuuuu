# 维护纪念册内容

日常只需要编辑 `public/content.json`。当前 13 款游戏、角色素材和风格已经配置好，可以直接替换日期、时长和回忆，不用修改组件。

## 游戏与时间

| 字段 | 格式与用途 |
| --- | --- |
| `id` | 唯一且稳定的游戏标识，如 `peak`，不要随标题修改 |
| `title` | 展示的游戏名 |
| `firstTime` | 第一次游玩日期，固定 `YYYY-MM-DD`，例如 `2026-07-12` |
| `hours` | 总游玩小时数，数字，例如 `12.5`；未知填 `null`，页面隐藏时长；`0` 则显示 0 h |
| `character` | 左侧透明角色 PNG 路径，现有游戏保持原值即可 |
| `memories` | 回忆数组，可增减、调整顺序，也可以为空 `[]` |

游戏固定按 `firstTime` 从早到晚排序，跨年也适用；同一天的游戏保持 JSON 数组顺序。每次进入默认选择排序后的第一款。总时长由你填写，不会从视频时长或日期间隔推算。

回忆的 `date` 是那次回忆发生的日期，不影响游戏目录排序；省略时采用游戏的 `firstTime`。右侧始终按照 `memories` 数组编排，从左到右、从上到下阅读，手机上按相同顺序纵向展示。

## 可复制的最小示例

以下完整 JSON 使用仓库已有素材，可以直接预览。它只包含一款游戏；实际编辑时保留现有其余游戏即可。

```json
{
  "schemaVersion": 3,
  "demoMode": true,
  "avatars": [{ "src": "assets/avatar-birthday.png", "alt": "纪念册头像" }],
  "games": [
    {
      "id": "peak",
      "title": "PEAK",
      "firstTime": "2026-07-12",
      "hours": 12.5,
      "character": "assets/peak-character.png",
      "memories": [
        {
          "id": "peak-video",
          "type": "video",
          "title": "差一点就上去了",
          "date": "2026-07-13",
          "src": "",
          "poster": "assets/peak-memory.png",
          "description": "这次差一点就能接住你。",
          "previewSeconds": 28
        },
        {
          "id": "peak-photo",
          "type": "gallery",
          "title": "山顶合影",
          "images": [
            { "src": "assets/peak-memory.png", "caption": "终于站稳了" }
          ]
        },
        {
          "id": "peak-note",
          "type": "text",
          "title": "我接着你",
          "excerpt": "然后我们一起掉了下去。",
          "paragraphs": ["最后一段路没说几句话，光顾着看脚下。", "下次还一起爬。"]
        }
      ]
    }
  ]
}
```

## 回忆类型

每条回忆都要有 `id`、`type`、`title`。`id` 在同一个游戏内不能重复，仅使用字母、数字、短横线、下划线；复制回忆时记得改 `id`。

| `type` | 内容字段 | 展示与交互 |
| --- | --- | --- |
| `video` | 必填 `poster`；可选 `src`、`description`、`previewSeconds` | 原生视频播放器；没有视频地址时显示可播放的动态封面占位 |
| `featuredVideo` | 与 `video` 相同 | 宽幅特别剪辑卡片；双影奇境已有 `split-special` 槽位 |
| `gallery` | 必填非空 `images` 数组，每张必填 `src`、可选 `caption` | 一张图也支持；多张可翻页、滑动、点击放大 |
| `text` | 必填 `excerpt`；可选 `paragraphs` 字符串数组 | 摘要常驻；有补充段落才显示展开按钮 |

`previewSeconds` 只控制 mock 封面动画，不决定真实视频时长。真实视频由播放器读取媒体信息。图片和视频描述按普通文本展示，换段使用 `paragraphs`；不解析 HTML 或 Markdown。

现有 mock 中，R.E.P.O 包含两段视频和两段文字，用于演示自动编排；Nomad Drive 包含单张图片；双影奇境保留普通视频和特别视频。所有视频 `src` 都为空，不填虚假链接；封面和图片采用已有宣传素材，确保本地可预览。

## 可选样式

游戏可保留这些可选字段：`englishTitle`（参与搜索）、`platform`（默认 Steam，蛋仔派对保留网易手游标签）、`paper`（默认 `#ede9f3`）、`ink`（默认 `#7e6c96`）、`layout`（默认 `auto`）。现有角色、配色无需随内容更新重新填写。

`layout: "auto"` 按回忆顺序流式排列，视频占整行，图片与文字根据屏幕宽度分栏。预设仅在下表组合和顺序完全匹配时启用；否则自动回退 `auto`，无需自己调整坐标。

| 预设 | `memories` 类型顺序 |
| --- | --- |
| `trail` | gallery → text → video |
| `evidence` | video → text → gallery |
| `collage` | video → gallery → text |
| `roadtrip` / `arcade` | gallery → video → text |
| `duet` | featuredVideo → video → gallery → text |

图片 `presentation` 可选 `stack`、`strip`、`contact`，默认 `stack`；文字可选 `note`、`letter`、`ticket`、`dialogue`、`postcard`，默认 `note`。可继续使用当前配置。

## 路径、更新与校验

- 本地图片放 `public/assets/`，例如文件 `public/assets/photos/peak.jpg` 在 JSON 中写 `assets/photos/peak.jpg`。不要填写电脑绝对路径；不要以 `/assets/` 开头，这会绕过 GitHub Pages 的仓库子目录。
- 外部图片或视频在 `src` 填完整 HTTPS 直链。视频应为能直接播放的媒体文件地址，而不是网盘分享页或视频网站页面；可优先准备兼容浏览器的 MP4 文件。
- JSON 不能包含注释或尾随逗号。时长写数字 `12.5`，不要写 `"12.5小时"`。日期不要写 `2026/7/12`。
- `demoMode` 替换完真实内容后设为 `false`，隐藏页尾的演示说明；不影响排序与渲染。
- 在 `demo` 目录运行 `npm run check:content`，校验字段、重复 ID、日期和本地素材。运行 `npm run build` 和 `npm test` 验证后提交推送，现有 GitHub Pages 工作流会重新部署。远程链接播放情况需要实际访问验证，构建不会下载视频。

版本 3 将旧版游戏 `date` 明确改为 `firstTime`；回忆里的 `date` 保持原名。仓库数据已整体迁移，避免一个字段同时表示第一次游玩日期和某次回忆日期。
