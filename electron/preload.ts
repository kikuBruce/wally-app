import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('open-directory-dialog'),
  readDirectory: (path: string) => ipcRenderer.invoke('read-dir', path),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),
  cacheStoreGet: (key: string) => ipcRenderer.invoke('cacheStore:get', key),
  cacheStoreSet: (key: string, value: string) => ipcRenderer.invoke('cacheStore:set', key, value),
  taskStoreGet: (key: string) => ipcRenderer.invoke('taskStore:get', key),
  taskStoreList: () => ipcRenderer.invoke('taskStore:list'),
  taskStoreSet: (key: string, value: string) => ipcRenderer.invoke('taskStore:set', key, value),
  recordStoreGet: (key: string) => ipcRenderer.invoke('recordStore:get', key),
  recordStoreSet: (key: string, value: string) => ipcRenderer.invoke('reocrdStore:set', key, value)
})
