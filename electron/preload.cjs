const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Add any specific API you want to expose to the renderer here
    // For now, minimal is fine
    platform: process.platform
});
