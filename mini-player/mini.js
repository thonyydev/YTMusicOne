document.getElementById("prev").onclick = () => {
  window.electronAPI.sendControl("prev");
};
document.getElementById("playpause").onclick = () => {
  window.electronAPI.sendControl("playpause");
};
document.getElementById("next").onclick = () => {
  window.electronAPI.sendControl("next");
};
document.getElementById("close").onclick = () => {
  window.electronAPI.closeMini();
};

window.electronAPI.onUpdateTrack(({ title, artist }) => {
  document.getElementById("title").textContent = title;
  document.getElementById("artist").textContent = artist;
});
