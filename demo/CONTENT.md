# 维护纪念册内容

日常只需要编辑 `public/content.json`。当前 11 款游戏、角色素材和风格已经配置好，可以直接替换日期、时长和回忆，不用修改组件。

## 游戏与时间

| 字段 | 格式与用途 |
| --- | --- |
| `id` | 唯一且稳定的游戏标识，如 `peak`，不要随标题修改 |
| `title` | 展示的游戏名 |
| `playPeriod` | 周期对象 `{ "start": "2026-08-24", "end": "2026-08-30" }`；未知填 `null`。两个日期均为 `YYYY-MM-DD` |
| `hours` | 已提供记录覆盖期间的累计小时数，数字，例如 `3.5`；未知填 `null`，页面隐藏时长；`0` 则显示 0 h |
| `character` | 左侧透明角色 PNG 路径，现有游戏保持原值即可 |
| `memories` | 回忆数组，可增减、调整顺序，也可以为空 `[]` |

游戏按 `playPeriod.start` 从早到晚排序，同起点保持 JSON 数组顺序；未知周期稳定排在最后。每次进入默认选择排序后的第一款。左侧目录和全部游戏目录展示 `8.31–10.18`，右侧标题展示 `2026.8.31–10.18`；跨年时两端都显示年份。未知周期显示「时间待补充」。周期包含中间没有游玩的空档，不代表每天游玩。时长按去重后的周记录累加，不从起止日期或视频长度推算，也不代表 Steam 终身总时长。

回忆的 `date` 是那次回忆发生的具体日期，不影响游戏目录排序；省略时不显示，也不自动采用周报起点。除按用户要求保留的 Nomad Drive 外，原模拟回忆日期已清空，待真实记录补充。右侧始终按照 `memories` 数组编排，从左到右、从上到下阅读，手机上按相同顺序纵向展示。

## 可复制的最小示例

以下完整 JSON 使用仓库已有素材，可以直接预览。它只包含一款游戏；实际编辑时保留现有其余游戏即可。

```json
{
  "schemaVersion": 4,
  "demoMode": true,
  "avatars": [{ "src": "assets/avatar-birthday.png", "alt": "纪念册头像" }],
  "games": [
    {
      "id": "peak",
      "title": "PEAK",
      "playPeriod": { "start": "2026-08-24", "end": "2026-08-30" },
      "hours": 3.5,
      "character": "assets/peak-character.png",
      "memories": [
        {
          "id": "peak-video",
          "type": "video",
          "title": "差一点就上去了",
          "date": "2026-08-25",
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
| `video` | `src` 与 `poster` 至少填写一项；可选 `description`、`previewSeconds` | 原生视频播放器；有视频无封面时由浏览器显示视频画面，没有视频地址时显示动态封面占位 |
| `featuredVideo` | 与 `video` 相同 | 宽幅特别剪辑卡片；双影奇境已有 `split-special` 槽位 |
| `gallery` | 必填非空 `images` 数组，每张必填 `src`、可选 `caption` | 一张图也支持；多张可翻页、滑动、点击放大 |
| `text` | 必填 `excerpt`；可选 `paragraphs` 字符串数组 | 摘要常驻；有补充段落才显示展开按钮 |

`previewSeconds` 只控制 mock 封面动画，不决定真实视频时长。真实视频由播放器读取媒体信息。图片和视频描述按普通文本展示，换段使用 `paragraphs`；不解析 HTML 或 Markdown。

没有封面时，`poster` 可省略或填空字符串，只填视频 `src` 即可（`featuredVideo` 同样支持）。有封面保持 `preload="none"`；无封面使用原生 `preload="metadata"`，加载到首帧后由浏览器显示，不自动播放、不额外截帧或跳转播放时间。预加载只是浏览器提示，实际流量和未播放前能否显示画面取决于浏览器与文件编码；首帧本身是黑场时也会显示黑色。无视频地址的预留回忆仍需 `poster`。

现有 mock 中，R.E.P.O 包含两段视频和两段文字，用于演示自动编排；Nomad Drive 包含单张图片；双影奇境保留普通视频和特别视频。所有视频 `src` 都为空，不填虚假链接；封面和图片采用已有宣传素材，确保本地可预览。

## 可选样式

游戏可保留这些可选字段：`englishTitle`（参与搜索）、`platform`（默认 Steam）、`paper`（默认 `#ede9f3`）、`ink`（默认 `#7e6c96`）、`layout`（默认 `auto`）。现有角色、配色无需随内容更新重新填写。

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

版本 4 将版本 3 的 `firstTime` 替换为 `playPeriod` 起止周期，旧版模拟首次日期不再保留。回忆的 `date` 保持原名，但省略时不再继承游戏日期。仓库数据、校验和界面已整体迁移。

## 2026-10-17 用户截图统计依据

来源为用户提供的两张小黑盒周报截图，年份采用图中 2026。重叠截图里的同一游戏、同一周只计一次。仅统计当前 11 款游戏；RAFT、赛博朋克、三国志等范围外游戏不导入。

| 游戏 ID | 截图中的周记录（周期：小时） | 汇总小时 | 展示周期 |
| --- | --- | ---: | --- |
| peak | 8.24–8.30：3.5 | 3.5 | 8.24–8.30 |
| fishing | 8.24–8.30：4.9 | 4.9 | 8.24–8.30 |
| bigwalk | 8.31–9.6：3.8；9.7–9.13：3.3；9.21–9.27：4.3；10.12–10.18：6.3 | 17.7 | 8.31–10.18 |
| chameleon | 8.31–9.6：2.9（图中 MECHA CHAMELEON，用户已确认对应超级变色龙） | 2.9 | 8.31–9.6 |
| repo | 9.7–9.13：8.5；9.14–9.20：6.1；9.21–9.27：3.8；9.28–10.4：3.2 | 21.6 | 9.7–10.4 |
| chained | 9.14–9.20：7.0；9.21–9.27：0.8 | 7.8 | 9.14–9.27 |
| chicken | 9.28–10.4：2.5；10.12–10.18：2.0 | 4.5 | 9.28–10.18 |
| outlast | 10.5–10.11：6.5 | 6.5 | 10.5–10.11 |
| l4d | 10.5–10.11：3.0；10.12–10.18：0.4 | 3.4 | 10.5–10.18 |
| split | 10.12–10.18：5.8 | 5.8 | 10.12–10.18 |
| nomad | Demo 无周报数据，按用户要求保留原手工占位值 | 6 | 10.12 |

这是截图可证实的统计，不是完整历史。周报起止日不等于实际首次/最后游玩日；10.18 为截图中的周报终点。Nomad Drive 为 Demo，按用户要求保留原日期 2026-10-12（周期起止同日）与 6h，以及原回忆日期，待用户手动补充。
