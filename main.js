const {
  app,
  BrowserWindow,
  nativeImage,
  globalShortcut,
  Tray,
  Menu,
  ipcMain,
  Notification,
} = require("electron");
const path = require("path");

let win;
let tray;

// SETTINGS

const Store = require("electron-store").default;
const store = new Store();

let settingsWindow;

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    title: "Configurações",
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, "settings/preload-settings.js"),
    },
    autoHideMenuBar: true,
  });

  settingsWindow.loadFile("settings/settings.html");

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

// MINI PLAYER

let miniPlayerWindow;

function createMiniPlayerWindow() {
  if (miniPlayerWindow) {
    miniPlayerWindow.show();
    return;
  }

  miniPlayerWindow = new BrowserWindow({
    width: 240,
    height: 80,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, "mini-player/preload-mini.js"),
    },
    autoHideMenuBar: true,
  });

  miniPlayerWindow.loadFile(path.join(__dirname, "mini-player/mini.html"));

  miniPlayerWindow.on("closed", () => {
    miniPlayerWindow = null;
  });
}

// APPLICATION

function createWindow() {
  const iconPath = path.join(__dirname, "assets", "icon.png");

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: nativeImage.createFromPath(iconPath),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  win.loadURL("https://music.youtube.com");

  win.on("minimize", (event) => {
    event.preventDefault();
    //win.hide();
  });

  win.on("close", (event) => {
    const minimizeToTray = store.get("minimizeToTray", true);

    if (!app.isQuiting && minimizeToTray) {
      event.preventDefault();
      win.hide();
      return false;
    }
  });
}

function setupTray() {
  const iconPath = path.join(__dirname, "assets", "icon.png");
  tray = new Tray(
    nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  );

  const contextMenu = Menu.buildFromTemplate([
    { label: "Mostrar YouTube Music", click: () => win.show() },
    { label: "Configurações", click: () => createSettingsWindow() },
    { label: "Mini Player", click: () => createMiniPlayerWindow() },

    {
      label: "Sair",
      click: () => {
        win.webContents
          .executeJavaScript(
            `
            const video = document.querySelector('video');
            if (video) video.pause();
          `
          )
          .finally(() => {
            app.isQuiting = true;
            app.quit();
            app.exit();
          });
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("YouTube Music");
  console.log("Tray carregado com sucesso!");
}

ipcMain.on("track-changed", (_, { title, artist }) => {
  if (tray) {
    tray.setToolTip(`${title} — ${artist}`);
  }

  if (store.get("showNotifications", true)) {
    console.log("🔔 Enviando notificação com faixa atual...");
    new Notification({
      title: "Tocando agora",
      body: `${title} — ${artist}`,
      silent: true,
    }).show();
  } else {
    console.log("🔕 Notificações desativadas nas configurações.");
  }

  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    console.log("📡 Enviando dados para mini player.");
    miniPlayerWindow.webContents.send("update-track", { title, artist });
  } else {
    console.log("ℹ️ Mini player não está aberto ou foi destruído.");
  }
});

ipcMain.handle("get-settings", () => {
  return {
    minimizeToTray: store.get("minimizeToTray", true),
    showNotifications: store.get("showNotifications", true),
  };
});

ipcMain.on("save-settings", (_, data) => {
  store.set(data);
  console.log("⚙️ Settings salvos:", store.store);
});

ipcMain.on("media-control", (_, command) => {
  win.webContents.send("media-control", command);
});

ipcMain.on("close-mini", () => {
  if (miniPlayerWindow) {
    miniPlayerWindow.close();
  }
});

function setupMediaKeys() {
  // Requer que o YouTube Music esteja focado para funcionar
  globalShortcut.register("MediaPlayPause", () => {
    win.webContents.send("media-control", "playpause");
  });

  globalShortcut.register("MediaNextTrack", () => {
    win.webContents.send("media-control", "next");
  });

  globalShortcut.register("MediaPreviousTrack", () => {
    win.webContents.send("media-control", "prev");
  });
}

app.whenReady().then(() => {
  createWindow();
  setupTray();
  setupMediaKeys();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
