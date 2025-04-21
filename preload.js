const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload: YouTube Music carregado.");
});

function simulateKeyPress(key) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: key,
    code: `Key${key.toUpperCase()}`,
    composed: true,
  });

  document.dispatchEvent(event);
}

ipcRenderer.on("media-control", (_, command) => {
  switch (command) {
    case "playpause": {
      const video = document.querySelector("video");
      if (video) {
        video.paused ? video.play() : video.pause();
        console.log("⏯️ Play/Pause via vídeo");
      }
      break;
    }

    case "next": {
      simulateKeyPress("j"); // Avançar para próxima
      console.log("⏭ Próxima (tecla J)");
      break;
    }

    case "prev": {
      simulateKeyPress("h"); // Voltar para anterior
      console.log("⏮ Anterior (tecla H)");
      break;
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  let lastTrack = "";

  const observer = new MutationObserver(() => {
    const title = document
      .querySelector(".title.ytmusic-player-bar")
      ?.textContent?.trim();
    const artist = document
      .querySelector(".byline.ytmusic-player-bar")
      ?.textContent?.trim();

    const trackId = `${title} - ${artist}`;

    if (title && artist && trackId !== lastTrack) {
      lastTrack = trackId;
      ipcRenderer.send("track-changed", { title, artist });
      console.log("🎵 Nova faixa detectada:", trackId);
    }
  });

  const target = document.querySelector("ytmusic-player-bar");
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
    console.log("🎯 Observador de título/artista ativado.");
  } else {
    console.warn("⚠️ ytmusic-player-bar não encontrado.");
  }
});