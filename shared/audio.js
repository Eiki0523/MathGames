// MathGame_browser shared/audio.js
// Web Audio API でBGM/SEを生成する共通モジュール。
// iPhone/Safari対策として、ユーザー操作時に primeAudio() を呼ぶ。

export const AudioManager = (() => {
  let ctx = null;
  let enabled = true;
  let bgmTimer = null;
  let bgmStep = 0;
  let bgmMode = "normal";

  function getContext(){
    if(!enabled) return null;
    if(!ctx){
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if(!AudioCtor) return null;
      ctx = new AudioCtor();
    }
    if(ctx.state === "suspended"){
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function primeAudio(){
    const c = getContext();
    if(!c) return;
    if(c.state === "suspended") c.resume().catch(() => {});
    try{
      const osc = c.createOscillator();
      const gain = c.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.02);
    }catch(e){}
  }

  function setEnabled(value){
    enabled = !!value;
    if(!enabled) stopBgm();
    else primeAudio();
  }

  function isEnabled(){
    return enabled;
  }

  function playOsc(c,start,freq,endFreq,dur,type,vol,dest){
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1,freq),start);
    if(endFreq && endFreq !== freq){
      osc.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),start+dur);
    }
    gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(vol,start+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    osc.connect(gain).connect(dest || c.destination);
    osc.start(start);
    osc.stop(start+dur+0.04);
  }

  function playNoise(c,start,dur,vol,dest){
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
    const src = c.createBufferSource();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(900,start);
    gain.gain.setValueAtTime(vol,start);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    src.buffer = buffer;
    src.connect(filter).connect(gain).connect(dest || c.destination);
    src.start(start);
    src.stop(start+dur+0.02);
  }

  function playSE(type){
    const c = getContext();
    if(!c) return;
    const now = c.currentTime + 0.01;
    const master = c.createGain();
    const comp = c.createDynamicsCompressor();
    master.gain.setValueAtTime(0.78,now);
    master.connect(comp).connect(c.destination);

    if(type === "correct"){
      [783.99,1174.66,1567.98,2349.32].forEach((f,i) => {
        playOsc(c,now+i*0.012,f,f*1.18,0.16,i%2 ? "sine":"triangle",0.044-i*0.004,master);
      });
      playNoise(c,now+0.015,0.08,0.012,master);
      return;
    }
    if(type === "hit"){
      playOsc(c,now,146.83,73.42,0.24,"sawtooth",0.082,master);
      playOsc(c,now+0.015,293.66,97.99,0.20,"square",0.050,master);
      playOsc(c,now+0.025,987.77,1567.98,0.13,"triangle",0.046,master);
      playNoise(c,now+0.018,0.16,0.040,master);
      return;
    }
    if(type === "miss"){
      playOsc(c,now,150,82,0.16,"sawtooth",0.070,master);
      playOsc(c,now+0.015,90,55,0.18,"square",0.035,master);
      return;
    }
    if(type === "defeat"){
      [523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>{
        playOsc(c,now+i*0.045,f,f*1.25,0.18,i%2 ? "sine":"triangle",0.060-i*0.006,master);
      });
      playNoise(c,now+0.08,0.18,0.020,master);
      return;
    }
    if(type === "count"){
      playOsc(c,now,523.25,659.25,0.12,"triangle",0.060,master);
      playOsc(c,now,1046.5,1318.5,0.10,"sine",0.032,master);
      return;
    }
    if(type === "start"){
      [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
        playOsc(c,now+i*0.018,f,f*1.08,0.18,"triangle",0.045,master);
      });
      return;
    }
    if(type === "timeup"){
      playOsc(c,now,880,880,0.18,"square",0.070,master);
      playOsc(c,now+0.22,880,880,0.28,"square",0.075,master);
      return;
    }
    if(type === "fail"){
      playOsc(c,now,392,196,0.38,"sawtooth",0.080,master);
      playOsc(c,now+0.08,247,110,0.45,"triangle",0.060,master);
      return;
    }
    if(type === "result"){
      [392,523.25,659.25,783.99].forEach((f,i)=>{
        playOsc(c,now+i*0.075,f,f,0.22,"triangle",0.060,master);
        playOsc(c,now+i*0.075,f*2,f*2,0.16,"sine",0.025,master);
      });
    }
  }

  function playBgmStep(){
    if(!enabled || !bgmTimer) return;
    const c = getContext();
    if(!c || c.state !== "running") return;
    const now = c.currentTime + 0.01;
    const tense = bgmMode === "tense";

    // 壮大寄りの進行。normalは英雄的、tenseは神殿＋闇の圧を強める。
    const normalChords = [
      [146.83,220.00,293.66,369.99,440.00],
      [174.61,261.63,329.63,392.00,523.25],
      [130.81,196.00,261.63,329.63,392.00],
      [164.81,246.94,311.13,369.99,493.88]
    ];
    const tenseChords = [
      [110.00,164.81,220.00,261.63,329.63],
      [123.47,185.00,233.08,293.66,369.99],
      [98.00,146.83,196.00,246.94,311.13],
      [116.54,174.61,233.08,277.18,349.23]
    ];
    const chords = tense ? tenseChords : normalChords;
    const stepInBar = bgmStep % 8;
    const bar = Math.floor(bgmStep / 8);
    const chord = chords[bar % chords.length];
    const root = chord[0];
    const mid = chord[(stepInBar % 3) + 1];
    const high = chord[(stepInBar % 4) + 1] * (stepInBar % 2 ? 2 : 1);

    const master = c.createGain();
    master.gain.setValueAtTime(0.0001,now);
    master.gain.exponentialRampToValueAtTime(tense ? 0.72 : 0.64,now+0.025);
    master.gain.exponentialRampToValueAtTime(0.0001,now+0.62);
    master.connect(c.destination);

    if(stepInBar === 0 || stepInBar === 4){
      playOsc(c,now,root,root*0.995,0.64,"sawtooth",tense ? 0.105 : 0.095,master);
      playOsc(c,now,root/2,root/2,0.56,"triangle",tense ? 0.082 : 0.072,master);
    }

    [chord[1], chord[2], chord[3]].forEach((f,i) => {
      playOsc(c,now+i*0.022,f,f,0.46,tense ? "triangle" : "sine",tense ? 0.055 : 0.050,master);
      playOsc(c,now+i*0.022,f*2,f*2.006,0.32,"sine",tense ? 0.030 : 0.040,master);
    });

    if(tense){
      playOsc(c,now+0.035,mid*2,mid*2.018,0.22,"square",0.045,master);
      playOsc(c,now+0.08,high,high*1.01,0.26,"triangle",0.048,master);
      if(stepInBar === 7) playNoise(c,now+0.04,0.16,0.018,master);
    }else{
      playOsc(c,now+0.06,high,high*1.008,0.32,"triangle",0.046,master);
      if(stepInBar === 7) playOsc(c,now+0.02,root*2,root*2.25,0.35,"sine",0.040,master);
    }
    bgmStep++;
  }

  function startBgm(mode = "normal"){
    stopBgm();
    if(!enabled) return;
    bgmMode = mode;
    bgmStep = 0;
    primeAudio();
    bgmTimer = setInterval(playBgmStep,330);
    playBgmStep();
    setTimeout(playBgmStep,120);
  }

  function stopBgm(){
    if(bgmTimer){
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function wireUserGestureUnlock(){
    ["pointerdown","touchstart","mousedown","keydown"].forEach(evt => {
      window.addEventListener(evt, () => {
        if(enabled) primeAudio();
      }, {passive:true});
    });
  }

  return {
    primeAudio,
    setEnabled,
    isEnabled,
    playSE,
    startBgm,
    stopBgm,
    wireUserGestureUnlock
  };
})();
