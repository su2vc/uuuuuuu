# 目录透明主体

使用内置 imagegen 对 `../steam/{id}-0.jpg` 官方宣传素材进行 AI 辅助提取。输出保存为 `{id}.png`，透明背景；完整原图仍保留。不是游戏官方提供的透明素材，被裁断或遮挡的局部可能经过补全。

页面通过同一张 PNG 的 alpha mask 绘制后方剪影，前方叠加彩色角色，白黄描边由 CSS 生成。无需维护第二套剪影文件。

## 本轮提示词

以下模板逐一用于每个主体，`SUBJECT` 替换为下表英文文本。模式为 `background-extraction`，`transparent_background=true`，每次只引用该游戏的官方封面。

> Use case: background-extraction. Edit target: the attached official game promotional image. Extract SUBJECT as one standalone transparent PNG for a game scrapbook navigation. Preserve the original subject identity, actual colors, proportions, clothing, art style and pose; do not redesign or add realism. Remove ALL scenery, text, logos, lettering, rectangular card backgrounds, shadows and framing. Complete only small clipped parts of the selected subject when necessary. Place the isolated subject/group centered in a square canvas filling about 85% of its height with transparent padding. Genuine alpha transparency, no checkerboard, no white background, no outline (outline will be added in CSS). Save the final asset.

| 文件 | SUBJECT |
| --- | --- |
| fishing.png | the large fisherman at left holding the fish, including fish |
| bigwalk.png | the five colorful one-eyed walkers grouped on the left, preserve their poses |
| chained.png | both chained men in the left half and their connecting chain |
| machine.png | the foreground cowboy-hat character with blue clothing |
| outlast.png | the cowboy with sunglasses, cigar and leather jacket on the right |
| split.png | both central heroines, one in purple sci-fi suit and one green/brown fantasy clothes, keep dynamic running/jumping poses |
| chameleon.png | the white rabbit character standing at the left |
| chicken.png | the four cartoon animals: sheep, chicken, horse and raccoon, arranged in a compact group |
| eggy.png | the large central yellow egg character only, keep arms and feet |
| nomad.png | the camper van on the right including its roof luggage |
