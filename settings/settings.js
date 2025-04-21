const settingsKeys = ["minimizeToTray", "showNotifications"];

window.electronAPI.getSettings().then((settings) => {
  settingsKeys.forEach((key) => {
    document.getElementById(key).checked = settings[key];
  });
});

settingsKeys.forEach((key) => {
  document.getElementById(key).addEventListener("change", () => {
    const newSettings = {};
    settingsKeys.forEach((k) => {
      newSettings[k] = document.getElementById(k).checked;
    });
    window.electronAPI.saveSettings(newSettings);
  });
});
