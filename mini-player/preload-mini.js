const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendControl: (cmd) => ipcRenderer.send("media-control", cmd),
  closeMini: () => ipcRenderer.send("close-mini"),
  onUpdateTrack: (callback) => {
    ipcRenderer.removeAllListeners("update-track"); // Evita múltiplos binds
    ipcRenderer.on("update-track", (_, data) => callback(data));
  },
});
