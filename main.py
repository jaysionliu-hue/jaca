# 墨境·高概念网文AI引擎 - Python 后端入口

from backend.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
