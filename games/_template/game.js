import { AudioManager } from "../../shared/audio.js";
import { createBgmController } from "../../shared/bgm.js";
import { createGameClock, runCountdown } from "../../shared/game-core.js";
import { Storage } from "../../shared/storage.js";
import { createScoreState, addHealthBonus, createBestStore } from "../../shared/score.js";
import { gameConfig } from "./config.js";
import { applyThemeVars, renderEnemySvg, themeConfig } from "./theme.js";
import { createProblemSource, nextProblemFromSource } from "./problems.js";
import { mountButtonInput } from "./input/button-input.js";

const bestStore = createBestStore(gameConfig.gameId);
const bgmController = createBgmController();

const els = {
  menuScreen: document.getElementById("menuScreen"),
  gameScreen: document.getElementById("gameScreen"),
  resultScreen: document.getElementById("resultScreen"),
  menuCard: document.getElementById("menuCard"),
  bestOpen: document.getElementById("bestOpen"),
  bestModal: document.getElementById("bestModal"),
  bestClose: document.getElementById("bestClose"),
  bestModalBody: document.getElementById("bestModalBody"),
  bestUnlockStatus: document.getElementById("bestUnlockStatus"),
  gameTitle: document.getElementById("gameTitle"),
  gameSubtitle: document.getElementById("gameSubtitle"),
  gameInstructions: document.getElementById("gameInstructions"),
  resultTitle: document.getElementById("resultTitle"),
  modeGrid: document.getElementById("modeGrid"),
  strongToggle: document.getElementById("strongToggle"),
  soundToggle: document.getElementById("soundToggle"),
  limitToggle: document.getElementById("limitToggle"),
  unlockNote: document.getElementById("unlockNote"),
  timeFill: document.getElementById("timeFill"),
  timeLabel: document.getElementById("timeLabel"),
  killCount: document.getElementById("killCount"),
  scoreNow: document.getElementById("scoreNow"),
  modeLabel: document.getElementById("modeLabel"),
  problem: document.getElementById("problem"),
  answerBox: document.getElementById("answerBox"),
  heroHpBadge: document.getElementById("heroHpBadge"),
  heroHp: document.getElementById("heroHp"),
  battle: document.getElementById("battle"),
  stage: document.getElementById("stage"),
  enemy: document.getElementById("enemy"),
  hpFill: document.getElementById("hpFill"),
  beam: document.getElementById("beam"),
  inputMount: document.getElementById("inputMount"),
  countdownOverlay: document.getElementById("countdownOverlay"),
  giveUp: document.getElementById("giveUp"),
  resultKills: document.getElementById("resultKills"),
  resultScore: document.getElementById("resultScore"),
  resultMiss: document.getElementById("resultMiss"),
  resultCombo: document.getElementById("resultCombo"),
  bestResult: document.getElementById("bestResult"),
  breakdown: document.getElementById("breakdown"),
  retry: document.getElementById("retry"),
  backMenu: document.getElementById("backMenu"),
  toast: document.getElementById("toast")
};

const state = {
  screen: "menu",
  modeId: gameConfig.modes[0].id,
  lastModeId: gameConfig.modes[0].id,
  score: createScoreState(),
  strongUnlocked: Storage.loadFlag(gameConfig.unlock.storageKey),
  strong: false,
  limitMode: false,
  sound: true,
  soundToggleCount: 0,
  running: false,
  ending: false,
  warned30: false,
  warned10: false,
  heroHp: 5,
  current: null,
  input: [],
  source: null,
  countdownController: null,
  debugAnswerUnlocked: false,
  hpPressTimer: null
};

function createClock(durationMs){
  return createGameClock({
    durationMs,
    onTick({ sec, ratio }){
      els.timeLabel.textContent = sec.toFixed(1);
      els.timeFill.style.width = `${ratio * 100}%`;
      if(!state.warned30 && sec <= 30){
        state.warned30 = true;
        triggerTimeWarning("warn");
      }
      if(!state.warned10 && sec <= 10){
        state.warned10 = true;
        triggerTimeWarning("danger");
      }
    },
    onTimeUp(){
      AudioManager.playSE("timeup");
      endGame(false, true);
    }
  });
}

let clock = createClock(gameConfig.defaultDurationMs);

function showScreen(name){
  [els.menuScreen, els.gameScreen, els.resultScreen].forEach(el => el.classList.remove("active"));
  els[`${name}Screen`].classList.add("active");
  state.screen = name;
}

function prefixMatch(full, input){
  if(input.length > full.length) return false;
  for(let i = 0; i < input.length; i++){
    if(full[i] !== input[i]) return false;
  }
  return true;
}

function getCurrentMode(){
  return gameConfig.modes.find(mode => mode.id === state.modeId);
}

function getModeDurationMs(){
  return getCurrentMode()?.durationMs || gameConfig.defaultDurationMs;
}

function getMatchingCandidates(input){
  return state.current.answerCandidates.filter(candidate => prefixMatch(candidate, input));
}

function renderActionInput(tokens){
  if(tokens.length === 0) return "?";
  return tokens.join("");
}

function renderInput(){
  els.answerBox.textContent = renderActionInput(state.input);
  const isWrong = state.input.length > 0 && getMatchingCandidates(state.input).length === 0;
  els.answerBox.classList.toggle("wrong", isWrong);
  const maxLength = Math.max(...state.current.answerCandidates.map(candidate => candidate.length));
  const progress = state.input.length / maxLength;
  els.hpFill.style.width = `${Math.max(0, 1 - progress) * 100}%`;
}

function renderModeButtons(){
  els.modeGrid.innerHTML = "";
  gameConfig.modes.forEach(mode => {
    const btn = document.createElement("button");
    btn.className = "modeBtn";
    btn.dataset.mode = mode.id;
    btn.innerHTML = `<span class="modeName">${mode.menuTitle}</span><span class="modeDesc">${mode.description}</span>`;
    btn.addEventListener("click", () => startGame(mode.id));
    els.modeGrid.appendChild(btn);
  });
}

function setEnemyVisual(kind, mood = "normal"){
  els.enemy.className = `enemy enemy-${kind}${state.strong ? " strong" : ""}`;
  els.enemy.innerHTML = renderEnemySvg(kind, mood);
}

function spawnSparks(){
  const rect = els.stage.getBoundingClientRect();
  const baseX = rect.width * 0.50;
  const baseY = rect.height * 0.42;
  for(let i = 0; i < 12; i++){
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = `${baseX + Math.floor(Math.random() * 45) - 22}px`;
    s.style.top = `${baseY + Math.floor(Math.random() * 37) - 18}px`;
    s.style.setProperty("--dx", `${Math.floor(Math.random() * 153) - 76}px`);
    s.style.setProperty("--dy", `${Math.floor(Math.random() * 125) - 70}px`);
    els.stage.appendChild(s);
    setTimeout(() => s.remove(), 520);
  }
}

function damageEffect(){
  els.beam.classList.remove("fire");
  void els.beam.offsetWidth;
  els.beam.classList.add("fire");
  els.enemy.classList.remove("hit");
  void els.enemy.offsetWidth;
  els.enemy.classList.add("hit");
  spawnSparks();
  AudioManager.playSE("hit");
}

function enemyAttackEffect(){
  els.battle.classList.remove("damaged");
  void els.battle.offsetWidth;
  els.battle.classList.add("damaged");
  setEnemyVisual(state.current.kind, "attack");
  els.enemy.classList.remove("attack");
  void els.enemy.offsetWidth;
  els.enemy.classList.add("attack");
  setTimeout(() => {
    if(state.running && state.current){
      setEnemyVisual(state.current.kind, "normal");
    }
  }, 430);
  AudioManager.playSE("miss");
}

function takeDamage(){
  state.heroHp = Math.max(0, state.heroHp - 1);
  els.heroHp.textContent = String(state.heroHp);
  enemyAttackEffect();
  if(state.heroHp <= 0){
    setTimeout(() => AudioManager.playSE("fail"), 120);
    setTimeout(() => endGame(false, false), 520);
  }
}

function pressCorrectAnswerButton(){
  if(!state.running || state.ending || !state.current) return;
  const target = state.current.answerCandidates[0] || [];
  const remainder = target.slice(state.input.length);
  if(remainder.length === 0){
    handleKey("OK");
    return;
  }
  remainder.forEach(token => handleKey(token));
  handleKey("OK");
}

function unlockDebugAnswerButton(){
  state.debugAnswerUnlocked = true;
  els.heroHpBadge.classList.add("debugReady");
  toast("デバッグ：答えボタンON");
  AudioManager.playSE("start");
}

function startHpLongPress(event){
  event?.preventDefault?.();
  if(state.debugAnswerUnlocked){
    pressCorrectAnswerButton();
    return;
  }
  if(state.hpPressTimer) clearTimeout(state.hpPressTimer);
  state.hpPressTimer = setTimeout(() => {
    unlockDebugAnswerButton();
    state.hpPressTimer = null;
  }, 3000);
}

function cancelHpLongPress(){
  if(state.hpPressTimer){
    clearTimeout(state.hpPressTimer);
    state.hpPressTimer = null;
  }
}

function addAttackPoint(){
  const point = state.strong ? gameConfig.score.strongAttackPoint : gameConfig.score.attackPoint;
  state.score.attackScore += point;
  state.score.score += point;
}

function addDefeatPoint(){
  const defeatPoint = gameConfig.score.defeatPoint;
  const comboPoint = Math.min(state.score.combo * gameConfig.score.comboStep, gameConfig.score.comboMax);
  const extremePoint = state.limitMode ? gameConfig.score.extremeBonus : 0;
  state.score.defeatedScore += defeatPoint;
  state.score.comboScore += comboPoint;
  state.score.extremeBonus += extremePoint;
  state.score.score += defeatPoint + comboPoint + extremePoint;
}

function renderProblem(){
  state.current = nextProblemFromSource(state.source, state.strong);
  state.input = [];
  els.problem.textContent = state.current.promptText;
  const labels = [state.strong ? "強化" : "通常"];
  if(state.limitMode) labels.push("極限");
  els.modeLabel.textContent = `${labels.join("+")} / ${getCurrentMode().name}`;
  setEnemyVisual(state.current.kind);
  renderInput();
}

function handleKey(key){
  if(!state.running || state.ending || !state.current) return;

  if(key === "C"){
    state.input = [];
    renderInput();
    return;
  }
  if(key === "⌫"){
    state.input.pop();
    renderInput();
    return;
  }
  if(key === "OK"){
    if(getMatchingCandidates(state.input).some(candidate => candidate.length === state.input.length)){
      defeatEnemy();
    }else{
      state.score.miss++;
      state.score.combo = 0;
      takeDamage();
      renderInput();
    }
    return;
  }

  const nextInput = [...state.input, ...key.split("")];
  const matching = getMatchingCandidates(nextInput);
  if(matching.length > 0){
    state.input = nextInput;
    addAttackPoint();
    els.scoreNow.textContent = String(state.score.score);
    damageEffect();
    renderInput();
  }else{
    state.score.miss++;
    state.score.combo = 0;
    takeDamage();
    renderInput();
  }
}

function defeatEnemy(){
  state.score.kills++;
  state.score.combo++;
  state.score.maxCombo = Math.max(state.score.maxCombo, state.score.combo);
  addDefeatPoint();
  els.killCount.textContent = String(state.score.kills);
  els.scoreNow.textContent = String(state.score.score);
  AudioManager.playSE("defeat");
  els.enemy.classList.remove("hit");
  els.enemy.classList.add("defeat");
  setTimeout(() => {
    if(state.running && !state.ending){
      renderProblem();
    }
  }, 520);
}

function stopCountdown(){
  if(state.countdownController){
    state.countdownController.cancel();
    state.countdownController = null;
  }
}

function resetStatus(){
  state.score = createScoreState();
  state.heroHp = state.limitMode ? 1 : 5;
  state.warned30 = false;
  state.warned10 = false;
  state.input = [];
  state.current = null;
  state.ending = false;
  state.running = false;
  state.debugAnswerUnlocked = false;
  if(state.hpPressTimer){
    clearTimeout(state.hpPressTimer);
    state.hpPressTimer = null;
  }
  state.source = createProblemSource({ modeId: state.modeId, strong: state.strong });
  els.killCount.textContent = "0";
  els.scoreNow.textContent = "0";
  els.heroHp.textContent = String(state.heroHp);
  els.heroHpBadge.classList.remove("debugReady");
  els.timeLabel.textContent = (getModeDurationMs() / 1000).toFixed(1);
  els.timeFill.style.width = "100%";
  els.timeLabel.classList.remove("timeWarn", "timeDanger");
}

function startGame(modeId){
  AudioManager.primeAudio();
  state.modeId = modeId;
  state.lastModeId = modeId;
  resetStatus();
  clock.stop();
  clock = createClock(getModeDurationMs());
  showScreen("game");
  mountButtonInput({
    mount: els.inputMount,
    onKey: handleKey
  });
  renderProblem();
  stopCountdown();
  state.countdownController = runCountdown({
    overlay: els.countdownOverlay,
    seconds: 3,
    onCount(){ AudioManager.playSE("count"); },
    onDone(){
      state.running = true;
      AudioManager.playSE("start");
      bgmController.start(getCurrentMode().bgm);
      clock.start();
    }
  });
}

function triggerTimeWarning(kind){
  els.timeLabel.classList.remove("timeWarn", "timeDanger");
  void els.timeLabel.offsetWidth;
  els.timeLabel.classList.add(kind === "danger" ? "timeDanger" : "timeWarn");
  AudioManager.playSE(kind === "danger" ? "start" : "count");
}

function bestLabel(modeId, strong){
  const mode = gameConfig.modes.find(item => item.id === modeId);
  return `${strong ? "強化" : "通常"} / ${mode?.name || modeId}`;
}

function recordText(record){
  if(!record) return "記録なし";
  return `${record.kills}体 / ${record.score}点`;
}

function renderBestModal(){
  const section = (strong) => {
    const rows = gameConfig.modes.map(mode => {
      const rec = bestStore.get(mode.id, strong);
      return `
        <div class="bestRow"><strong>${mode.name}</strong><br>
          ${rec ? `${rec.kills}体 / ${rec.score}点<br><small>ミス:${rec.miss}　最大コンボ:${rec.combo}</small>` : `記録なし<br><small>まだ遊んでいません</small>`}
        </div>`;
    }).join("");
    return `<div class="bestSection"><div class="bestSectionTitle">${strong ? gameConfig.best.labels.strong : gameConfig.best.labels.normal}</div><div class="bestRows">${rows}</div></div>`;
  };
  els.bestUnlockStatus.textContent = `強化モード：${state.strongUnlocked ? "解放済み" : "未解放"}`;
  els.bestModalBody.innerHTML = `${section(false)}${section(true)}`;
}

function openBestModal(){
  renderBestModal();
  els.bestModal.hidden = false;
}

function closeBestModal(){
  els.bestModal.hidden = true;
}

function updateMenu(){
  els.menuCard.classList.toggle("strongOn", state.strong);
  els.menuCard.classList.toggle("limitOn", state.limitMode);
  els.strongToggle.hidden = !gameConfig.features.strongMode;
  els.limitToggle.hidden = !gameConfig.features.limitMode;
  els.soundToggle.hidden = !gameConfig.features.soundToggle;
  els.bestOpen.hidden = !gameConfig.features.bestModal;

  if(state.strongUnlocked){
    els.strongToggle.disabled = false;
    els.strongToggle.textContent = state.strong ? themeConfig.labels.strongOn : themeConfig.labels.strongOff;
    if(state.strong && state.limitMode){
      els.unlockNote.textContent = themeConfig.notes.strong;
    }else if(state.strong){
      els.unlockNote.textContent = themeConfig.notes.strong;
    }else if(state.limitMode){
      els.unlockNote.textContent = themeConfig.notes.limit;
    }else{
      els.unlockNote.textContent = themeConfig.notes.unlocked;
    }
  }else{
    state.strong = false;
    els.strongToggle.disabled = true;
    els.strongToggle.textContent = themeConfig.labels.strongLocked;
    els.unlockNote.textContent = state.limitMode ? themeConfig.notes.limit : themeConfig.notes.locked;
  }

  els.soundToggle.textContent = state.sound ? themeConfig.labels.soundOn : themeConfig.labels.soundOff;
  els.limitToggle.textContent = state.limitMode ? themeConfig.labels.limitOn : themeConfig.labels.limitOff;
  els.limitToggle.classList.toggle("on", state.limitMode);
  els.strongToggle.classList.toggle("off", state.strongUnlocked && !state.strong);
  els.limitToggle.classList.toggle("off", !state.limitMode);
  els.soundToggle.classList.toggle("off", !state.sound);
}

function toast(text){
  els.toast.textContent = text;
  els.toast.classList.remove("show");
  void els.toast.offsetWidth;
  els.toast.classList.add("show");
}

function endGame(manual, timeUp = false){
  if(state.ending) return;
  state.ending = true;
  state.running = false;
  stopCountdown();
  clock.stop();
  bgmController.stop();
  if(manual){
    showResult(true, false);
    return;
  }
  setTimeout(() => showResult(false, timeUp), 2000);
}

function showResult(manual, timeUp){
  addHealthBonus(state.score, state.heroHp);
  if(gameConfig.score.healthPoint !== 100){
    state.score.score -= state.score.healthBonus;
    state.score.healthBonus = Math.max(0, state.heroHp) * gameConfig.score.healthPoint;
    state.score.score += state.score.healthBonus;
  }

  let unlockedNow = false;
  if(state.modeId === "mix" && state.score.kills >= gameConfig.unlock.rushKillsForStrong && !state.strongUnlocked){
    state.strongUnlocked = true;
    Storage.saveFlag(gameConfig.unlock.storageKey, true);
    unlockedNow = true;
  }

  const record = {
    mode: state.modeId,
    strong: state.strong,
    kills: state.score.kills,
    score: state.score.score,
    miss: state.score.miss,
    combo: state.score.maxCombo,
    savedAt: new Date().toISOString()
  };
  const bestInfo = bestStore.update(state.modeId, state.strong, record);

  els.resultKills.textContent = String(state.score.kills);
  els.resultScore.textContent = String(state.score.score);
  els.resultMiss.textContent = String(state.score.miss);
  els.resultCombo.textContent = String(state.score.maxCombo);
  els.bestResult.innerHTML = bestInfo.updated
    ? `自己ベスト更新！<br>${bestLabel(state.modeId, state.strong)}：${recordText(bestInfo.bestRecord)}`
    : `自己ベスト<br>${bestLabel(state.modeId, state.strong)}：${recordText(bestInfo.bestRecord)}`;

  els.breakdown.innerHTML = [
    `攻撃成功点：${state.score.attackScore} 点`,
    `撃破点：${state.score.defeatedScore} 点`,
    `連続撃破ボーナス：${state.score.comboScore} 点`,
    `極限モードボーナス：${state.score.extremeBonus} 点`,
    `残り体力ボーナス：${state.score.healthBonus} 点`,
    unlockedNow ? "<strong>強化モード解放！</strong>" : "",
    manual ? "途中終了しました。" : (timeUp ? "時間切れです。" : "戦闘終了。")
  ].filter(Boolean).join("<br>");

  updateMenu();
  showScreen("result");
  if(unlockedNow) toast("強化モード解放！");
  AudioManager.playSE("result");
}

function goMenu(){
  stopCountdown();
  clock.stop();
  state.running = false;
  state.ending = false;
  bgmController.stop();
  updateMenu();
  showScreen("menu");
}

function handleKeydown(event){
  if(state.screen !== "game") return;
  if(event.key >= "0" && event.key <= "9"){
    handleKey(event.key);
    return;
  }
  if(event.key === "-"){
    handleKey("-");
    return;
  }
  if(event.key === "Backspace"){
    handleKey("⌫");
    return;
  }
  if(event.key === "Enter"){
    handleKey("OK");
  }
}

function wireEvents(){
  els.strongToggle.addEventListener("click", () => {
    if(!state.strongUnlocked) return;
    state.strong = !state.strong;
    updateMenu();
    toast(state.strong ? "強化モード ON" : "通常モード");
    AudioManager.playSE("result");
  });

  els.limitToggle.addEventListener("click", () => {
    state.limitMode = !state.limitMode;
    updateMenu();
    toast(state.limitMode ? "極限モード ON：体力1" : "極限モード OFF");
    AudioManager.playSE(state.limitMode ? "start" : "result");
  });

  els.soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    state.soundToggleCount++;
    AudioManager.setEnabled(state.sound);
    if(state.soundToggleCount >= 10 && !state.strongUnlocked){
      state.strongUnlocked = true;
      Storage.saveFlag(gameConfig.unlock.storageKey, true);
      updateMenu();
      toast("裏ワザ成功：強化モード解放！");
      AudioManager.playSE("defeat");
      return;
    }
    if(!state.sound){
      bgmController.stop();
    }else if(state.running){
      bgmController.start(getCurrentMode().bgm);
    }
    updateMenu();
    if(state.soundToggleCount >= 7 && !state.strongUnlocked){
      toast(`あと${10 - state.soundToggleCount}回…`);
    }
  });

  els.bestOpen.addEventListener("click", openBestModal);
  els.bestClose.addEventListener("click", closeBestModal);
  els.bestModal.addEventListener("click", event => {
    if(event.target === els.bestModal) closeBestModal();
  });
  els.giveUp.addEventListener("click", () => endGame(true, false));
  els.retry.addEventListener("click", () => startGame(state.lastModeId));
  els.backMenu.addEventListener("click", goMenu);
  els.heroHpBadge.addEventListener("pointerdown", startHpLongPress);
  els.heroHpBadge.addEventListener("pointerup", cancelHpLongPress);
  els.heroHpBadge.addEventListener("pointerleave", cancelHpLongPress);
  els.heroHpBadge.addEventListener("pointercancel", cancelHpLongPress);
  els.heroHpBadge.addEventListener("click", event => {
    if(state.debugAnswerUnlocked){
      event.preventDefault();
    }
  });
  window.addEventListener("keydown", handleKeydown);
}

function initStaticTexts(){
  document.title = gameConfig.titleHtml.replace(/<br>/g, " ");
  els.gameTitle.innerHTML = gameConfig.titleHtml;
  els.gameSubtitle.textContent = gameConfig.subtitle;
  els.gameInstructions.textContent = gameConfig.instructions;
  els.resultTitle.textContent = gameConfig.resultTitle;
}

applyThemeVars();
AudioManager.wireUserGestureUnlock();
initStaticTexts();
renderModeButtons();
wireEvents();
updateMenu();
