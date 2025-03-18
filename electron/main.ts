import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Store from "electron-store";

import fs from "fs";

const _ = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));


// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

const cacheStore = new Store({
  name: "catch"
});

const taskStore = new Store({
  name: "task"
});

const recordStore = new Store({
  name: "record"
});

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // 暴露文件系统 API
  ipcMain.handle("read-dir", (_, dirPath) => {
    return fs.readdirSync(dirPath).map((file: string) => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
      };
    });
  });

  ipcMain.handle("open-directory-dialog", async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return filePaths[0];
  });

  ipcMain.handle("open-file", async (_, filePath: string) => {
    try {
      const stats = fs.statSync(filePath); // 等待 stat 结果
      if (stats.isFile()) {
        const data = fs.readFileSync(filePath, { encoding: "utf8" }); // 读取文件
        console.log("读取文件成功:", data);
        return data; // 返回文件内容
      }
      return "Not a file"; // 不是文件，返回提示
    } catch (err) {
      console.error("读取文件出错:", err);
      return "error"; // 发生错误
    }
  });

  ipcMain.handle("cacheStore:get", (_, key) => {
    return cacheStore.get(key);
  });

  ipcMain.handle("cacheStore:set", (_, key, value) => {
    cacheStore.set(key, value);
    return true;
  });


  ipcMain.handle("taskStore:get", (_, key) => {
    return taskStore.get(key);
  });

  ipcMain.handle("taskStore:set", (_, key, value) => {
    taskStore.set(key, value);
    return true;
  });

  ipcMain.handle("taskStore:list", () => {
    return taskStore.store;
  });

  ipcMain.handle("recordStore:get", (_, key) => {
    return recordStore.get(key);
  });

  ipcMain.handle("recordStore:set", (_, key, value) => {
    recordStore.set(key, value);
    return true;
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
