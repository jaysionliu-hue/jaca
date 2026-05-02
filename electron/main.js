/**
 * 墨境·高概念网文AI创作引擎 - Electron 主进程
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, shell, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// 开发/生产环境判断
const isDev = !app.isPackaged;

// 全局变量
let mainWindow = null;
let backendProcess = null;
let tray = null;

// 获取资源路径
function getResourcePath(relativePath) {
    if (isDev) {
        return path.join(__dirname, '..', relativePath);
    }
    return path.join(process.resourcesPath, relativePath);
}

// 获取用户数据路径
function getUserDataPath() {
    return app.getPath('userData');
}

// 创建主窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: '墨境·高概念网文AI创作引擎',
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        show: false,
        icon: path.join(__dirname, '../assets/icon.png')
    });

    // 创建菜单
    createMenu();

    // 加载页面
    if (isDev) {
        mainWindow.loadURL('http://127.0.0.1:8765');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'));
    }

    // 显示窗口
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('Main window ready');
    });

    // 窗口关闭时最小化到托盘
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 窗口失焦时隐藏开发工具
    mainWindow.on('blur', () => {
        if (isDev && mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
        }
    });
}

// 创建系统托盘
function createTray() {
    // 创建简单的托盘图标
    const iconSize = 16;
    const icon = nativeImage.createEmpty();
    
    tray = new Tray(icon.resize({ width: iconSize, height: iconSize }));
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示墨境',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: '新建项目',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('menu-action', 'new-project');
                }
            }
        },
        {
            label: '打开项目',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('menu-action', 'open-project');
                }
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('墨境·高概念网文AI创作引擎');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

// 创建应用菜单
function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '新建项目',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow.webContents.send('menu-action', 'new-project')
                },
                {
                    label: '打开项目',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => mainWindow.webContents.send('menu-action', 'open-project')
                },
                {
                    label: '保存',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => mainWindow.webContents.send('menu-action', 'save')
                },
                { type: 'separator' },
                {
                    label: '导出项目',
                    click: () => mainWindow.webContents.send('menu-action', 'export')
                },
                {
                    label: '导入项目',
                    click: () => mainWindow.webContents.send('menu-action', 'import')
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
                    click: () => {
                        app.isQuitting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '世界观',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => mainWindow.webContents.send('menu-action', 'tab-world')
                },
                {
                    label: '角色',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => mainWindow.webContents.send('menu-action', 'tab-character')
                },
                {
                    label: '剧情',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => mainWindow.webContents.send('menu-action', 'tab-plot')
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: '工具',
            submenu: [
                {
                    label: '运行校验',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.webContents.send('menu-action', 'validate')
                },
                { type: 'separator' },
                {
                    label: 'AI 生成',
                    submenu: [
                        {
                            label: '生成世界观',
                            click: () => mainWindow.webContents.send('menu-action', 'generate-world')
                        },
                        {
                            label: '生成角色',
                            click: () => mainWindow.webContents.send('menu-action', 'generate-character')
                        },
                        {
                            label: '生成剧情',
                            click: () => mainWindow.webContents.send('menu-action', 'generate-plot')
                        }
                    ]
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于墨境',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于墨境',
                            message: '墨境·高概念网文AI创作引擎',
                            detail: '版本: 1.0.0\n\n基于7个真相文件的高概念网文创作工具。\n\n帮助作者系统化构建故事世界，打造精品网文。'
                        });
                    }
                },
                {
                    label: '打开数据文件夹',
                    click: () => {
                        const userDataPath = getUserDataPath();
                        shell.openPath(userDataPath);
                    }
                },
                { type: 'separator' },
                {
                    label: '开发者工具',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.toggleDevTools();
                        }
                    }
                }
            ]
        }
    ];

    // macOS 特殊处理
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 启动后端服务
function startBackend() {
    const backendPath = isDev 
        ? path.join(__dirname, '..', 'backend', 'main.py')
        : path.join(process.resourcesPath, 'backend', 'main.exe');

    console.log('Starting backend...');
    console.log('Backend path:', backendPath);

    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

    try {
        if (isDev) {
            backendProcess = spawn(pythonPath, [backendPath, '--port', '8765'], {
                stdio: 'pipe',
                detached: false
            });
        } else {
            backendProcess = spawn(backendPath, ['--port', '8765'], {
                stdio: 'pipe',
                detached: false
            });
        }

        backendProcess.stdout.on('data', (data) => {
            console.log(`Backend: ${data}`);
        });

        backendProcess.stderr.on('data', (data) => {
            console.error(`Backend Error: ${data}`);
        });

        backendProcess.on('error', (error) => {
            console.error('Failed to start backend:', error);
        });

        backendProcess.on('exit', (code) => {
            console.log('Backend exited with code:', code);
        });
    } catch (error) {
        console.error('Backend start error:', error);
    }
}

// 停止后端服务
function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
}

// IPC 处理器
ipcMain.handle('get-app-path', () => {
    return getUserDataPath();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

ipcMain.handle('get-version', () => {
    return app.getVersion();
});

// 应用生命周期
app.whenReady().then(() => {
    console.log('App ready, creating window...');
    
    // 开发模式启动后端
    if (isDev) {
        startBackend();
    }
    
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
    stopBackend();
});

app.on('quit', () => {
    stopBackend();
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
