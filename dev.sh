#!/bin/bash
# 墨境·高概念网文AI创作引擎 - macOS/Linux 开发启动脚本

echo "============================================"
echo "  墨境·高概念网文AI创作引擎 - 开发模式"
echo "============================================"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未检测到 Python 3，请先安装"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装"
    exit 1
fi

echo "[1/3] 安装 Python 依赖..."
pip3 install -r requirements.txt

echo ""
echo "[2/3] 安装 Electron 依赖..."
cd electron
npm install
cd ..

echo ""
echo "[3/3] 启动后端服务..."
python3 backend/main.py &
BACKEND_PID=$!

echo ""
echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "等待服务就绪..."

# 等待后端启动
sleep 3

echo ""
echo "启动 Electron..."
cd electron
npm run dev

# 清理
kill $BACKEND_PID 2>/dev/null

echo ""
echo "再见！"
