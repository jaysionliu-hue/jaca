/**
 * 墨境·高概念网文AI创作引擎 - Electron Preload 脚本
 * 用于安全地在渲染进程和主进程之间通信
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 获取应用路径
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    
    // 对话框
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // 版本信息
    getVersion: () => ipcRenderer.invoke('get-version'),
    
    // 菜单动作监听
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', (event, action) => callback(action));
    },
    
    // 移除监听器
    removeMenuActionListener: () => {
        ipcRenderer.removeAllListeners('menu-action');
    }
});

console.log('Preload script loaded');
