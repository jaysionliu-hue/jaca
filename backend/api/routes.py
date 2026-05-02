"""
墨境·高概念网文AI创作引擎 - API路由
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from pathlib import Path

from ..core import ProjectManager, RuleEngine, AgentCluster

# 路由实例
router = APIRouter()

# 全局管理器实例
project_manager = ProjectManager()
rule_engine = RuleEngine()
agent_cluster = AgentCluster()


# ==================== 请求/响应模型 ====================

class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""


class UpdateTruthFileRequest(BaseModel):
    category: str
    data: Dict[str, Any]


class ValidateRequest(BaseModel):
    truth_files: Optional[Dict[str, Any]] = None


class AgentTaskRequest(BaseModel):
    task: str
    context: Dict[str, Any]


class ExportRequest(BaseModel):
    format: str = "json"


# ==================== 项目管理 API ====================

@router.get("/api/projects")
async def list_projects():
    """列出所有项目"""
    projects = project_manager.list_projects()
    return {"success": True, "data": projects}


@router.post("/api/projects")
async def create_project(request: CreateProjectRequest):
    """创建新项目"""
    try:
        project = project_manager.create_project(request.name, request.description)
        return {"success": True, "data": project}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/projects/{name}")
async def get_project(name: str):
    """获取项目详情"""
    project = project_manager.load_project(name)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"success": True, "data": project}


@router.post("/api/projects/{name}/save")
async def save_project(name: str):
    """保存项目"""
    if not project_manager.current_project:
        raise HTTPException(status_code=400, detail="没有当前项目")
    
    if project_manager.current_project.get("name") != name:
        raise HTTPException(status_code=400, detail="项目名称不匹配")
    
    success = project_manager.save_project()
    return {"success": success}


@router.post("/api/projects/{name}/open")
async def open_project(name: str):
    """打开项目"""
    project = project_manager.load_project(name)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return {"success": True, "data": project}


@router.post("/api/projects/{name}/export")
async def export_project(name: str, request: ExportRequest):
    """导出项目"""
    project = project_manager.load_project(name)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    try:
        export_path = project_manager.base_path / "exports"
        export_path.mkdir(exist_ok=True)
        export_file = project_manager.export_project(export_path, request.format)
        return {"success": True, "path": str(export_file)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/projects/import")
async def import_project():
    """导入项目 - 前端通过表单上传"""
    return {"success": True, "message": "请使用表单上传.project.mj或.json文件"}


@router.delete("/api/projects/{name}")
async def delete_project(name: str):
    """删除项目"""
    project_path = project_manager.base_path / name
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="项目不存在")
    
    import shutil
    shutil.rmtree(project_path)
    return {"success": True}


# ==================== 真相文件 API ====================

@router.get("/api/truth-files")
async def get_all_truth_files():
    """获取所有真相文件"""
    if not project_manager.current_project:
        raise HTTPException(status_code=400, detail="没有当前项目")
    
    return {
        "success": True,
        "data": project_manager.current_project.get("truth_files", {})
    }


@router.get("/api/truth-files/{category}")
async def get_truth_file(category: str):
    """获取指定类别的真相文件"""
    if not project_manager.current_project:
        raise HTTPException(status_code=400, detail="没有当前项目")
    
    truth_files = project_manager.current_project.get("truth_files", {})
    if category not in truth_files:
        raise HTTPException(status_code=404, detail="真相文件不存在")
    
    return {"success": True, "data": truth_files[category]}


@router.put("/api/truth-files/{category}")
async def update_truth_file(category: str, request: UpdateTruthFileRequest):
    """更新真相文件"""
    if not project_manager.current_project:
        raise HTTPException(status_code=400, detail="没有当前项目")
    
    if request.category != category:
        raise HTTPException(status_code=400, detail="类别不匹配")
    
    success = project_manager.update_truth_file(category, request.data)
    if success:
        # 自动保存
        project_manager.save_project()
        return {"success": True, "data": request.data}
    
    raise HTTPException(status_code=500, detail="更新失败")


@router.post("/api/truth-files/{category}/auto-save")
async def auto_save_truth_file(category: str, data: Dict[str, Any]):
    """自动保存真相文件（防丢失）"""
    if not project_manager.current_project:
        raise HTTPException(status_code=400, detail="没有当前项目")
    
    success = project_manager.update_truth_file(category, data)
    if success:
        project_manager.save_project()
        return {"success": True}
    
    return {"success": False}


# ==================== 规则引擎 API ====================

@router.post("/api/validate")
async def validate_project(request: ValidateRequest = None):
    """运行规则引擎验证"""
    if not project_manager.current_project and not request:
        raise HTTPException(status_code=400, detail="没有当前项目或提供真相文件数据")
    
    if request and request.truth_files:
        truth_files = request.truth_files
    else:
        truth_files = project_manager.current_project.get("truth_files", {})
    
    result = rule_engine.validate(truth_files)
    return {"success": True, "data": result}


@router.get("/api/rules")
async def get_rules():
    """获取所有规则"""
    return {
        "success": True,
        "data": [
            {"id": r["id"], "name": r["name"], "category": r["category"], 
             "description": r["description"], "severity": r["severity"]}
            for r in rule_engine.rules
        ]
    }


# ==================== Agent API ====================

@router.post("/api/agents")
async def run_agent_task(request: AgentTaskRequest):
    """执行 Agent 协作任务"""
    result = agent_cluster.collaborate(request.task, request.context)
    return {"success": True, "data": result}


@router.get("/api/agents/info")
async def get_agents_info():
    """获取所有 Agent 信息"""
    agents_info = []
    for name, agent in agent_cluster.agents.items():
        agents_info.append({
            "name": agent.name,
            "role": agent.role,
            "capabilities": agent.capabilities
        })
    return {"success": True, "data": agents_info}


# ==================== 快捷生成 API ====================

@router.post("/api/generate/world")
async def generate_world(context: Dict[str, Any]):
    """快速生成世界观"""
    result = agent_cluster.collaborate("generate_world", context)
    return {"success": True, "data": result}


@router.post("/api/generate/character")
async def generate_character(context: Dict[str, Any]):
    """快速生成角色"""
    result = agent_cluster.collaborate("generate_character", context)
    return {"success": True, "data": result}


@router.post("/api/generate/plot")
async def generate_plot(context: Dict[str, Any]):
    """快速生成剧情"""
    result = agent_cluster.collaborate("generate_plot", context)
    return {"success": True, "data": result}


# ==================== 系统 API ====================

@router.get("/api/status")
async def get_status():
    """获取系统状态"""
    return {
        "success": True,
        "data": {
            "version": "1.0.0",
            "status": "running",
            "current_project": project_manager.current_project.get("name") if project_manager.current_project else None,
            "project_count": len(project_manager.list_projects()),
            "timestamp": datetime.now().isoformat()
        }
    }


@router.get("/api/config")
async def get_config():
    """获取配置信息"""
    return {
        "success": True,
        "data": {
            "base_path": str(project_manager.base_path),
            "api_mode": "local",
            "features": {
                "auto_save": True,
                "auto_validate": False,
                "ai_suggestions": True
            }
        }
    }
