<p align="center">
  <img src="branding/pulse-logo-square.png" width="128" alt="PULSE Logo">
</p>

<h1 align="center">PULSE · 四键节奏练习器</h1>

<p align="center">自己设定节奏，反复练习每一次击打。</p>

<p align="center">
  <a href="https://xiaochunlilywang.github.io/pulse-practice/">在线体验</a> ·
  <a href="releases/pulse-practice-xhs-tool.zip">小红书小工具包</a> ·
  <a href="releases/PULSE-120BPM-6.5-十六分随机-100模拟.mp4">演示视频</a>
</p>

PULSE 是一个 4K（四轨）下落式音游练习器。你可以从 BPM、节奏和键型开始组合练习，也可以逐个安排一小节内的音符，让同一段谱面循环播放。适合练习节奏稳定性、双手协调和特定键型。

支持触屏多指操作与键盘输入，无需登录。练习设置和历史战绩保存在本地。

## 开始练习

1. 设置 BPM、节奏型、键型、下落速度和小节数。右侧预览会随设置变化。
2. 点击「开始练习」。网页版选择画面模式，再点击「开始倒数」；小红书版直接进入竖屏练习。
3. 跟随四拍倒数，在音符到达判定线时击打对应轨道。
4. 结算后查看准确率、时间偏差与历史战绩，继续练习或调整参数。

| 操作 | 方式 |
| --- | --- |
| 触屏击打 | 点击对应轨道的任意高度，支持多指同时操作 |
| 键盘击打 | 从左到右为 **D / F / J / K** |
| 暂停、继续 | 点击页面按钮，或按 **空格** |

切到后台会自动暂停。手机横屏模式转回竖屏时也会暂停，横放后可手动继续。

### 画面模式

| 模式 | 布局 | 支持版本 |
| --- | --- | --- |
| 手机竖屏 | 9:16 练习画面 | 网页版 |
| iPad 横屏 | 4:3 练习画面 | 网页版 |
| 手机横屏 | **打击区域为 16:9**，判定和成绩信息位于右侧 | 网页版 |
| 小红书竖屏 | 适应容器的单页竖屏布局 | 小红书版 |

## 设计你的练习

### 节奏与速度

| 设置 | 可选范围 |
| --- | --- |
| BPM | 30–300，支持直接输入、滑条和加减按钮 |
| 节奏型 | 四分、八分、三连音、十六分、自定义节奏 |
| 下落速度 | 1–10 档，每次调整 0.5 |
| 练习长度 | 1–128 小节，提供 4 / 8 / 16 / 32 小节快捷选项 |

所有练习使用 **4/4 拍**。BPM 决定节拍快慢；下落速度只改变音符在画面上的移动速度，不改变节奏。

**自定义节奏**允许你在一小节内点击或拖动绘制拍点，留空代表休止。可切换 1/16 精度（每拍四格）和 1/12 精度（每拍三格），两套节奏分别保存。每行是一拍，① 表示这一拍的起点。

### 键型

| 键型 | 练习方式 |
| --- | --- |
| 纵连 | 同一轨连续击打，可固定第 1 轨或每小节换轨 |
| 交互 | 两轨交替击打，可固定第 1、4 轨或每小节更换组合 |
| 楼梯 | 依次换轨，可选择向右、向左或往返；预设三连音按三个音符分组 |
| 双押 | 每个节奏点同时击打两轨，轮换六种组合；两轨分别判定 |
| 随机 | 四轨分配；相同设置生成相同谱面，方便反复练习 |
| 自定义键型 | 按当前节奏，为一小节内每个音符指定一条轨道 |

选择「自定义键型」后，每行对应一个音符，横向四格对应四条轨道。可以从头编排，也可以用「全部第 1 轨」「向右楼梯」「左右交替」快速填充后再修改。

编排结果按小节循环。调整节奏时，相同拍点的轨道设置会保留；临时取消的拍点在重新点亮后也会恢复。

### 声音与击打反馈

节拍器和打击音可分别开关。打击音使用清脆、明亮的鼓点，带轻微短混响；支持的设备还可开启震动反馈。

命中时，PERFECT 显示绿色弥散光，GREAT 显示白色弥散光。时间偏差使用白字，GREAT 的偏早提示配蓝底、偏晚提示配红底。

## 成绩与历史

### 判定规则

判定依据是**击打时间与音符到达判定线时间的差值**，与点击轨道的垂直位置无关。

| 判定 | 绝对时间偏差 | ACC 权重 |
| --- | --- | --- |
| PERFECT | ≤ 50 ms | 100% |
| GREAT | > 50 ms 且 ≤ 100 ms | 50% |
| LOST | 超出命中窗口，未击中音符 | 0% |

**ACC =（PERFECT 数 + GREAT 数 × 0.5）÷ 音符数 × 100%**

练习中以已判定音符为分母，结算时以全部音符为分母。LOST 会打断连击；空击不计分，也不播放命中音。

### FC 与 AP

- **FC · 全连**：没有 LOST，且含有 GREAT。结算显示绿色徽章与撒花。
- **AP · 全 PERFECT**：所有音符均为 PERFECT。结算显示金色徽章与星光撒花。

历史分别统计 FC 和 AP 次数，AP 不重复计入 FC。系统开启「减少动态效果」时保留徽章，关闭撒花动画。

### 历史战绩

首页和结算页可查看所有已保存的练习，包括每局 ACC、最大连击、判定数量、平均时间偏差和练习参数。

- **平均 ACC**：各局 ACC 的算术平均。
- **平均时间偏差**：所有命中音符的平均偏差，偏早为负、偏晚为正，漏击不计入。早晚可能相互抵消。

数据保存在当前浏览器或小工具容器中，不跨设备同步。网页版与小红书版的历史独立；清除站点数据或容器缓存可能删除记录。

## 本地运行与维护

项目使用原生 HTML、CSS、JavaScript，无需后端或 npm 构建即可运行。使用 Python 3 启动静态服务器：

```sh
git clone https://github.com/XiaochunLilyWang/pulse-practice.git
cd pulse-practice
python3 -m http.server 4173
```

打开 [localhost:4173](http://localhost:4173/)。同一局域网的手机也可以通过电脑的局域网 IP 和端口访问。

### 项目结构

```text
index.html                 网页版设置页
play.html                  网页版练习页
web.js / web.css           网页版逻辑与样式
history.js                 网页版历史战绩
celebration.js              网页版结算动效
scripts/xhs-source.html    小红书版独立源码
scripts/                   构建、校验与测试脚本
xhs-dist/                  小红书版构建产物
releases/                  上传包、演示视频与校验摘要
branding/                  标志资源
```

两版独立维护：修改网页版不会自动同步到小红书版。网页通过 GitHub Pages 从 `main` 分支根目录发布；发布前运行 `python3 scripts/version_web.py` 更新静态资源版本。

### 小红书打包

需要 Python 3.10+ 和 Node.js 18+，以下命令无需安装第三方依赖：

```sh
python3 scripts/build_xhs.py
python3 scripts/check_xhs.py
node scripts/test_hitsound.cjs
node scripts/test_xhs_features.cjs
```

构建读取 `scripts/xhs-source.html`，输出 `xhs-dist/` 和 `releases/pulse-practice-xhs-tool.zip`。ZIP 根目录包含 `index.html`、`app.js`、`style.css`，所有资源离线可用，音效通过 Web Audio 本地合成。

包体和平台适配要求见小红书的 [minitool-zip-builder 指南](https://fe-static.xhscdn.com/mini-tool/20260831163932/minitool-zip-builder-1.6.0.skill)，本项目的检查结果见[校验摘要](releases/pulse-practice-xhs-validation.md)。上传后请在小红书真机预览中检查声音、触控和安全区。

### 测试

基础逻辑测试：

```sh
node scripts/test_history.cjs
node scripts/test_celebration.cjs
node scripts/test_web_audio.cjs
node scripts/test_config_transfer.cjs
```

浏览器测试需要 Playwright 和运行中的本地服务器：

```sh
node scripts/test_web_features.cjs
node scripts/test_custom_pattern.cjs
node scripts/test_xhs_play.cjs
PULSE_XHS=1 PULSE_URL=http://127.0.0.1:4173/xhs-dist/ node scripts/test_custom_pattern.cjs
```

`CHROME_PATH` 可指定 Chrome 可执行文件，`PULSE_URL` 可覆盖测试地址。

## 使用范围

目前支持单音、双押和自定义键型，暂不支持长按、三押／四押、歌曲导入或音频延迟校准。自定义键型的每个节奏点只能选择一条轨道。

声音、触控和震动表现取决于设备与浏览器，蓝牙耳机可能带来额外延迟。Chrome 61 / Android 8.1 和小红书真机容器的兼容性、性能尚未实测。演示视频为自动击打模拟，不代表真人成绩。
