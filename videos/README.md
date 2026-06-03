# videos/ — 视频展示区

用于展示你的动态艺术、过程记录、或实验影像作品。
页面滚动到视频区域时触发入场动效，视频自动循环静音播放。

============================================
文件列表（共 3 个视频 + 3 张封面图）
============================================

视频文件:
  video-1.mp4          → 视频 1（推荐：创作过程 / 动态艺术）
  video-2.mp4          → 视频 2
  video-3.mp4          → 视频 3

封面图（视频加载前显示，可选）:
  cover-1.jpg          → 视频 1 封面
  cover-2.jpg          → 视频 2 封面
  cover-3.jpg          → 视频 3 封面
  （若不提供封面图，视频区域会显示深色背景 + 播放图标）

============================================
如何替换
============================================
1. 将你的视频文件命名为 video-1.mp4 / video-2.mp4 / video-3.mp4
2. 放入此文件夹
3. （可选）放入对应的封面图 cover-1.jpg / cover-2.jpg / cover-3.jpg
4. 刷新浏览器

============================================
推荐规格
============================================
视频:
  分辨率: 1920×1080 或 1280×720（16:9）
  编码: H.264 (AVC) — 浏览器兼容性最好
  格式: MP4
  时长: 10~60 秒（会循环播放）
  大小: 每段建议 < 10MB
  音频: 默认静音播放，不需要音频
  建议: 使用 FFmpeg 压缩：ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 28 -an output.mp4

封面图:
  尺寸: 与视频分辨率一致即可
  格式: JPG 或 WebP
  大小: 每张建议 < 100KB

============================================
如果你想增减视频数量
============================================
1. 修改 index.html 中 #motion 区域的 .motion-grid 内的 .motion-card 数量
2. 每张卡片的格式：
   <div class="motion-card anim-up">
     <div class="motion-video-wrap">
       <video class="motion-video" src="videos/video-N.mp4" poster="videos/cover-N.jpg" muted loop playsinline></video>
       <div class="motion-play-overlay"><span class="motion-play-icon">&#9654;</span></div>
     </div>
     <h3 class="motion-title">视频标题</h3>
     <p class="motion-desc">视频描述文字</p>
   </div>

============================================
关键 CSS 选择器
============================================
.motion-section        → 整个视频区域
.motion-video-wrap     → 视频容器（16:9 比例）
.motion-video          → video 元素
.motion-play-overlay   → 点击播放的遮罩（播放后隐藏）
.motion-card           → 每张视频卡片
