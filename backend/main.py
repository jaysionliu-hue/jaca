"""
墨境·高概念网文AI创作引擎 - FastAPI 入口
"""

import os
import sys
import json
import argparse
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# 导入API路由
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from backend.api.routes import router

# 创建 FastAPI 应用
app = FastAPI(
    title="墨境·高概念网文AI创作引擎",
    description="专业的网文创作辅助工具，基于7个真相文件构建高概念故事",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)

# 获取前端路径
FRONTEND_PATH = Path(__file__).parent.parent / "frontend"


# ==================== 静态文件服务 ====================

@app.get("/")
async def root():
    """返回前端页面"""
    return FileResponse(str(FRONTEND_PATH / "index.html"))


@app.get("/favicon.ico")
async def favicon():
    """返回 favicon"""
    return FileResponse(str(FRONTEND_PATH / "favicon.ico"))


# ==================== 错误处理 ====================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "type": type(exc).__name__
        }
    )


# ==================== 健康检查 ====================

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "墨境·高概念网文AI创作引擎",
        "version": "1.0.0"
    }


# ==================== 启动配置 ====================

def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description="墨境·高概念网文AI创作引擎")
    parser.add_argument("--host", default="127.0.0.1", help="监听主机")
    parser.add_argument("--port", type=int, default=8765, help="监听端口")
    parser.add_argument("--reload", action="store_true", help="启用热重载")
    parser.add_argument("--production", action="store_true", help="生产模式")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    
    print("=" * 60)
    print("  墨境·高概念网文AI创作引擎 v1.0.0")
    print("  高概念网文AI创作，从真相文件开始")
    print("=" * 60)
    print(f"\n  启动服务: http://{args.host}:{args.port}")
    print(f"  API文档:   http://{args.host}:{args.port}/docs")
    print(f"  前端界面: http://{args.host}:{args.port}/")
    print("\n" + "=" * 60)
    
    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )
