"""
墨境·高概念网文AI创作引擎 - 核心模块
真相文件管理、规则引擎、Agent集群
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict, field
from pathlib import Path
import hashlib


# ==================== 数据模型 ====================

@dataclass
class TruthFile:
    """真相文件基类"""
    id: str
    name: str
    category: str
    created_at: str
    updated_at: str
    version: int
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'TruthFile':
        return cls(**data)


@dataclass
class WorldTruthFile(TruthFile):
    """真相文件1：世界观真相"""
    world_name: str = ""
    genres: List[str] = field(default_factory=list)
    time_setting: str = ""
    location_setting: str = ""
    cultural_rules: List[str] = field(default_factory=list)
    social_structure: Dict[str, Any] = field(default_factory=dict)
    power_system: Dict[str, Any] = field(default_factory=dict)
    taboos: List[str] = field(default_factory=list)
    core_values: List[str] = field(default_factory=list)


@dataclass
class CharacterTruthFile(TruthFile):
    """真相文件2：角色真相"""
    characters: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_character(self, character: Dict[str, Any]) -> None:
        character['id'] = str(uuid.uuid4())
        character['created_at'] = datetime.now().isoformat()
        self.characters.append(character)
    
    def update_character(self, char_id: str, data: Dict[str, Any]) -> bool:
        for i, char in enumerate(self.characters):
            if char.get('id') == char_id:
                self.characters[i].update(data)
                self.characters[i]['updated_at'] = datetime.now().isoformat()
                return True
        return False
    
    def delete_character(self, char_id: str) -> bool:
        for i, char in enumerate(self.characters):
            if char.get('id') == char_id:
                self.characters.pop(i)
                return True
        return False


@dataclass
class PlotTruthFile(TruthFile):
    """真相文件3：剧情真相"""
    main_plot: str = ""
    sub_plots: List[Dict[str, Any]] = field(default_factory=list)
    conflict_chains: List[str] = field(default_factory=list)
    turning_points: List[Dict[str, Any]] = field(default_factory=list)
    ending_type: str = ""
    foreshadowing: List[Dict[str, str]] = field(default_factory=list)


@dataclass
class ThemeTruthFile(TruthFile):
    """真相文件4：主题真相"""
    core_themes: List[str] = field(default_factory=list)
    sub_themes: List[str] = field(default_factory=list)
    emotional_arcs: List[str] = field(default_factory=list)
    symbolic_elements: List[Dict[str, str]] = field(default_factory=list)
    philosophical_questions: List[str] = field(default_factory=list)


@dataclass
class StyleTruthFile(TruthFile):
    """真相文件5：文风真相"""
    narrative_perspective: str = ""
    tone: str = ""
    language_level: str = ""
    pacing: str = ""
    dialogue_style: str = ""
    description_style: str = ""
    prohibited_elements: List[str] = field(default_factory=list)
    signature_elements: List[str] = field(default_factory=list)


@dataclass
class StructureTruthFile(TruthFile):
    """真相文件6：结构真相"""
    story_arcs: List[Dict[str, Any]] = field(default_factory=list)
    chapter_outline: List[Dict[str, str]] = field(default_factory=list)
    pacing_chart: List[Dict[str, Any]] = field(default_factory=list)
    timeline: List[Dict[str, str]] = field(default_factory=list)


@dataclass
class GoldenTruthFile(TruthFile):
    """真相文件7：黄金真相"""
    golden_dialogues: List[Dict[str, Any]] = field(default_factory=list)
    climactic_scenes: List[Dict[str, Any]] = field(default_factory=list)
    key_moments: List[Dict[str, str]] = field(default_factory=list)
    emotional_peaks: List[Dict[str, Any]] = field(default_factory=list)


# ==================== 项目管理器 ====================

class ProjectManager:
    """项目管理器"""
    
    def __init__(self, base_path: Optional[Path] = None):
        self.base_path = base_path or Path.home() / "墨境" / "projects"
        self.current_project: Optional[Dict[str, Any]] = None
        self.current_project_path: Optional[Path] = None
        
    def create_project(self, name: str, description: str = "") -> Dict[str, Any]:
        """创建新项目"""
        project_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        project = {
            "id": project_id,
            "name": name,
            "description": description,
            "created_at": now,
            "updated_at": now,
            "version": "1.0.0",
            "truth_files": {
                "world": self._create_default_world(),
                "character": self._create_default_character(),
                "plot": self._create_default_plot(),
                "theme": self._create_default_theme(),
                "style": self._create_default_style(),
                "structure": self._create_default_structure(),
                "golden": self._create_default_golden()
            }
        }
        
        # 保存项目
        self._save_project(project, name)
        self.current_project = project
        self.current_project_path = self.base_path / name
        
        return project
    
    def _create_default_world(self) -> dict:
        return asdict(WorldTruthFile(
            id=str(uuid.uuid4()),
            name="世界观真相",
            category="world",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1
        ))
    
    def _create_default_character(self) -> dict:
        return asdict(CharacterTruthFile(
            id=str(uuid.uuid4()),
            name="角色真相",
            category="character",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1,
            characters=[]
        ))
    
    def _create_default_plot(self) -> dict:
        return asdict(PlotTruthFile(
            id=str(uuid.uuid4()),
            name="剧情真相",
            category="plot",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1
        ))
    
    def _create_default_theme(self) -> dict:
        return asdict(ThemeTruthFile(
            id=str(uuid.uuid4()),
            name="主题真相",
            category="theme",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1
        ))
    
    def _create_default_style(self) -> dict:
        return asdict(StyleTruthFile(
            id=str(uuid.uuid4()),
            name="文风真相",
            category="style",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1
        ))
    
    def _create_default_structure(self) -> dict:
        return asdict(StructureTruthFile(
            id=str(uuid.uuid4()),
            name="结构真相",
            category="structure",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1
        ))
    
    def _create_default_golden(self) -> dict:
        return asdict(GoldenTruthFile(
            id=str(uuid.uuid4()),
            name="黄金真相",
            category="golden",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            version=1
        ))
    
    def _save_project(self, project: Dict, name: str) -> Path:
        """保存项目到文件"""
        project_path = self.base_path / name
        project_path.mkdir(parents=True, exist_ok=True)
        
        project_file = project_path / "project.mj"
        with open(project_file, 'w', encoding='utf-8') as f:
            json.dump(project, f, ensure_ascii=False, indent=2)
        
        return project_file
    
    def save_project(self) -> bool:
        """保存当前项目"""
        if not self.current_project:
            return False
        
        self.current_project["updated_at"] = datetime.now().isoformat()
        name = self.current_project.get("name", "untitled")
        self._save_project(self.current_project, name)
        return True
    
    def load_project(self, name: str) -> Optional[Dict]:
        """加载项目"""
        project_file = self.base_path / name / "project.mj"
        if not project_file.exists():
            return None
        
        with open(project_file, 'r', encoding='utf-8') as f:
            self.current_project = json.load(f)
            self.current_project_path = self.base_path / name
        
        return self.current_project
    
    def list_projects(self) -> List[Dict[str, str]]:
        """列出所有项目"""
        projects = []
        if not self.base_path.exists():
            return projects
        
        for item in self.base_path.iterdir():
            if item.is_dir():
                project_file = item / "project.mj"
                if project_file.exists():
                    try:
                        with open(project_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            projects.append({
                                "name": item.name,
                                "description": data.get("description", ""),
                                "updated_at": data.get("updated_at", ""),
                                "version": data.get("version", "")
                            })
                    except Exception:
                        pass
        
        return sorted(projects, key=lambda x: x.get("updated_at", ""), reverse=True)
    
    def update_truth_file(self, category: str, data: Dict) -> bool:
        """更新真相文件"""
        if not self.current_project:
            return False
        
        self.current_project["truth_files"][category] = data
        self.current_project["updated_at"] = datetime.now().isoformat()
        return True
    
    def export_project(self, export_path: Path, format: str = "json") -> Path:
        """导出项目"""
        if not self.current_project:
            raise ValueError("没有当前项目")
        
        if format == "json":
            export_file = export_path / f"{self.current_project['name']}.json"
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(self.current_project, f, ensure_ascii=False, indent=2)
            return export_file
        
        raise ValueError(f"不支持的导出格式: {format}")
    
    def import_project(self, import_file: Path) -> Dict:
        """导入项目"""
        with open(import_file, 'r', encoding='utf-8') as f:
            project = json.load(f)
        
        # 生成新ID
        project["id"] = str(uuid.uuid4())
        project["created_at"] = datetime.now().isoformat()
        project["updated_at"] = datetime.now().isoformat()
        
        # 保存
        name = project.get("name", "imported")
        self._save_project(project, name)
        
        return project


# ==================== 规则引擎 ====================

class RuleEngine:
    """规则引擎 - 验证故事设定的一致性"""
    
    def __init__(self):
        self.rules: List[Dict] = []
        self._init_default_rules()
    
    def _init_default_rules(self):
        """初始化默认规则"""
        self.rules = [
            {
                "id": "rule_001",
                "name": "世界观自洽性",
                "category": "world",
                "description": "检查世界观设定内部是否矛盾",
                "check_fn": self._check_world_consistency,
                "severity": "error"
            },
            {
                "id": "rule_002",
                "name": "角色能力边界",
                "category": "character",
                "description": "检查角色能力是否符合世界观设定",
                "check_fn": self._check_character_limits,
                "severity": "error"
            },
            {
                "id": "rule_003",
                "name": "剧情逻辑链",
                "category": "plot",
                "description": "检查剧情发展是否符合逻辑",
                "check_fn": self._check_plot_logic,
                "severity": "warning"
            },
            {
                "id": "rule_004",
                "name": "主题一致性",
                "category": "theme",
                "description": "检查主题表达是否一致",
                "check_fn": self._check_theme_consistency,
                "severity": "warning"
            },
            {
                "id": "rule_005",
                "name": "文风统一性",
                "category": "style",
                "description": "检查文风是否统一",
                "check_fn": self._check_style_consistency,
                "severity": "info"
            },
            {
                "id": "rule_006",
                "name": "结构完整性",
                "category": "structure",
                "description": "检查故事结构是否完整",
                "check_fn": self._check_structure_completeness,
                "severity": "error"
            },
            {
                "id": "rule_007",
                "name": "黄金元素检查",
                "category": "golden",
                "description": "检查黄金元素设置是否合理",
                "check_fn": self._check_golden_elements,
                "severity": "info"
            }
        ]
    
    def _check_world_consistency(self, truth_files: Dict) -> Dict:
        """检查世界观自洽性"""
        issues = []
        world = truth_files.get("world", {})
        
        # 检查禁忌与核心价值是否冲突
        taboos = world.get("taboos", [])
        core_values = world.get("core_values", [])
        
        for taboo in taboos:
            for value in core_values:
                if taboo in value or value in taboo:
                    issues.append({
                        "type": "conflict",
                        "message": f"禁忌'{taboo}'与核心价值'{value}'可能存在冲突",
                        "location": "world.taboos/core_values"
                    })
        
        # 检查力量体系是否与文化规则一致
        power_system = world.get("power_system", {})
        cultural_rules = world.get("cultural_rules", [])
        
        if power_system and cultural_rules:
            power_name = power_system.get("name", "")
            for rule in cultural_rules:
                if power_name and power_name not in rule:
                    issues.append({
                        "type": "warning",
                        "message": f"力量体系'{power_name}'未在文化规则中体现",
                        "location": "world.power_system"
                    })
        
        return {
            "rule": "世界观自洽性",
            "passed": len(issues) == 0,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def _check_character_limits(self, truth_files: Dict) -> Dict:
        """检查角色能力边界"""
        issues = []
        world = truth_files.get("world", {})
        character = truth_files.get("character", {})
        
        power_system = world.get("power_system", {})
        characters = character.get("characters", [])
        
        if not power_system or not characters:
            return {
                "rule": "角色能力边界",
                "passed": True,
                "issues": [],
                "summary": "无需检查"
            }
        
        power_name = power_system.get("name", "")
        
        for char in characters:
            abilities = char.get("abilities", [])
            for ability in abilities:
                if power_name and ability not in power_name:
                    issues.append({
                        "type": "warning",
                        "message": f"角色'{char.get('name', '未知')}'的能力'{ability}'与力量体系'{power_name}'可能不匹配",
                        "location": f"character.{char.get('name')}.abilities"
                    })
        
        return {
            "rule": "角色能力边界",
            "passed": len(issues) == 0,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def _check_plot_logic(self, truth_files: Dict) -> Dict:
        """检查剧情逻辑链"""
        issues = []
        plot = truth_files.get("plot", {})
        
        main_plot = plot.get("main_plot", "")
        sub_plots = plot.get("sub_plots", [])
        turning_points = plot.get("turning_points", [])
        
        if not main_plot:
            issues.append({
                "type": "error",
                "message": "缺少主线剧情",
                "location": "plot.main_plot"
            })
        
        # 检查支线与主线的关联
        for sub in sub_plots:
            sub_theme = sub.get("theme", "")
            if main_plot and sub_theme and sub_theme not in main_plot:
                issues.append({
                    "type": "warning",
                    "message": f"支线'{sub.get('name', '未知')}'与主线可能缺乏关联",
                    "location": f"plot.sub_plots.{sub.get('name')}"
                })
        
        # 检查转折点数量
        if len(turning_points) < 3 and main_plot:
            issues.append({
                "type": "info",
                "message": "建议设置至少3个主要转折点以增强故事张力",
                "location": "plot.turning_points"
            })
        
        return {
            "rule": "剧情逻辑链",
            "passed": len([i for i in issues if i["type"] == "error"]) == 0,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def _check_theme_consistency(self, truth_files: Dict) -> Dict:
        """检查主题一致性"""
        issues = []
        theme = truth_files.get("theme", {})
        
        core_themes = theme.get("core_themes", [])
        emotional_arcs = theme.get("emotional_arcs", [])
        
        if len(core_themes) > 3:
            issues.append({
                "type": "info",
                "message": "核心主题超过3个，建议精简以保持聚焦",
                "location": "theme.core_themes"
            })
        
        return {
            "rule": "主题一致性",
            "passed": True,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def _check_style_consistency(self, truth_files: Dict) -> Dict:
        """检查文风统一性"""
        issues = []
        style = truth_files.get("style", {})
        
        prohibited = style.get("prohibited_elements", [])
        signature = style.get("signature_elements", [])
        
        if prohibited and signature:
            for sig in signature:
                if sig in prohibited:
                    issues.append({
                        "type": "error",
                        "message": f"标志性元素'{sig}'被标记为禁止使用",
                        "location": "style.signature_elements/prohibited_elements"
                    })
        
        return {
            "rule": "文风统一性",
            "passed": len(issues) == 0,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def _check_structure_completeness(self, truth_files: Dict) -> Dict:
        """检查结构完整性"""
        issues = []
        structure = truth_files.get("structure", {})
        
        story_arcs = structure.get("story_arcs", [])
        chapter_outline = structure.get("chapter_outline", [])
        
        required_arcs = ["开篇", "发展", "高潮", "结局"]
        existing_arcs = [arc.get("name", "") for arc in story_arcs]
        
        for required in required_arcs:
            if required not in existing_arcs:
                issues.append({
                    "type": "error",
                    "message": f"缺少必要的叙事弧'{required}'",
                    "location": "structure.story_arcs"
                })
                break
        
        if len(chapter_outline) < 10:
            issues.append({
                "type": "info",
                "message": f"章节大纲仅有{len(chapter_outline)}章，建议至少10章以保证故事完整",
                "location": "structure.chapter_outline"
            })
        
        return {
            "rule": "结构完整性",
            "passed": len([i for i in issues if i["type"] == "error"]) == 0,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def _check_golden_elements(self, truth_files: Dict) -> Dict:
        """检查黄金元素"""
        issues = []
        golden = truth_files.get("golden", {})
        
        golden_dialogues = golden.get("golden_dialogues", [])
        climactic_scenes = golden.get("climactic_scenes", [])
        
        if len(golden_dialogues) < 3:
            issues.append({
                "type": "info",
                "message": "建议设置至少3段黄金台词以增强记忆点",
                "location": "golden.golden_dialogues"
            })
        
        if len(climactic_scenes) < 1:
            issues.append({
                "type": "warning",
                "message": "缺少高潮场景设定",
                "location": "golden.climactic_scenes"
            })
        
        return {
            "rule": "黄金元素检查",
            "passed": True,
            "issues": issues,
            "summary": f"检查完成，发现{len(issues)}个问题"
        }
    
    def validate(self, truth_files: Dict) -> Dict:
        """运行所有规则检查"""
        results = []
        error_count = 0
        warning_count = 0
        info_count = 0
        
        for rule in self.rules:
            result = rule["check_fn"](truth_files)
            results.append(result)
            
            if not result["passed"]:
                error_count += 1
            
            for issue in result["issues"]:
                if issue["type"] == "error":
                    error_count += 1
                elif issue["type"] == "warning":
                    warning_count += 1
                else:
                    info_count += 1
        
        return {
            "total_rules": len(self.rules),
            "passed_rules": len([r for r in results if r["passed"]]),
            "failed_rules": len([r for r in results if not r["passed"]]),
            "error_count": error_count,
            "warning_count": warning_count,
            "info_count": info_count,
            "results": results,
            "overall_passed": error_count == 0,
            "summary": f"规则检查完成: {error_count}个错误, {warning_count}个警告, {info_count}个提示",
            "timestamp": datetime.now().isoformat()
        }


# ==================== Agent 集群 ====================

class AgentCluster:
    """Agent 协作集群"""
    
    def __init__(self):
        self.agents: Dict[str, 'Agent'] = {}
        self._init_agents()
    
    def _init_agents(self):
        """初始化所有 Agent"""
        self.agents = {
            "ideation": IdeationAgent(),
            "character": CharacterAgent(),
            "plot": PlotAgent(),
            "world": WorldAgent(),
            "style": StyleAgent(),
            "critic": CriticAgent(),
            "editor": EditorAgent()
        }
    
    def collaborate(self, task: str, context: Dict) -> Dict:
        """Agent 协作执行任务"""
        results = {}
        
        # 根据任务类型确定参与的 Agent
        if task == "generate_world":
            agents_to_use = ["ideation", "world"]
        elif task == "generate_character":
            agents_to_use = ["character", "ideation"]
        elif task == "generate_plot":
            agents_to_use = ["plot", "ideation", "critic"]
        elif task == "review_and_edit":
            agents_to_use = ["critic", "editor", "style"]
        else:
            agents_to_use = list(self.agents.keys())
        
        # 依次执行
        for agent_name in agents_to_use:
            agent = self.agents.get(agent_name)
            if agent:
                result = agent.execute(task, context)
                results[agent_name] = result
                context[f"{agent_name}_result"] = result
        
        return {
            "task": task,
            "agents_used": agents_to_use,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }


class Agent:
    """Agent 基类"""
    
    def __init__(self, name: str, role: str, capabilities: List[str]):
        self.name = name
        self.role = role
        self.capabilities = capabilities
    
    def execute(self, task: str, context: Dict) -> Dict:
        """执行任务"""
        raise NotImplementedError
    
    def think(self, prompt: str, context: Dict) -> str:
        """思考过程"""
        return f"[{self.name}] 思考: {prompt}"


class IdeationAgent(Agent):
    """创意 Agent"""
    
    def __init__(self):
        super().__init__(
            name="Ideation",
            role="创意大师",
            capabilities=["头脑风暴", "概念生成", "灵感发散", "创新思维"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        ideas = []
        
        if task == "generate_world":
            ideas = self._generate_world_ideas(context)
        elif task == "generate_character":
            ideas = self._generate_character_ideas(context)
        elif task == "generate_plot":
            ideas = self._generate_plot_ideas(context)
        else:
            ideas = self._generic_ideas(task, context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "ideas": ideas,
            "confidence": 0.85
        }
    
    def _generate_world_ideas(self, context: Dict) -> List[Dict]:
        genre = context.get("genre", "玄幻")
        return [
            {
                "type": "world_concept",
                "title": f"{genre}世界基础设定",
                "description": "构建一个完整的修仙/异世界体系",
                "elements": ["力量等级", "门派势力", "地理环境", "社会结构"],
                "innovation": "融合传统与现代元素"
            },
            {
                "type": "world_concept",
                "title": "特殊能力系统",
                "description": "独特的修炼体系设计",
                "elements": ["能力来源", "升级方式", "代价机制", "克制关系"],
                "innovation": "引入因果/命运元素"
            }
        ]
    
    def _generate_character_ideas(self, context: Dict) -> List[Dict]:
        return [
            {
                "type": "character_archetype",
                "title": "主角设定",
                "description": "具有成长潜力的核心角色",
                "traits": ["特殊体质", "曲折身世", "坚定目标"],
                "arc": "从弱小到强大的蜕变"
            },
            {
                "type": "character_archetype",
                "title": "对手/反派",
                "description": "有深度的对立角色",
                "traits": ["强大实力", "合理动机", "独特魅力"],
                "arc": "与主角的对抗与成长"
            }
        ]
    
    def _generate_plot_ideas(self, context: Dict) -> List[Dict]:
        return [
            {
                "type": "plot_hook",
                "title": "开局钩子",
                "description": "吸引读者的开场设计",
                "elements": ["悬念", "冲突", "情感共鸣点"]
            },
            {
                "type": "plot_structure",
                "title": "三幕结构",
                "description": "经典叙事结构",
                "acts": ["建置", "对抗", "解决"]
            }
        ]
    
    def _generic_ideas(self, task: str, context: Dict) -> List[Dict]:
        return [
            {
                "type": "generic",
                "title": f"关于{task}的建议",
                "description": "基于现有上下文的创新思路",
                "suggestions": ["深入挖掘细节", "增加情感层次", "设置反转"]
            }
        ]


class CharacterAgent(Agent):
    """角色 Agent"""
    
    def __init__(self):
        super().__init__(
            name="Character",
            role="角色塑造师",
            capabilities=["人物设计", "性格塑造", "关系构建", "成长弧设计"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        characters = []
        
        if task == "generate_character":
            characters = self._create_characters(context)
        else:
            characters = self._develop_existing(context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "characters": characters,
            "relationships": self._build_relationships(characters),
            "confidence": 0.9
        }
    
    def _create_characters(self, context: Dict) -> List[Dict]:
        return [
            {
                "id": str(uuid.uuid4()),
                "name": "待命名主角",
                "role_type": "protagonist",
                "traits": {
                    "strengths": ["勇敢", "智慧", "坚韧"],
                    "weaknesses": ["冲动", "固执"],
                    "fears": ["失去所爱之人"],
                    "desires": ["保护重要的人", "变得更强"]
                },
                "background": {
                    "origin": "普通家庭",
                    "turning_point": "意外获得特殊能力"
                },
                "arc": {
                    "start": "对世界充满好奇的初学者",
                    "middle": "经历挫折与失去",
                    "end": "成长为独当一面的强者"
                }
            }
        ]
    
    def _develop_existing(self, context: Dict) -> List[Dict]:
        return context.get("characters", [])
    
    def _build_relationships(self, characters: List[Dict]) -> List[Dict]:
        relationships = []
        if len(characters) >= 2:
            relationships.append({
                "from": characters[0].get("name", "角色1"),
                "to": characters[1].get("name", "角色2") if len(characters) > 1 else "待定",
                "type": "mentor" if len(characters) > 1 else "ally",
                "description": "亦师亦友的关系"
            })
        return relationships


class PlotAgent(Agent):
    """剧情 Agent"""
    
    def __init__(self):
        super().__init__(
            name="Plot",
            role="剧情架构师",
            capabilities=["故事设计", "冲突构建", "节奏把控", "悬念设置"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        if task == "generate_plot":
            plot = self._design_plot(context)
        else:
            plot = self._develop_plot(context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "plot": plot,
            "beat_sheet": self._create_beat_sheet(plot),
            "confidence": 0.88
        }
    
    def _design_plot(self, context: Dict) -> Dict:
        return {
            "main_plot": {
                "premise": "一个关于成长与救赎的故事",
                "inciting_incident": "打破常规的事件",
                "rising_action": ["冲突1", "冲突2", "冲突3"],
                "climax": "决定性的对抗",
                "falling_action": "余波与反思",
                "resolution": "新的平衡"
            },
            "sub_plots": [
                {
                    "name": "感情线",
                    "arc": "从陌生到相知"
                },
                {
                    "name": "复仇线",
                    "arc": "从仇恨到释然"
                }
            ]
        }
    
    def _develop_plot(self, context: Dict) -> Dict:
        return context.get("plot", {})
    
    def _create_beat_sheet(self, plot: Dict) -> List[Dict]:
        beats = [
            {"beat": "开篇场景", "description": "建立世界与主角现状"},
            {"beat": "催化事件", "description": "打破平静的事件"},
            {"beat": "辩论", "description": "主角挣扎是否行动"},
            {"beat": "第二幕开始", "description": "踏出舒适区"},
            {"beat": "_funny", "description": "新世界的适应/趣事"},
            {"beat": "中点", "description": "重大发现或反转"},
            {"beat": "反派逼近", "description": "压力升级"},
            {"beat": "一无所有", "description": "重大失败"},
            {"beat": "第三幕开始", "description": "重新审视一切"},
            {"beat": " finale", "description": "最终决战/高潮"},
            {"beat": "结局", "description": "新常态"}
        ]
        return beats


class WorldAgent(Agent):
    """世界观 Agent"""
    
    def __init__(self):
        super().__init__(
            name="World",
            role="世界观构建师",
            capabilities=["世界设计", "规则制定", "逻辑自洽", "细节填充"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        world = self._build_world(context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "world": world,
            "consistency_check": self._check_consistency(world),
            "confidence": 0.92
        }
    
    def _build_world(self, context: Dict) -> Dict:
        return {
            "basic_info": {
                "name": "待命名世界",
                "genre": "玄幻",
                "era": "古代/架空",
                "scale": "多界域"
            },
            "geography": {
                "regions": ["主角出生地", "冒险起点", "终极目标地"],
                "features": ["特殊地形", "危险区域", "隐秘之地"]
            },
            "politics": {
                "factions": ["主要势力1", "主要势力2", "隐秘组织"],
                "conflicts": "势力间的微妙平衡"
            },
            "culture": {
                "beliefs": ["核心信仰体系"],
                "practices": ["独特习俗"],
                "taboos": ["绝对禁止的行为"]
            },
            "magic_system": {
                "name": "力量体系名称",
                "source": "力量的来源",
                "rules": ["核心规则1", "核心规则2"],
                "limitations": ["限制条件"]
            }
        }
    
    def _check_consistency(self, world: Dict) -> Dict:
        issues = []
        checks = []
        
        # 检查地理与政治的关联
        regions = world.get("geography", {}).get("regions", [])
        factions = world.get("politics", {}).get("factions", [])
        
        if len(regions) < len(factions):
            issues.append("势力数量可能超过地理区域数量")
        
        checks.append({
            "check": "地理政治一致性",
            "passed": len(issues) == 0,
            "issues": issues
        })
        
        return {
            "checks": checks,
            "overall": len(issues) == 0
        }


class StyleAgent(Agent):
    """文风 Agent"""
    
    def __init__(self):
        super().__init__(
            name="Style",
            role="文风设计师",
            capabilities=["语言风格", "叙事节奏", "情感渲染", "文字质感"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        style = self._define_style(context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "style": style,
            "examples": self._generate_examples(style),
            "confidence": 0.86
        }
    
    def _define_style(self, context: Dict) -> Dict:
        return {
            "tone": {
                "primary": "热血",
                "secondary": ["温情", "幽默", "悬疑"],
                "forbidden": ["过于压抑"]
            },
            "rhythm": {
                "description": "张弛有度",
                "fast_paced": ["战斗", "冲突", "危机"],
                "slow_paced": ["日常", "情感", "思考"]
            },
            "language": {
                "level": "中等偏文学",
                "features": ["动作描写生动", "对话简洁有力", "心理描写细腻"]
            },
            "signature": {
                "elements": ["独特的比喻", "金句频出"],
                "paragraph": "经典段落示例"
            }
        }
    
    def _generate_examples(self, style: Dict) -> List[str]:
        return [
            f"示例一：描写{style.get('rhythm', {}).get('fast_paced', ['战斗'])[0]}场景",
            f"示例二：描写{style.get('rhythm', {}).get('slow_paced', ['日常'])[0]}场景",
            "示例三：关键对白"
        ]


class CriticAgent(Agent):
    """批评 Agent"""
    
    def __init__(self):
        super().__init__(
            name="Critic",
            role="理性批评家",
            capabilities=["逻辑分析", "问题发现", "改进建议", "质量评估"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        critique = self._critique(context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "critique": critique,
            "score": self._calculate_score(critique),
            "confidence": 0.8
        }
    
    def _critique(self, context: Dict) -> Dict:
        return {
            "strengths": [
                "创意独特，设定有新意",
                "角色塑造立体，有成长空间",
                "剧情结构清晰"
            ],
            "weaknesses": [
                "部分设定需要更详细的解释",
                "某些情节转折可能过于突兀"
            ],
            "suggestions": [
                "加强前期铺垫，让转折更自然",
                "丰富配角形象，增加支线趣味"
            ],
            "risk_points": [
                "力量体系可能存在逻辑漏洞",
                "节奏把控需要加强"
            ]
        }
    
    def _calculate_score(self, critique: Dict) -> Dict:
        return {
            "overall": 7.5,
            "creativity": 8.5,
            "consistency": 7.0,
            "engagement": 8.0,
            "market_potential": 7.5
        }


class EditorAgent(Agent):
    """编辑 Agent"""
    
    def __init__(self):
        super().__init__(
            name="Editor",
            role="终极编辑",
            capabilities=["内容整合", "质量把控", "最终优化", "格式规范"]
        )
    
    def execute(self, task: str, context: Dict) -> Dict:
        edits = self._make_edits(context)
        
        return {
            "agent": self.name,
            "role": self.role,
            "edits": edits,
            "final_review": self._final_review(edits),
            "confidence": 0.95
        }
    
    def _make_edits(self, context: Dict) -> List[Dict]:
        return [
            {
                "type": "integration",
                "description": "整合各Agent的输出，确保一致性"
            },
            {
                "type": "polish",
                "description": "润色文字，提升可读性"
            },
            {
                "type": "format",
                "description": "规范化输出格式"
            }
        ]
    
    def _final_review(self, edits: List[Dict]) -> Dict:
        return {
            "passed": True,
            "ready": True,
            "notes": "所有检查通过，可以进入下一阶段"
        }


# ==================== 导出核心类 ====================

__all__ = [
    'TruthFile', 'WorldTruthFile', 'CharacterTruthFile', 'PlotTruthFile',
    'ThemeTruthFile', 'StyleTruthFile', 'StructureTruthFile', 'GoldenTruthFile',
    'ProjectManager', 'RuleEngine', 'AgentCluster',
    'Agent', 'IdeationAgent', 'CharacterAgent', 'PlotAgent', 'WorldAgent',
    'StyleAgent', 'CriticAgent', 'EditorAgent'
]
