// MathGame_browser shared/game-core.js
// 60秒制・カウントダウン・ゲーム終了処理の共通土台。

export function createGameClock({durationMs = 60000, onTick, onTimeUp} = {}){
  let running = false;
  let startAt = 0;
  let raf = null;

  function start(){
    stop();
    running = true;
    startAt = performance.now();
    tick();
  }

  function tick(){
    if(!running) return;
    const elapsed = performance.now() - startAt;
    const remain = Math.max(0, durationMs - elapsed);
    onTick?.({remain, elapsed, sec: remain / 1000, ratio: remain / durationMs});
    if(remain <= 0){
      running = false;
      onTimeUp?.();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function stop(){
    running = false;
    if(raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function isRunning(){
    return running;
  }

  return {start, stop, isRunning};
}

export function runCountdown({overlay, seconds = 3, onCount, onDone}){
  let cancelled = false;
  overlay.hidden = false;

  for(let i=0;i<seconds;i++){
    const value = seconds - i;
    setTimeout(() => {
      if(cancelled) return;
      overlay.hidden = false;
      overlay.textContent = String(value);
      overlay.classList.remove("pop");
      void overlay.offsetWidth;
      overlay.classList.add("pop");
      onCount?.(value);
    }, i * 1000);
  }

  setTimeout(() => {
    if(cancelled) return;
    overlay.hidden = true;
    overlay.textContent = "";
    onDone?.();
  }, seconds * 1000);

  return {
    cancel(){
      cancelled = true;
      overlay.hidden = true;
      overlay.textContent = "";
    }
  };
}

export function createDeck(items){
  const deck = [...items];
  for(let i=deck.length-1;i>0;i--){
    const j = Math.floor(Math.random() * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
