import { AudioManager } from "./audio.js";

export function createBgmController(){
  let audioElement = null;

  function stop(){
    AudioManager.stopBgm();
    if(audioElement){
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement = null;
    }
  }

  function start(source){
    stop();
    if(!source) return;

    if(source.type === "generated"){
      AudioManager.startBgm(source.mode || "normal");
      return;
    }

    if(source.type === "file"){
      const audio = new Audio(source.src);
      audio.loop = source.loop !== false;
      audio.volume = source.volume ?? 0.75;
      audio.play().catch(() => {});
      audioElement = audio;
    }
  }

  return { start, stop };
}
