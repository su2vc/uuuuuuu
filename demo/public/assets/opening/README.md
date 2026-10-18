# 开屏风景素材

通过内置 image_gen 生成，再由 sharp 等比压缩为 640 × 640 WebP；不包含游戏角色、界面或游戏截图。

- `lake.webp`：第二张，暖金色夕照中的浅紫山湖。
- `meadow.webp`：第三张，淡紫远山与晨光草地。

两张合计约 116 KiB，作为项目静态资源随构建发布；第一张保留原配置。生产构建仍会按现有规则选择更小的版本。生成原图备份在本地 preview/opening-source，未纳入发布。

## 生成提示词

### lake.webp

Use case: illustration-story. Create one square full-bleed pastel landscape illustration for a tiny photograph inside a lavender keepsake box. A quiet alpine lake reflecting distant softly faceted lavender mountains, peach clouds and a warm pale golden sunset. Delicate painterly texture, dreamy airy atmosphere, restrained detail, soft lilac, dusty pink and cream palette. Pure scenery only: no people, creatures, game items, buildings, interface, lettering, border, logo or watermark. Harmonious with a pastel lavender mountain-and-cloud illustration. Output one standalone image.

### meadow.webp

Use case: illustration-story. Create one square full-bleed pastel landscape illustration for a tiny photograph inside a lavender keepsake box. A tranquil meadow of soft grasses with a few tiny pale wildflowers in the foreground, layered lavender hills in the distance, a spacious sky of peach and lilac clouds glowing in gentle sunrise. Delicate painterly texture, dreamy airy atmosphere, restrained detail, soft lilac, dusty pink and warm cream palette. Pure scenery only: no people, creatures, game objects, houses, interface, lettering, border, logo or watermark. Harmonious with a pastel lavender mountain-and-cloud illustration. Output one standalone image.
