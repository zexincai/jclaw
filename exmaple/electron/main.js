const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: 'ClawApp',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 打包后资源在 resources/ 下，开发时用相对路径
  const distPath = app.isPackaged
    ? path.join(process.resourcesPath, 'h5', 'dist', 'index.html')
    : path.join(__dirname, '..', 'h5', 'dist', 'index.html')

  win.loadFile(distPath)
  win.setMenuBarVisibility(false)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
