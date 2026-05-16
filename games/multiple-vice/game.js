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
  speechBubble: document.getElementById("speechBubble"),
  heroHpBadge: document.getElementById("heroHpBadge"),
  heroHp: document.getElementById("heroHp"),
  battle: document.getElementById("battle"),
  stage: document.getElementById("stage"),
  enemy: document.getElementById("enemy"),
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
  heroHp: 3,
  current: null,
  source: null,
  countdownController: null,
  lockInput: false,
  debugAnswerUnlocked: false,
  hpPressTimer: null
};

function createClock(durationMs){
  return createGameClock({
    durationMs,
    onTick({ sec, ratio }){
      els.timeLabel.textContent = sec.toFixed(1);
      els.timeFill.style.width = `${ratio * 100}%`;
      if(!state.warned30 && sec <= 15){
        state.warned30 = true;
        triggerTimeWarning("warn");
      }
      if(!state.warned10 && sec <= 5){
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

function getCurrentMode(){
  return gameConfig.modes.find(mode => mode.id === state.modeId);
}

function getModeDurationMs(){
  return getCurrentMode()?.durationMs || gameConfig.defaultDurationMs;
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

function setEnemyVisual(mood = "normal"){
  els.enemy.className = `enemy enemy-${state.current?.kind || "pure"}${state.strong ? " strong" : ""}`;
  els.enemy.innerHTML = state.current ? renderEnemySvg(state.current, mood) : "";
}

function renderProblem(){
  state.current = nextProblemFromSource(state.source, state.strong);
  state.lockInput = false;
  els.problem.textContent = state.current.promptText;
  els.speechBubble.textContent = state.current.speechText;
  els.speechBubble.classList.remove("shake");
  const labels = [state.strong ? "強化" : "通常"];
  if(state.limitMode) labels.push("極限");
  els.modeLabel.textContent = `${labels.join("+")} / ${getCurrentMode().name}`;
  setEnemyVisual("normal");
}

function spawnSparks(){
  const rect = els.stage.getBoundingClientRect();
  const baseX = rect.width * 0.50;
  const baseY = rect.height * 0.48;
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
  AudioManager.playSE("miss");
}

function takeDamage(){
  state.heroHp = Math.max(0, state.heroHp - 1);
  els.heroHp.textContent = String(state.heroHp);
  enemyAttackEffect();
  if(state.heroHp <= 0){
    setTimeout(() => AudioManager.playSE("fail"), 120);
    setTimeout(() => endGame(false, false), 900);
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

function updateScoreView(){
  els.killCount.textContent = String(state.score.kills);
  els.scoreNow.textContent = String(state.score.score);
}

function pressCorrectAnswerButton(){
  if(!state.running || state.ending || !state.current) return;
  handleChoice(state.current.truth ? "◯" : "✕");
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

function nextAfterDelay(delayMs = 900){
  setTimeout(() => {
    if(state.running && !state.ending){
      renderProblem();
    }
  }, delayMs);
}

function handleCorrect(){
  state.score.kills++;
  state.score.combo++;
  state.score.maxCombo = Math.max(state.score.maxCombo, state.score.combo);
  addAttackPoint();
  addDefeatPoint();
  updateScoreView();
  els.speechBubble.textContent = "ありがとう！";
  setEnemyVisual("thanks");
  els.enemy.classList.remove("thanks");
  void els.enemy.offsetWidth;
  els.enemy.classList.add("thanks");
  AudioManager.playSE("correct");
  nextAfterDelay(380);
}

function handleFalseNegative(){
  state.score.miss++;
  state.score.combo = 0;
  updateScoreView();
  els.speechBubble.textContent = "本物なのに…ひどすぎる";
  els.speechBubble.classList.remove("shake");
  void els.speechBubble.offsetWidth;
  els.speechBubble.classList.add("shake");
  setEnemyVisual("cry");
  els.enemy.classList.remove("cry");
  void els.enemy.offsetWidth;
  els.enemy.classList.add("cry");
  takeDamage();
  nextAfterDelay(920);
}

function handleFalsePositive(){
  state.score.miss++;
  state.score.combo = 0;
  updateScoreView();
  els.speechBubble.textContent = "ふはは、騙されたなぁ！";
  els.speechBubble.classList.remove("shake");
  void els.speechBubble.offsetWidth;
  els.speechBubble.classList.add("shake");
  setEnemyVisual("evil");
  els.enemy.classList.remove("evilRush");
  void els.enemy.offsetWidth;
  els.enemy.classList.add("evilRush");
  takeDamage();
  nextAfterDelay(760);
}

function handleChoice(choice){
  if(!state.running || state.ending || state.lockInput || !state.current) return;
  state.lockInput = true;
  damageEffect();
  const userSaysTrue = choice === "◯";

  if(userSaysTrue === state.current.truth){
    handleCorrect();
    return;
  }
  if(state.current.truth){
    handleFalseNegative();
    return;
  }
  handleFalsePositive();
}

function stopCountdown(){
  if(state.countdownController){
    state.countdownController.cancel();
    state.countdownController = null;
  }
}

function resetStatus(){
  state.score = createScoreState();
  state.heroHp = state.limitMode ? 1 : 3;
  state.warned30 = false;
  state.warned10 = false;
  state.current = null;
  state.ending = false;
  state.running = false;
  state.lockInput = false;
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
    onKey: handleChoice
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
          ${rec ? `${rec.kills}体 / ${rec.score}点<br><small>誤審:${rec.miss}　最大連続:${rec.combo}</small>` : `記録なし<br><small>まだ遊んでいません</small>`}
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

  if(state.strongUnlocked){
    els.strongToggle.disabled = false;
    els.strongToggle.textContent = state.strong ? themeConfig.labels.strongOn : themeConfig.labels.strongOff;
    if(state.strong){
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
  state.lockInput = true;
  stopCountdown();
  clock.stop();
  bgmController.stop();
  if(manual){
    showResult(true, false);
    return;
  }
  setTimeout(() => showResult(false, timeUp), 600);
}

function showResult(manual, timeUp){
  addHealthBonus(state.score, state.heroHp);
  if(gameConfig.score.healthPoint !== 100){
    state.score.score -= state.score.healthBonus;
    state.score.healthBonus = Math.max(0, state.heroHp) * gameConfig.score.healthPoint;
    state.score.score += state.score.healthBonus;
  }

  let unlockedNow = false;
  if(state.modeId === "random" && state.score.kills >= gameConfig.unlock.rushKillsForStrong && !state.strongUnlocked){
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
    `正解判定点：${state.score.attackScore} 点`,
    `見抜き成功点：${state.score.defeatedScore} 点`,
    `連続正解ボーナス：${state.score.comboScore} 点`,
    `極限モードボーナス：${state.score.extremeBonus} 点`,
    `残り見逃しボーナス：${state.score.healthBonus} 点`,
    unlockedNow ? "<strong>強化モード解放！</strong>" : "",
    manual ? "途中終了しました。" : (timeUp ? "時間切れです。" : "審判終了。")
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
  state.lockInput = false;
  bgmController.stop();
  updateMenu();
  showScreen("menu");
}

function handleKeydown(event){
  if(state.screen !== "game") return;
  if(event.key === "ArrowLeft"){
    handleChoice("◯");
    return;
  }
  if(event.key === "ArrowRight"){
    handleChoice("✕");
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
    toast(state.limitMode ? "極限モード ON：見逃し1" : "極限モード OFF");
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
