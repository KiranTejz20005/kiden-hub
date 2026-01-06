const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const isDev = !app.isPackaged;

    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        backgroundColor: '#090C10', // Match your app theme
        titleBarStyle: 'hidden', // Optional: for custom title bar if you want
        titleBarOverlay: {
            color: '#090C10',
            symbolColor: '#ffffff'
        },
        autoHideMenuBar: true
    });

    if (isDev) {
        // In dev, wait for Vite to serve
        win.loadURL('http://localhost:8080'); // Assuming default vite port + script to run on 8080 or check logic
        win.webContents.openDevTools();
    } else {
        // In production, load the built index.html
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
