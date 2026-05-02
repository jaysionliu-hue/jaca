/**
 * 墨境·高概念网文AI创作引擎 - 前端应用逻辑
 */

// ==================== 全局状态 ====================
const AppState = {
    currentProject: null,
    currentTab: 'world',
    isDirty: false,
    autoSaveEnabled: true,
    apiEndpoint: 'http://127.0.0.1:8765',
    autoSaveInterval: null,
    tags: {
        'world-genres': [],
        'theme-core-themes': [],
        'theme-sub-themes': []
    },
    characters: [],
    subPlots: [],
    turningPoints: [],
    chapters: [],
    timelineItems: [],
    goldenDialogues: [],
    climacticScenes: [],
    keyMoments: []
};

// ==================== API 封装 ====================
const API = {
    async request(endpoint, options = {}) {
        const url = `${AppState.apiEndpoint}${endpoint}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || '请求失败');
            }
            return data.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // 项目相关
    async listProjects() {
        return this.request('/api/projects');
    },
    
    async createProject(name, description) {
        return this.request('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    },
    
    async getProject(name) {
        return this.request(`/api/projects/${encodeURIComponent(name)}`);
    },
    
    async saveProject(name) {
        return this.request(`/api/projects/${encodeURIComponent(name)}/save`, {
            method: 'POST'
        });
    },
    
    async deleteProject(name) {
        return this.request(`/api/projects/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
    },
    
    // 真相文件相关
    async getTruthFiles() {
        return this.request('/api/truth-files');
    },
    
    async getTruthFile(category) {
        return this.request(`/api/truth-files/${category}`);
    },
    
    async updateTruthFile(category, data) {
        return this.request(`/api/truth-files/${category}`, {
            method: 'PUT',
            body: JSON.stringify({ category, data })
        });
    },
    
    async autoSaveTruthFile(category, data) {
        return this.request(`/api/truth-files/${category}/auto-save`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // 校验相关
    async validate(truthFiles = null) {
        const url = truthFiles 
            ? '/api/validate' 
            : '/api/validate';
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify({ truth_files: truthFiles })
        });
    },
    
    async getRules() {
        return this.request('/api/rules');
    },
    
    // Agent 相关
    async runAgentTask(task, context) {
        return this.request('/api/agents', {
            method: 'POST',
            body: JSON.stringify({ task, context })
        });
    },
    
    async getAgentsInfo() {
        return this.request('/api/agents/info');
    },
    
    // 生成相关
    async generateWorld(context) {
        return this.request('/api/generate/world', {
            method: 'POST',
            body: JSON.stringify(context)
        });
    },
    
    async generateCharacter(context) {
        return this.request('/api/generate/character', {
            method: 'POST',
            body: JSON.stringify(context)
        });
    },
    
    async generatePlot(context) {
        return this.request('/api/generate/plot', {
            method: 'POST',
            body: JSON.stringify(context)
        });
    },
    
    // 系统状态
    async getStatus() {
        return this.request('/api/status');
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initEventListeners();
    initAutoSave();
    loadSettings();
    checkConnection();
});

// ==================== 标签页管理 ====================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // 切换按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 切换内容
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${tabId}`) {
                    content.classList.add('active');
                }
            });
            
            AppState.currentTab = tabId;
            
            // 加载标签页数据
            if (AppState.currentProject) {
                loadTabData(tabId);
            }
        });
    });
}

function initEventListeners() {
    // 快捷键
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    saveCurrentTab(AppState.currentTab);
                    break;
                case 'n':
                    e.preventDefault();
                    showProjectModal();
                    break;
                case 'Tab':
                    e.preventDefault();
                    switchTab();
                    break;
            }
        }
    });
}

// ==================== 项目管理 ====================
async function showProjectModal() {
    document.getElementById('projectModal').classList.add('active');
    await loadProjectList();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function loadProjectList() {
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const projects = await API.listProjects();
        
        if (projects.length === 0) {
            projectList.innerHTML = `
                <div class="empty-state">
                    <p>暂无项目</p>
                    <p>创建一个新项目开始创作</p>
                </div>
            `;
        } else {
            projectList.innerHTML = projects.map(p => `
                <div class="project-item" onclick="openProject('${p.name}')">
                    <div class="project-info">
                        <h4>${p.name}</h4>
                        <p>${p.description || '无描述'} | 更新于 ${formatDate(p.updated_at)}</p>
                    </div>
                    <div class="project-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-small btn-secondary" onclick="deleteProject('${p.name}')">删除</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        projectList.innerHTML = `
            <div class="empty-state">
                <p>加载失败: ${error.message}</p>
            </div>
        `;
    }
}

function showCreateProject() {
    closeModal('projectModal');
    document.getElementById('createProjectModal').classList.add('active');
}

async function createProject() {
    const name = document.getElementById('newProjectName').value.trim();
    const description = document.getElementById('newProjectDesc').value.trim();
    
    if (!name) {
        showToast('请输入项目名称', 'warning');
        return;
    }
    
    try {
        const project = await API.createProject(name, description);
        AppState.currentProject = project;
        
        closeModal('createProjectModal');
        document.getElementById('currentProjectName').textContent = name;
        
        showToast('项目创建成功', 'success');
        await loadAllTabData();
        await loadProjectList();
    } catch (error) {
        showToast('创建失败: ' + error.message, 'error');
    }
}

async function openProject(name) {
    try {
        const project = await API.getProject(name);
        AppState.currentProject = project;
        AppState.isDirty = false;
        
        closeModal('projectModal');
        document.getElementById('currentProjectName').textContent = name;
        
        showToast('项目加载成功', 'success');
        await loadAllTabData();
    } catch (error) {
        showToast('加载失败: ' + error.message, 'error');
    }
}

async function deleteProject(name) {
    if (!confirm(`确定要删除项目「${name}」吗？此操作不可恢复。`)) {
        return;
    }
    
    try {
        await API.deleteProject(name);
        showToast('项目已删除', 'success');
        await loadProjectList();
        
        if (AppState.currentProject?.name === name) {
            AppState.currentProject = null;
            document.getElementById('currentProjectName').textContent = '选择项目';
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ==================== 数据加载 ====================
async function loadAllTabData() {
    if (!AppState.currentProject) return;
    
    const truthFiles = AppState.currentProject.truth_files;
    
    // 加载各标签页数据
    loadWorldData(truthFiles.world);
    loadCharacterData(truthFiles.character);
    loadPlotData(truthFiles.plot);
    loadThemeData(truthFiles.theme);
    loadStyleData(truthFiles.style);
    loadStructureData(truthFiles.structure);
    loadGoldenData(truthFiles.golden);
}

async function loadTabData(tabId) {
    if (!AppState.currentProject) return;
    
    const truthFiles = AppState.currentProject.truth_files;
    
    switch(tabId) {
        case 'world': loadWorldData(truthFiles.world); break;
        case 'character': loadCharacterData(truthFiles.character); break;
        case 'plot': loadPlotData(truthFiles.plot); break;
        case 'theme': loadThemeData(truthFiles.theme); break;
        case 'style': loadStyleData(truthFiles.style); break;
        case 'structure': loadStructureData(truthFiles.structure); break;
        case 'golden': loadGoldenData(truthFiles.golden); break;
    }
}

// ==================== 世界观数据 ====================
function loadWorldData(data) {
    if (!data) return;
    
    document.getElementById('world-name').value = data.world_name || '';
    document.getElementById('world-time-setting').value = data.time_setting || '';
    document.getElementById('world-location-setting').value = data.location_setting || '';
    document.getElementById('world-cultural-rules').value = (data.cultural_rules || []).join('\n');
    document.getElementById('world-social-structure').value = JSON.stringify(data.social_structure || {}, null, 2);
    document.getElementById('world-taboos').value = (data.taboos || []).join('\n');
    document.getElementById('world-core-values').value = (data.core_values || []).join('\n');
    
    // 力量体系
    const powerSystem = data.power_system || {};
    document.getElementById('power-name').value = powerSystem.name || '';
    document.getElementById('power-rules').value = powerSystem.rules?.join('\n') || '';
    
    // 标签
    setTags('world-genres', data.genres || []);
}

function collectWorldData() {
    const powerSystem = document.getElementById('power-rules').value.split('\n').filter(s => s.trim());
    
    return {
        id: AppState.currentProject.truth_files.world.id,
        name: "世界观真相",
        category: "world",
        updated_at: new Date().toISOString(),
        version: 1,
        world_name: document.getElementById('world-name').value,
        genres: AppState.tags['world-genres'],
        time_setting: document.getElementById('world-time-setting').value,
        location_setting: document.getElementById('world-location-setting').value,
        cultural_rules: document.getElementById('world-cultural-rules').value.split('\n').filter(s => s.trim()),
        social_structure: {},
        power_system: {
            name: document.getElementById('power-name').value,
            rules: powerSystem
        },
        taboos: document.getElementById('world-taboos').value.split('\n').filter(s => s.trim()),
        core_values: document.getElementById('world-core-values').value.split('\n').filter(s => s.trim())
    };
}

// ==================== 角色数据 ====================
function loadCharacterData(data) {
    if (!data) return;
    
    const characters = data.characters || [];
    AppState.characters = characters;
    renderCharacterList();
}

function renderCharacterList() {
    const container = document.getElementById('characterList');
    
    if (AppState.characters.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>暂无角色</p>
                <button class="btn btn-primary" onclick="addCharacter()">添加第一个角色</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.characters.map((char, index) => `
        <div class="character-card">
            <div class="character-card-header">
                <span class="character-name">${char.name || '未命名角色'}</span>
                <span class="character-role">${char.role_type || '待定'}</span>
            </div>
            <div class="character-traits">
                <div class="trait-group">
                    <h4>性格特点</h4>
                    <div class="trait-tags">
                        ${(char.traits?.strengths || []).map(t => `<span class="trait-tag">${t}</span>`).join('')}
                    </div>
                </div>
                <div class="trait-group">
                    <h4>弱点/缺陷</h4>
                    <div class="trait-tags">
                        ${(char.traits?.weaknesses || []).map(t => `<span class="trait-tag">${t}</span>`).join('')}
                    </div>
                </div>
                <div class="trait-group">
                    <h4>核心欲望</h4>
                    <div class="trait-tags">
                        ${(char.traits?.desires || []).map(t => `<span class="trait-tag">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="character-actions">
                <button class="btn btn-small btn-secondary" onclick="editCharacter(${index})">编辑</button>
                <button class="btn btn-small btn-secondary" onclick="deleteCharacter(${index})">删除</button>
            </div>
        </div>
    `).join('');
}

function addCharacter() {
    const newChar = {
        id: generateId(),
        name: '新角色',
        role_type: 'protagonist',
        traits: {
            strengths: [],
            weaknesses: [],
            fears: [],
            desires: []
        },
        background: {
            origin: '',
            turning_point: ''
        },
        arc: {
            start: '',
            middle: '',
            end: ''
        },
        created_at: new Date().toISOString()
    };
    
    AppState.characters.push(newChar);
    renderCharacterList();
}

function editCharacter(index) {
    const char = AppState.characters[index];
    const newName = prompt('角色名称:', char.name);
    if (newName !== null) {
        char.name = newName;
        renderCharacterList();
        markDirty();
    }
}

function deleteCharacter(index) {
    if (confirm('确定删除该角色？')) {
        AppState.characters.splice(index, 1);
        renderCharacterList();
        markDirty();
    }
}

function collectCharacterData() {
    return {
        id: AppState.currentProject.truth_files.character.id,
        name: "角色真相",
        category: "character",
        updated_at: new Date().toISOString(),
        version: 1,
        characters: AppState.characters
    };
}

// ==================== 剧情数据 ====================
function loadPlotData(data) {
    if (!data) return;
    
    document.getElementById('plot-main-plot').value = data.main_plot || '';
    document.getElementById('plot-conflicts').value = (data.conflict_chains || []).join('\n');
    document.getElementById('plot-ending-type').value = data.ending_type || '';
    document.getElementById('plot-foreshadowing').value = (data.foreshadowing || []).map(f => f.text).join('\n');
    
    // 支线剧情
    AppState.subPlots = data.sub_plots || [];
    renderSubPlots();
    
    // 转折点
    AppState.turningPoints = data.turning_points || [];
    renderTurningPoints();
}

function renderSubPlots() {
    const container = document.getElementById('sub-plots-list');
    let html = AppState.subPlots.map((sub, i) => `
        <div class="sub-item">
            <input type="text" placeholder="支线名称" value="${sub.name || ''}" 
                   onchange="updateSubPlot(${i}, 'name', this.value)">
            <input type="text" placeholder="支线描述" value="${sub.arc || ''}" 
                   onchange="updateSubPlot(${i}, 'arc', this.value)">
            <span class="remove-btn" onclick="removeSubPlot(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addSubPlot()">+ 添加支线</button>';
    container.innerHTML = html;
}

function addSubPlot() {
    AppState.subPlots.push({ name: '', arc: '' });
    renderSubPlots();
    markDirty();
}

function updateSubPlot(index, field, value) {
    AppState.subPlots[index][field] = value;
    markDirty();
}

function removeSubPlot(index) {
    AppState.subPlots.splice(index, 1);
    renderSubPlots();
    markDirty();
}

function renderTurningPoints() {
    const container = document.getElementById('turning-points-list');
    let html = AppState.turningPoints.map((tp, i) => `
        <div class="sub-item">
            <input type="text" placeholder="转折点位置" value="${tp.location || ''}" 
                   onchange="updateTurningPoint(${i}, 'location', this.value)">
            <input type="text" placeholder="转折点描述" value="${tp.description || ''}" 
                   onchange="updateTurningPoint(${i}, 'description', this.value)">
            <span class="remove-btn" onclick="removeTurningPoint(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addTurningPoint()">+ 添加转折点</button>';
    container.innerHTML = html;
}

function addTurningPoint() {
    AppState.turningPoints.push({ location: '', description: '' });
    renderTurningPoints();
    markDirty();
}

function updateTurningPoint(index, field, value) {
    AppState.turningPoints[index][field] = value;
    markDirty();
}

function removeTurningPoint(index) {
    AppState.turningPoints.splice(index, 1);
    renderTurningPoints();
    markDirty();
}

function collectPlotData() {
    return {
        id: AppState.currentProject.truth_files.plot.id,
        name: "剧情真相",
        category: "plot",
        updated_at: new Date().toISOString(),
        version: 1,
        main_plot: document.getElementById('plot-main-plot').value,
        sub_plots: AppState.subPlots,
        conflict_chains: document.getElementById('plot-conflicts').value.split('\n').filter(s => s.trim()),
        turning_points: AppState.turningPoints,
        ending_type: document.getElementById('plot-ending-type').value,
        foreshadowing: document.getElementById('plot-foreshadowing').value.split('\n')
            .filter(s => s.trim()).map(text => ({ text }))
    };
}

// ==================== 主题数据 ====================
function loadThemeData(data) {
    if (!data) return;
    
    setTags('theme-core-themes', data.core_themes || []);
    setTags('theme-sub-themes', data.sub_themes || []);
    document.getElementById('theme-emotion-arcs').value = (data.emotional_arcs || []).join('\n');
    document.getElementById('theme-symbolic').value = (data.symbolic_elements || []).map(e => `${e.name}: ${e.description}`).join('\n');
    document.getElementById('theme-philosophy').value = (data.philosophical_questions || []).join('\n');
}

function collectThemeData() {
    return {
        id: AppState.currentProject.truth_files.theme.id,
        name: "主题真相",
        category: "theme",
        updated_at: new Date().toISOString(),
        version: 1,
        core_themes: AppState.tags['theme-core-themes'],
        sub_themes: AppState.tags['theme-sub-themes'],
        emotional_arcs: document.getElementById('theme-emotion-arcs').value.split('\n').filter(s => s.trim()),
        symbolic_elements: [],
        philosophical_questions: document.getElementById('theme-philosophy').value.split('\n').filter(s => s.trim())
    };
}

// ==================== 文风数据 ====================
function loadStyleData(data) {
    if (!data) return;
    
    document.getElementById('style-perspective').value = data.narrative_perspective || '';
    document.getElementById('style-tone').value = data.tone || '';
    document.getElementById('style-language-level').value = data.language_level || '';
    document.getElementById('style-pacing').value = data.pacing || '';
    document.getElementById('style-dialogue').value = data.dialogue_style || '';
    document.getElementById('style-description').value = data.description_style || '';
    document.getElementById('style-prohibited').value = (data.prohibited_elements || []).join('\n');
    document.getElementById('style-signature').value = (data.signature_elements || []).join('\n');
}

function collectStyleData() {
    return {
        id: AppState.currentProject.truth_files.style.id,
        name: "文风真相",
        category: "style",
        updated_at: new Date().toISOString(),
        version: 1,
        narrative_perspective: document.getElementById('style-perspective').value,
        tone: document.getElementById('style-tone').value,
        language_level: document.getElementById('style-language-level').value,
        pacing: document.getElementById('style-pacing').value,
        dialogue_style: document.getElementById('style-dialogue').value,
        description_style: document.getElementById('style-description').value,
        prohibited_elements: document.getElementById('style-prohibited').value.split('\n').filter(s => s.trim()),
        signature_elements: document.getElementById('style-signature').value.split('\n').filter(s => s.trim())
    };
}

// ==================== 结构数据 ====================
function loadStructureData(data) {
    if (!data) return;
    
    // 叙事弧
    const arcs = data.story_arcs || [];
    const arcNames = ['开篇', '发展', '高潮', '结局'];
    const arcsHtml = arcNames.map((name, i) => {
        const arc = arcs.find(a => a.name === name) || {};
        return `
            <div class="arc-item">
                <span class="arc-name">${name}</span>
                <input type="text" placeholder="${name}描述" value="${arc.description || ''}" 
                       onchange="updateArc(${i}, this.value)">
            </div>
        `;
    }).join('');
    document.getElementById('story-arcs-list').innerHTML = arcsHtml;
    
    // 章节大纲
    AppState.chapters = data.chapter_outline || [];
    renderChapters();
    
    // 时间线
    AppState.timelineItems = data.timeline || [];
    renderTimeline();
}

function updateArc(index, value) {
    // 简单实现，实际需要保存到数据结构
    markDirty();
}

function renderChapters() {
    const container = document.getElementById('chapter-outline');
    let html = AppState.chapters.map((ch, i) => `
        <div class="chapter-item">
            <span class="chapter-number">${i + 1}</span>
            <input type="text" placeholder="章节名称" value="${ch.name || ''}" 
                   onchange="updateChapter(${i}, 'name', this.value)">
            <input type="text" placeholder="章节描述" value="${ch.description || ''}" 
                   onchange="updateChapter(${i}, 'description', this.value)">
            <span class="remove-btn" onclick="removeChapter(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addChapter()">+ 添加章节</button>';
    container.innerHTML = html;
}

function addChapter() {
    AppState.chapters.push({ name: '', description: '' });
    renderChapters();
    markDirty();
}

function updateChapter(index, field, value) {
    AppState.chapters[index][field] = value;
    markDirty();
}

function removeChapter(index) {
    AppState.chapters.splice(index, 1);
    renderChapters();
    markDirty();
}

function renderTimeline() {
    const container = document.getElementById('timeline-editor');
    let html = AppState.timelineItems.map((item, i) => `
        <div class="timeline-item">
            <input type="text" placeholder="时间点" value="${item.time || ''}" 
                   onchange="updateTimelineItem(${i}, 'time', this.value)">
            <input type="text" placeholder="事件描述" value="${item.event || ''}" 
                   onchange="updateTimelineItem(${i}, 'event', this.value)">
            <span class="remove-btn" onclick="removeTimelineItem(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addTimelineItem()">+ 添加时间点</button>';
    container.innerHTML = html;
}

function addTimelineItem() {
    AppState.timelineItems.push({ time: '', event: '' });
    renderTimeline();
    markDirty();
}

function updateTimelineItem(index, field, value) {
    AppState.timelineItems[index][field] = value;
    markDirty();
}

function removeTimelineItem(index) {
    AppState.timelineItems.splice(index, 1);
    renderTimeline();
    markDirty();
}

function collectStructureData() {
    const arcNames = ['开篇', '发展', '高潮', '结局'];
    const arcItems = document.querySelectorAll('.arc-item');
    const story_arcs = Array.from(arcItems).map((item, i) => ({
        name: arcNames[i],
        description: item.querySelector('input').value
    }));
    
    return {
        id: AppState.currentProject.truth_files.structure.id,
        name: "结构真相",
        category: "structure",
        updated_at: new Date().toISOString(),
        version: 1,
        story_arcs,
        chapter_outline: AppState.chapters,
        pacing_chart: [],
        timeline: AppState.timelineItems
    };
}

// ==================== 黄金数据 ====================
function loadGoldenData(data) {
    if (!data) return;
    
    AppState.goldenDialogues = data.golden_dialogues || [];
    AppState.climacticScenes = data.climactic_scenes || [];
    AppState.keyMoments = data.key_moments || [];
    
    renderGoldenDialogues();
    renderClimacticScenes();
    renderKeyMoments();
}

function renderGoldenDialogues() {
    const container = document.getElementById('golden-dialogues');
    let html = AppState.goldenDialogues.map((gd, i) => `
        <div class="golden-item">
            <textarea placeholder="输入黄金台词..." rows="2" 
                      onchange="updateGoldenDialogue(${i}, this.value)">${gd.text || ''}</textarea>
            <div class="golden-item-meta">
                <input type="text" placeholder="角色" value="${gd.character || ''}" 
                       onchange="updateGoldenDialogueMeta(${i}, 'character', this.value)">
                <input type="text" placeholder="场景" value="${gd.scene || ''}" 
                       onchange="updateGoldenDialogueMeta(${i}, 'scene', this.value)">
            </div>
            <span class="remove-btn" onclick="removeGoldenDialogue(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addGoldenDialogue()">+ 添加黄金台词</button>';
    container.innerHTML = html;
}

function addGoldenDialogue() {
    AppState.goldenDialogues.push({ text: '', character: '', scene: '' });
    renderGoldenDialogues();
    markDirty();
}

function updateGoldenDialogue(index, value) {
    AppState.goldenDialogues[index].text = value;
    markDirty();
}

function updateGoldenDialogueMeta(index, field, value) {
    AppState.goldenDialogues[index][field] = value;
    markDirty();
}

function removeGoldenDialogue(index) {
    AppState.goldenDialogues.splice(index, 1);
    renderGoldenDialogues();
    markDirty();
}

function renderClimacticScenes() {
    const container = document.getElementById('climactic-scenes');
    let html = AppState.climacticScenes.map((cs, i) => `
        <div class="golden-item">
            <textarea placeholder="高潮场景描述..." rows="3" 
                      onchange="updateClimacticScene(${i}, this.value)">${cs.description || ''}</textarea>
            <div class="golden-item-meta">
                <input type="text" placeholder="场景名称" value="${cs.name || ''}" 
                       onchange="updateClimacticSceneMeta(${i}, 'name', this.value)">
                <input type="text" placeholder="情感基调" value="${cs.emotion || ''}" 
                       onchange="updateClimacticSceneMeta(${i}, 'emotion', this.value)">
            </div>
            <span class="remove-btn" onclick="removeClimacticScene(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addClimacticScene()">+ 添加高潮场景</button>';
    container.innerHTML = html;
}

function addClimacticScene() {
    AppState.climacticScenes.push({ name: '', description: '', emotion: '' });
    renderClimacticScenes();
    markDirty();
}

function updateClimacticScene(index, value) {
    AppState.climacticScenes[index].description = value;
    markDirty();
}

function updateClimacticSceneMeta(index, field, value) {
    AppState.climacticScenes[index][field] = value;
    markDirty();
}

function removeClimacticScene(index) {
    AppState.climacticScenes.splice(index, 1);
    renderClimacticScenes();
    markDirty();
}

function renderKeyMoments() {
    const container = document.getElementById('key-moments');
    let html = AppState.keyMoments.map((km, i) => `
        <div class="golden-item">
            <div class="golden-item-meta">
                <input type="text" placeholder="名场面名称" value="${km.name || ''}" 
                       onchange="updateKeyMoment(${i}, 'name', this.value)">
                <input type="text" placeholder="章节/位置" value="${km.location || ''}" 
                       onchange="updateKeyMoment(${i}, 'location', this.value)">
            </div>
            <textarea placeholder="名场面描述..." rows="2" 
                      onchange="updateKeyMoment(${i}, 'description', this.value)">${km.description || ''}</textarea>
            <span class="remove-btn" onclick="removeKeyMoment(${i})">✕</span>
        </div>
    `).join('');
    html += '<button class="btn btn-small" onclick="addKeyMoment()">+ 添加名场面</button>';
    container.innerHTML = html;
}

function addKeyMoment() {
    AppState.keyMoments.push({ name: '', location: '', description: '' });
    renderKeyMoments();
    markDirty();
}

function updateKeyMoment(index, field, value) {
    AppState.keyMoments[index][field] = value;
    markDirty();
}

function removeKeyMoment(index) {
    AppState.keyMoments.splice(index, 1);
    renderKeyMoments();
    markDirty();
}

function collectGoldenData() {
    return {
        id: AppState.currentProject.truth_files.golden.id,
        name: "黄金真相",
        category: "golden",
        updated_at: new Date().toISOString(),
        version: 1,
        golden_dialogues: AppState.goldenDialogues,
        climactic_scenes: AppState.climacticScenes,
        key_moments: AppState.keyMoments,
        emotional_peaks: []
    };
}

function addGoldenElement() {
    showToast('请选择要添加的元素类型', 'info');
}

// ==================== 标签管理 ====================
function setTags(containerId, tags) {
    AppState.tags[containerId] = [...tags];
    renderTags(containerId);
}

function addTag(event, containerId) {
    if (event.key === 'Enter') {
        const input = event.target;
        const tag = input.value.trim();
        
        if (tag && !AppState.tags[containerId].includes(tag)) {
            AppState.tags[containerId].push(tag);
            renderTags(containerId);
            markDirty();
        }
        
        input.value = '';
    }
}

function removeTag(containerId, tag) {
    const index = AppState.tags[containerId].indexOf(tag);
    if (index > -1) {
        AppState.tags[containerId].splice(index, 1);
        renderTags(containerId);
        markDirty();
    }
}

function renderTags(containerId) {
    const container = document.getElementById(containerId);
    const tagsList = container.querySelector('.tags-list');
    
    tagsList.innerHTML = AppState.tags[containerId].map(tag => `
        <span class="tag-item">
            ${tag}
            <span class="remove" onclick="removeTag('${containerId}', '${tag}')">✕</span>
        </span>
    `).join('');
}

// ==================== 保存功能 ====================
async function saveCurrentTab(tabId) {
    if (!AppState.currentProject) {
        showToast('请先打开或创建项目', 'warning');
        return;
    }
    
    updateSaveStatus('saving');
    
    try {
        let data;
        switch(tabId) {
            case 'world': data = collectWorldData(); break;
            case 'character': data = collectCharacterData(); break;
            case 'plot': data = collectPlotData(); break;
            case 'theme': data = collectThemeData(); break;
            case 'style': data = collectStyleData(); break;
            case 'structure': data = collectStructureData(); break;
            case 'golden': data = collectGoldenData(); break;
            default: return;
        }
        
        await API.updateTruthFile(tabId, data);
        AppState.isDirty = false;
        updateSaveStatus('saved');
        showToast('保存成功', 'success');
    } catch (error) {
        updateSaveStatus('error');
        showToast('保存失败: ' + error.message, 'error');
    }
}

function markDirty() {
    AppState.isDirty = true;
    updateSaveStatus('unsaved');
}

function updateSaveStatus(status) {
    const statusEl = document.getElementById('saveStatus');
    statusEl.className = 'save-status ' + status;
    
    switch(status) {
        case 'saved':
            statusEl.textContent = '已保存';
            break;
        case 'saving':
            statusEl.textContent = '保存中...';
            break;
        case 'unsaved':
            statusEl.textContent = '未保存';
            break;
        case 'error':
            statusEl.textContent = '保存失败';
            break;
    }
}

// ==================== 自动保存 ====================
function initAutoSave() {
    // 从设置恢复
    const saved = localStorage.getItem('autoSaveEnabled');
    if (saved !== null) {
        AppState.autoSaveEnabled = saved === 'true';
    }
    
    const toggle = document.getElementById('autoSaveToggle');
    if (toggle) {
        toggle.checked = AppState.autoSaveEnabled;
    }
    
    // 启动自动保存
    if (AppState.autoSaveEnabled) {
        startAutoSave();
    }
}

function startAutoSave() {
    if (AppState.autoSaveInterval) {
        clearInterval(AppState.autoSaveInterval);
    }
    
    AppState.autoSaveInterval = setInterval(() => {
        if (AppState.isDirty && AppState.currentProject) {
            autoSaveCurrentTab();
        }
    }, 30000); // 30秒
}

async function autoSaveCurrentTab() {
    if (!AppState.currentProject || !AppState.isDirty) return;
    
    try {
        let data;
        switch(AppState.currentTab) {
            case 'world': data = collectWorldData(); break;
            case 'character': data = collectCharacterData(); break;
            case 'plot': data = collectPlotData(); break;
            case 'theme': data = collectThemeData(); break;
            case 'style': data = collectStyleData(); break;
            case 'structure': data = collectStructureData(); break;
            case 'golden': data = collectGoldenData(); break;
            default: return;
        }
        
        await API.autoSaveTruthFile(AppState.currentTab, data);
        AppState.isDirty = false;
        updateSaveStatus('saved');
        
        const autoSaveStatus = document.getElementById('autoSaveStatus');
        autoSaveStatus.textContent = `自动保存于 ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
}

// ==================== 校验 ====================
async function runValidation() {
    if (!AppState.currentProject) {
        showToast('请先打开项目', 'warning');
        return;
    }
    
    const resultsContainer = document.getElementById('validationResults');
    resultsContainer.innerHTML = '<div class="loading">校验中...</div>';
    
    try {
        // 先保存当前标签页
        await saveCurrentTab(AppState.currentTab);
        
        const result = await API.validate();
        renderValidationResults(result);
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <p>校验失败: ${error.message}</p>
            </div>
        `;
    }
}

function renderValidationResults(result) {
    const container = document.getElementById('validationResults');
    
    const html = `
        <div class="validation-summary">
            <div class="validation-stat errors">
                <div class="number">${result.error_count || 0}</div>
                <div class="label">错误</div>
            </div>
            <div class="validation-stat warnings">
                <div class="number">${result.warning_count || 0}</div>
                <div class="label">警告</div>
            </div>
            <div class="validation-stat passed">
                <div class="number">${result.passed_rules || 0}/${result.total_rules || 0}</div>
                <div class="label">通过规则</div>
            </div>
        </div>
        <div class="validation-rules">
            ${result.results?.map(r => `
                <div class="validation-rule ${r.passed ? '' : 'failed'}">
                    <div class="validation-rule-header">
                        <span class="validation-rule-name">${r.rule}</span>
                        <span class="validation-rule-status ${r.passed ? 'passed' : 'failed'}">
                            ${r.passed ? '通过' : '未通过'}
                        </span>
                    </div>
                    <div class="validation-issues">
                        ${r.issues?.map(issue => `
                            <div class="validation-issue">
                                <span class="issue-type ${issue.type}">${issue.type === 'error' ? '错误' : issue.type === 'warning' ? '警告' : '提示'}</span>
                                ${issue.message}
                            </div>
                        `).join('') || '<div class="validation-issue">无问题</div>'}
                    </div>
                </div>
            `).join('') || ''}
        </div>
    `;
    
    container.innerHTML = html;
}

async function showRulesInfo() {
    try {
        const rules = await API.getRules();
        showToast(`共有 ${rules.length} 条校验规则`, 'info');
    } catch (error) {
        showToast('获取规则信息失败', 'error');
    }
}

// ==================== AI 生成 ====================
async function generateContent(tabId) {
    if (!AppState.currentProject) {
        showToast('请先打开项目', 'warning');
        return;
    }
    
    const modal = document.getElementById('aiGenerateModal');
    const contentDiv = document.getElementById('aiContent');
    
    modal.classList.add('active');
    contentDiv.innerHTML = '<div class="loading">正在生成...</div>';
    
    try {
        let result;
        switch(tabId) {
            case 'world':
                result = await API.generateWorld({});
                break;
            case 'character':
                result = await API.generateCharacter({});
                break;
            case 'plot':
                result = await API.generatePlot({});
                break;
            default:
                result = await API.runAgentTask(`generate_${tabId}`, {});
        }
        
        renderAiContent(result, tabId);
    } catch (error) {
        contentDiv.innerHTML = `<div class="error">生成失败: ${error.message}</div>`;
    }
}

function renderAiContent(result, tabId) {
    const contentDiv = document.getElementById('aiContent');
    
    let html = '';
    
    if (result.results) {
        Object.values(result.results).forEach(agentResult => {
            if (agentResult.ideas) {
                html += agentResult.ideas.map(idea => `
                    <div class="ai-suggestion">
                        <h4>${idea.title || '建议'}</h4>
                        <p>${idea.description || ''}</p>
                        ${idea.elements ? `<p>元素: ${idea.elements.join(', ')}</p>` : ''}
                    </div>
                `).join('');
            } else if (agentResult.world) {
                html += `
                    <div class="ai-suggestion">
                        <h4>世界观建议</h4>
                        <p><strong>名称:</strong> ${agentResult.world.basic_info?.name || ''}</p>
                        <p><strong>类型:</strong> ${agentResult.world.basic_info?.genre || ''}</p>
                        <p><strong>地理:</strong> ${agentResult.world.geography?.regions?.join(', ') || ''}</p>
                        <p><strong>势力:</strong> ${agentResult.world.politics?.factions?.join(', ') || ''}</p>
                    </div>
                `;
            } else if (agentResult.characters) {
                html += agentResult.characters.map(char => `
                    <div class="ai-suggestion">
                        <h4>角色: ${char.name || '待命名'}</h4>
                        <p>${char.arc?.start || ''}</p>
                    </div>
                `).join('');
            } else if (agentResult.plot) {
                html += `
                    <div class="ai-suggestion">
                        <h4>剧情结构</h4>
                        <p><strong>主线:</strong> ${agentResult.plot.main_plot?.premise || ''}</p>
                        <p><strong>高潮:</strong> ${agentResult.plot.main_plot?.climax || ''}</p>
                    </div>
                `;
            }
        });
    }
    
    if (!html) {
        html = '<div class="empty-state"><p>暂无生成内容</p></div>';
    }
    
    contentDiv.innerHTML = html;
}

function applyAiContent() {
    showToast('已应用 AI 建议（请手动整合到表单中）', 'success');
    closeModal('aiGenerateModal');
}

// ==================== 设置 ====================
function showSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('apiEndpoint').value = AppState.apiEndpoint;
    document.getElementById('autoSaveToggle').checked = AppState.autoSaveEnabled;
}

function saveSettings() {
    AppState.apiEndpoint = document.getElementById('apiEndpoint').value;
    AppState.autoSaveEnabled = document.getElementById('autoSaveToggle').checked;
    
    localStorage.setItem('apiEndpoint', AppState.apiEndpoint);
    localStorage.setItem('autoSaveEnabled', AppState.autoSaveEnabled);
    
    // 更新自动保存
    if (AppState.autoSaveEnabled) {
        startAutoSave();
    } else if (AppState.autoSaveInterval) {
        clearInterval(AppState.autoSaveInterval);
    }
    
    closeModal('settingsModal');
    showToast('设置已保存', 'success');
}

function loadSettings() {
    const apiEndpoint = localStorage.getItem('apiEndpoint');
    const autoSaveEnabled = localStorage.getItem('autoSaveEnabled');
    
    if (apiEndpoint) AppState.apiEndpoint = apiEndpoint;
    if (autoSaveEnabled !== null) AppState.autoSaveEnabled = autoSaveEnabled === 'true';
}

async function testConnection() {
    try {
        await API.getStatus();
        showToast('连接成功', 'success');
    } catch (error) {
        showToast('连接失败: ' + error.message, 'error');
    }
}

// ==================== 帮助 ====================
function showHelpModal() {
    document.getElementById('helpModal').classList.add('active');
}

// ==================== 工具函数 ====================
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function switchTab() {
    const tabs = ['world', 'character', 'plot', 'theme', 'style', 'structure', 'golden', 'validate'];
    const currentIndex = tabs.indexOf(AppState.currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    
    document.querySelector(`[data-tab="${tabs[nextIndex]}"]`).click();
}

async function checkConnection() {
    try {
        await API.getStatus();
        console.log('Backend connected');
    } catch (error) {
        console.warn('Backend not connected, using demo mode');
    }
}

// 导入项目
function showImportProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.mj';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.name) {
                    const project = await API.createProject(data.name + '_imported', data.description || '');
                    showToast('项目导入成功', 'success');
                    closeModal('projectModal');
                    await loadProjectList();
                }
            } catch (error) {
                showToast('导入失败: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 设置模态框的保存事件
document.addEventListener('DOMContentLoaded', () => {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = '保存设置';
        saveBtn.onclick = saveSettings;
        
        const modalBody = settingsModal.querySelector('.modal-body');
        const formActions = document.createElement('div');
        formActions.className = 'form-actions';
        formActions.appendChild(saveBtn);
        modalBody.appendChild(formActions);
    }
});
