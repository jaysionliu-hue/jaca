# 墨境·高概念网文AI创作引擎

基于 **7个真相文件** 的高概念网文AI创作引擎，帮助作者系统化构建故事世界。

![墨境封面](assets/cover.png)

## 📖 项目简介

墨境是一款专业的网文创作辅助工具，通过结构化的「7个真相文件」帮助作者：

- 🔍 **系统性思考** - 从世界观到细节，系统化构建故事
- 🎯 **一致性校验** - 规则引擎自动检查设定冲突
- 🤖 **AI智能辅助** - Agent集群协同创作建议
- 💾 **自动保存** - 数据安全，永不丢失

## 🗂️ 7个真相文件

| 真相文件 | 说明 |
|---------|------|
| 🌍 世界观真相 | 故事发生的世界设定、力量体系、社会结构 |
| 👤 角色真相 | 人物性格、成长弧线、关系网络 |
| 📖 剧情真相 | 主线支线、冲突链、转折点设计 |
| 💡 主题真相 | 核心思想、情感弧线、哲学追问 |
| ✍️ 文风真相 | 叙事风格、语言特点、标志性元素 |
| 🏗️ 结构真相 | 叙事弧、章节大纲、时间线 |
| ✨ 黄金真相 | 黄金台词、高潮场景、关键名场面 |

## 🚀 快速开始

### 方式一：开发模式

```bash
# 1. 克隆项目
git clone <repo-url>
cd 墨境_高概念网文AI引擎_Electron

# 2. 安装 Python 依赖
pip install -r requirements.txt

# 3. 安装 Node.js 依赖
cd electron
npm install
cd ..

# 4. 启动后端服务
python backend/main.py

# 5. 启动 Electron（另一个终端）
cd electron
npm run dev
```

### 方式二：Windows 一键打包

```bash
# 双击运行 build.bat 或在命令行执行
build.bat
```

### 方式三：直接运行打包后的 EXE

```bash
# 找到 dist/release 目录下的安装包
# 或 dist 目录下的便携版 exe
```

## 📁 项目结构

```
墨境_高概念网文AI引擎_Electron/
├── backend/                    # Python FastAPI 后端
│   ├── main.py                # FastAPI 入口
│   ├── core/                  # 核心模块
│   │   ├── __init__.py       # 真相文件、规则引擎、Agent
│   │   └── ...
│   └── api/                   # API 路由
│       └── routes.py
├── frontend/                   # HTML/CSS/JS 前端
│   ├── index.html             # 主界面 (8标签页)
│   ├── style.css             # 现代深色UI
│   └── app.js                # 前端逻辑
├── electron/                   # Electron 配置
│   ├── main.js               # 主进程
│   ├── preload.js           # 预加载脚本
│   └── package.json         # 构建配置
├── assets/                    # 资源文件
├── dist/                      # 打包输出
├── requirements.txt          # Python 依赖
└── README.md                 # 本文件
```

## 🎯 核心功能

### 1. 项目管理
- 新建/打开/保存/删除项目
- 导入/导出项目（JSON格式）
- 自动保存（每30秒）
- 本地文件存储

### 2. 8标签页工作台
- **世界观** - 世界设定、力量体系、文化规则
- **角色** - 人物卡片、性格特点、成长弧线
- **剧情** - 主线支线、冲突链、转折点
- **主题** - 核心主题、情感弧线、哲学追问
- **文风** - 叙事视角、基调风格、语言特点
- **结构** - 叙事弧、章节大纲、时间线
- **黄金** - 黄金台词、高潮场景、关键名场面
- **校验** - 规则引擎、一致性检查

### 3. 规则引擎
7大类规则自动校验：
- 世界观自洽性
- 角色能力边界
- 剧情逻辑链
- 主题一致性
- 文风统一性
- 结构完整性
- 黄金元素检查

### 4. Agent 集群
7个专业 Agent 协同创作：
- 💭 **Ideation** - 创意大师，头脑风暴
- 👤 **Character** - 角色塑造师
- 📖 **Plot** - 剧情架构师
- 🌍 **World** - 世界观构建师
- ✍️ **Style** - 文风设计师
- 🔍 **Critic** - 理性批评家
- ✏️ **Editor** - 终极编辑

## 🛠️ 技术栈

| 层级 | 技术 |
|-----|------|
| 后端 | Python 3.9+ / FastAPI / Uvicorn |
| 前端 | HTML5 / CSS3 / Vanilla JavaScript |
| 桌面 | Electron 28 |
| 打包 | PyInstaller / electron-builder |
| 存储 | 本地 JSON 文件 |

## ⌨️ 快捷键

| 快捷键 | 功能 |
|-------|------|
| Ctrl+S | 保存当前页面 |
| Ctrl+N | 新建项目 |
| Ctrl+O | 打开项目 |
| Ctrl+Tab | 切换标签页 |
| Ctrl+1-8 | 切换到对应标签页 |

## 📦 发布版本

- **Windows 安装版** - NSIS 安装程序
- **Windows 便携版** - 单文件 EXE，直接运行

## 🔧 开发说明

### API 文档

启动后端服务后访问：
- Swagger UI: http://127.0.0.1:8765/docs
- ReDoc: http://127.0.0.1:8765/redoc

### 构建自定义

修改 `electron/package.json` 中的 `build` 配置可自定义：
- 应用名称
- 图标
- 输出格式
- 安装选项

## 📄 许可证

MIT License

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 现代 Python Web 框架
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- 所有开源项目的贡献者

---

**墨境** - 让每一个故事都有迹可循。
