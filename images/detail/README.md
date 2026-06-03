# images/detail/ — 作品详情页图片

点击作品列表中的任意作品，会打开全屏详情页。详情页包含：
1. 一张 Hero 大图（顶部，65vh 高度，暗化处理后叠文字）
2. 两张 Gallery 图（正文下方，双列网格）

============================================
文件列表 — Hero 图（共 6 个）
============================================

flux-hero.jpg         → Chromatic Flux 详情页顶部大图
silence-hero.jpg      → The Shape of Silence 详情页顶部大图
erosion-hero.jpg      → Erosion Study No. 4 详情页顶部大图
neon-hero.jpg         → Neon Liturgy 详情页顶部大图
void-hero.jpg         → Constructing the Void 详情页顶部大图
tidal-hero.jpg        → Tidal Memory 详情页顶部大图

============================================
文件列表 — Gallery 图（共 12 个，每件作品 2 张）
============================================

flux-1.jpg / flux-2.jpg
silence-1.jpg / silence-2.jpg
erosion-1.jpg / erosion-2.jpg
neon-1.jpg / neon-2.jpg
void-1.jpg / void-2.jpg
tidal-1.jpg / tidal-2.jpg

============================================
如何替换
============================================
1. 将你的作品图片命名为上述文件名之一
2. 放入此文件夹
3. 刷新浏览器，点击对应作品卡片查看

============================================
推荐规格
============================================
Hero 图:
  尺寸: 1920 × 1080 px（或 16:9 比例）
  格式: JPG 或 WebP
  大小: 每张建议 < 600KB
  注意: Hero 图会应用 filter: brightness(.28)，会大幅变暗

Gallery 图:
  尺寸: 800 × 600 px（或 4:3 比例）
  格式: JPG 或 WebP
  大小: 每张建议 < 200KB

============================================
关键 CSS 选择器
============================================
.detail-hero-img      → Hero 大图（filter: brightness(.28)）
.detail-gallery img   → Gallery 网格图（hover 放大 1.025x）

============================================
JS 数据位置
============================================
在 app.js 中搜索 "workData"，每个作品对象包含 gallery 数组，
数组中是两张图在详情页的路径。例如：
gallery: ['images/detail/flux-1.jpg', 'images/detail/flux-2.jpg']
