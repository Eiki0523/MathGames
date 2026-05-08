import { AudioManager } from "../../shared/audio.js";
import { createGameClock, runCountdown, createDeck } from "../../shared/game-core.js";
import { Storage } from "../../shared/storage.js";
import { createScoreState, addAttackScore, addDefeatScore, addHealthBonus, createBestStore } from "../../shared/score.js";

const UNLOCK_KEY = "factorization-revenger-strong-unlocked-v1";
const bestStore = createBestStore("factorization-revenger");

const els = {
  menuScreen: document.getElementById("menuScreen"),
  gameScreen: document.getElementById("gameScreen"),
  resultScreen: document.getElementById("resultScreen"),
  menuCard: document.getElementById("menuCard"),
  strongToggle: document.getElementById("strongToggle"),
  soundToggle: document.getElementById("soundToggle"),
  limitToggle: document.getElementById("limitToggle"),
  unlockNote: document.getElementById("unlockNote"),
  bestOpen: document.getElementById("bestOpen"),
  bestModal: document.getElementById("bestModal"),
  bestClose: document.getElementById("bestClose"),
  bestModalBody: document.getElementById("bestModalBody"),
  bestUnlockStatus: document.getElementById("bestUnlockStatus"),
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
  keypad: document.getElementById("keypad"),
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

const modeNames = {
  basic: "守護天使",
  square: "熾天使",
  diff: "断罪天使",
  rush: "天界ラッシュ"
};

const state = {
  screen: "menu",
  mode: "rush",
  lastMode: "rush",
  strongUnlocked: Storage.loadFlag(UNLOCK_KEY),
  strong: false,
  limitMode: false,
  sound: true,
  soundToggleCount: 0,
  debugAnswerUnlocked: false,
  hpPressTimer: null,
  activeModeInfo: null,
  score: createScoreState(),
  current: null,
  input: [],
  problemDeck: [],
  rushDecks: null,
  rushKindDeck: [],
  heroHp: 5,
  running: false,
  ending: false,
  warned30: false,
  warned10: false,
  endReason: "",
  countdownController: null
};

const clock = createGameClock({
  durationMs: 60000,
  onTick({ sec, ratio }) {
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
  onTimeUp() {
    AudioManager.playSE("timeup");
    endGame(false, true);
  }
});

const keypadBase = [
  { label: "()", className: "op special area-paren tall" },
  { label: "x", className: "op area-x tall" },
  { label: "²", className: "op special area-pow" },
  { label: "+", className: "op area-plus" },
  { label: "-", className: "op area-minus" },
  { label: "0", className: "area-0" },
  { label: "1", className: "area-1" },
  { label: "2", className: "area-2" },
  { label: "3", className: "area-3" },
  { label: "4", className: "area-4" },
  { label: "5", className: "area-5" },
  { label: "6", className: "area-6" },
  { label: "7", className: "area-7" },
  { label: "8", className: "area-8" },
  { label: "9", className: "area-9" }
];

function showScreen(name){
  [els.menuScreen, els.gameScreen, els.resultScreen].forEach(el => el.classList.remove("active"));
  els[`${name}Screen`].classList.add("active");
  state.screen = name;
}

function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function signNum(n){
  return n > 0 ? `+${n}` : `${n}`;
}

function factorText(coef, constant){
  const xText = coef === 1 ? "x" : `${coef}x`;
  return `(${xText}${signNum(constant)})`;
}

function formatExpression(A, B, C){
  const pieces = [];
  appendTerm(pieces, A, "x²", pieces.length === 0);
  appendTerm(pieces, B, "x", pieces.length === 0);
  appendTerm(pieces, C, "", pieces.length === 0);
  return pieces.join("");
}

function appendTerm(parts, coeff, variable, isFirst){
  if(coeff === 0) return;
  const sign = coeff > 0 ? "+" : "-";
  const abs = Math.abs(coeff);
  if(isFirst){
    if(coeff < 0) parts.push("-");
  }else{
    parts.push(sign);
  }
  if(variable === "x²" || variable === "x"){
    if(abs !== 1) parts.push(String(abs));
    parts.push(variable);
  }else{
    parts.push(String(abs));
  }
}

function factorInnerTokens(coef, constant){
  const tokens = [];
  if(coef !== 1) tokens.push(...String(coef).split(""));
  tokens.push("x");
  tokens.push(constant >= 0 ? "+" : "-");
  tokens.push(...String(Math.abs(constant)).split(""));
  return tokens;
}

function twoFactorActionTokens(firstInner, secondInner){
  return ["()", ...firstInner, "()", ...secondInner];
}

function squareActionTokens(coef, constant){
  return ["()", ...factorInnerTokens(coef, constant), "²"];
}

function prefixMatch(full, input){
  if(input.length > full.length) return false;
  for(let i = 0; i < input.length; i++){
    if(full[i] !== input[i]) return false;
  }
  return true;
}

function sameTokens(a, b){
  if(a.length !== b.length) return false;
  for(let i = 0; i < a.length; i++) if(a[i] !== b[i]) return false;
  return true;
}

function makeProblem(spec){
  const factorA = factorInnerTokens(spec.coef, spec.a);
  const factorB = factorInnerTokens(spec.coef, spec.b);
  const order1 = twoFactorActionTokens(factorA, factorB);
  const order2 = twoFactorActionTokens(factorB, factorA);

  let answerCandidates;
  if(spec.kind === "square"){
    answerCandidates = [squareActionTokens(spec.coef, spec.a)];
  }else if(sameTokens(order1, order2)){
    answerCandidates = [order1];
  }else{
    answerCandidates = [order1, order2];
  }

  return {
    ...spec,
    problemText: formatExpression(spec.A, spec.B, spec.C),
    answerCandidates
  };
}

function buildProblemSpec(kind, a, b, coef){
  if(kind === "basic"){
    return { kind, a, b, coef, A: coef * coef, B: coef * (a + b), C: a * b };
  }
  if(kind === "square"){
    return { kind, a, b: a, coef, A: coef * coef, B: 2 * coef * a, C: a * a };
  }
  return { kind, a, b: -a, coef, A: coef * coef, B: 0, C: -(a * a) };
}

function isAllowedSpec(spec){
  if(Math.abs(spec.B) > 60) return false;
  return true;
}

function buildKindDeck(kind){
  const deck = [];
  const coeffs = state.strong ? [2, 3, 4] : [1];

  if(kind === "basic"){
    for(const coef of coeffs){
      for(let a = -9; a <= 9; a++){
        if(a === 0) continue;
        for(let b = -9; b <= 9; b++){
          if(b === 0) continue;
          if(a === b || a === -b) continue;
          if(a > b) continue;
          const spec = buildProblemSpec(kind, a, b, coef);
          if(isAllowedSpec(spec)) deck.push(spec);
        }
      }
    }
  }else if(kind === "square"){
    for(const coef of coeffs){
      for(let a = -9; a <= 9; a++){
        if(a === 0) continue;
        const spec = buildProblemSpec(kind, a, a, coef);
        if(isAllowedSpec(spec)) deck.push(spec);
      }
    }
  }else if(kind === "diff"){
    for(const coef of coeffs){
      for(let a = 1; a <= 9; a++){
        const spec = buildProblemSpec(kind, a, -a, coef);
        if(isAllowedSpec(spec)) deck.push(spec);
      }
    }
  }
  return deck;
}

const rushKinds = ["basic", "square", "diff"];

function buildProblemDeck(){
  const all = buildKindDeck(state.mode);
  return createDeck(all).map(makeProblem);
}

function buildRushDecks(){
  return rushKinds.reduce((decks, kind) => {
    decks[kind] = createDeck(buildKindDeck(kind));
    return decks;
  }, {});
}

function nextProblem(){
  if(state.mode === "rush"){
    if(!state.rushDecks){
      state.rushDecks = buildRushDecks();
    }
    if(!state.rushKindDeck || state.rushKindDeck.length === 0){
      state.rushKindDeck = createDeck([...rushKinds]);
    }
    const kind = state.rushKindDeck.pop();
    if(!state.rushDecks[kind] || state.rushDecks[kind].length === 0){
      state.rushDecks[kind] = createDeck(buildKindDeck(kind));
    }
    return makeProblem(state.rushDecks[kind].pop());
  }

  if(state.problemDeck.length === 0){
    state.problemDeck = buildProblemDeck();
  }
  return state.problemDeck.pop();
}

function setEnemyVisual(kind, mood = "normal"){
  els.enemy.className = `enemy enemy-${kind}${state.strong ? " strong" : ""}`;
  const svg = enemySvg(kind, mood);
  els.enemy.innerHTML = svg;
}

function enemySvg(kind, mood){
  const angry = mood === "attack";
  const eyeGlow = angry ? "#ffecff" : "#cfe7ff";
  const mouth = angry
    ? `<path d="M43 83 Q60 70 77 83" fill="none" stroke="#3e006d" stroke-width="6" stroke-linecap="round"/>`
    : `<path d="M43 80 Q60 90 77 80" fill="none" stroke="#526090" stroke-width="5" stroke-linecap="round"/>`;

  if(kind === "square"){
    return `
      <svg class="enemySvg" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="seraphCore" cx="50%" cy="42%" r="58%">
            <stop offset="0" stop-color="#ffffff"/>
            <stop offset=".42" stop-color="#f7ecff"/>
            <stop offset="1" stop-color="#8ea4ff"/>
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="20" rx="22" ry="9" fill="none" stroke="#fff0a8" stroke-width="4"/>
        <ellipse cx="60" cy="20" rx="32" ry="13" fill="none" stroke="rgba(255,240,168,.46)" stroke-width="2"/>
        <path d="M21 41 Q2 20 15 8 Q37 15 45 39" fill="#f8fbff" stroke="#cfe2ff" stroke-width="3"/>
        <path d="M99 41 Q118 20 105 8 Q83 15 75 39" fill="#f8fbff" stroke="#cfe2ff" stroke-width="3"/>
        <path d="M24 72 Q3 55 12 37 Q34 39 47 62" fill="#eaf4ff" stroke="#cfe2ff" stroke-width="3"/>
        <path d="M96 72 Q117 55 108 37 Q86 39 73 62" fill="#eaf4ff" stroke="#cfe2ff" stroke-width="3"/>
        <path d="M36 96 Q15 91 14 72 Q34 68 49 84" fill="#dbe9ff" stroke="#cfe2ff" stroke-width="3"/>
        <path d="M84 96 Q105 91 106 72 Q86 68 71 84" fill="#dbe9ff" stroke="#cfe2ff" stroke-width="3"/>
        <path d="M36 40 C42 24 78 24 84 40 L91 85 C79 105 41 105 29 85 Z" fill="url(#seraphCore)" stroke="#dce8ff" stroke-width="4"/>
        <path d="M41 53 Q60 42 79 53" fill="none" stroke="rgba(107,0,180,.45)" stroke-width="3"/>
        <circle cx="48" cy="61" r="5.5" fill="${eyeGlow}" stroke="#6f2cff" stroke-width="2"/>
        <circle cx="72" cy="61" r="5.5" fill="${eyeGlow}" stroke="#6f2cff" stroke-width="2"/>
        <circle cx="60" cy="57" r="7" fill="#f5ecff" stroke="#7714d8" stroke-width="2"/>
        ${angry
          ? `<path d="M43 50 L53 55" stroke="#4b006d" stroke-width="4" stroke-linecap="round"/><path d="M77 50 L67 55" stroke="#4b006d" stroke-width="4" stroke-linecap="round"/><path d="M43 84 Q60 70 77 84" fill="none" stroke="#520080" stroke-width="6" stroke-linecap="round"/>`
          : `<path d="M44 82 Q60 93 76 82" fill="none" stroke="#526090" stroke-width="5" stroke-linecap="round"/>`}
        <path d="M60 33 L64 47 L79 48 L67 57 L71 72 L60 63 L49 72 L53 57 L41 48 L56 47 Z" fill="rgba(255,235,164,.35)" stroke="rgba(255,235,164,.75)" stroke-width="1.5"/>
        <path d="M35 90 C47 80 73 80 85 90" fill="rgba(36,0,70,.22)"/>
      </svg>`;
  }

  if(kind === "diff"){
    return `
      <svg class="enemySvg" viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="60" cy="20" rx="25" ry="8" fill="none" stroke="#fff0a8" stroke-width="4"/>
        <path d="M32 43 Q15 25 20 8 Q45 18 51 43" fill="#ffffff" stroke="#d8e6ff" stroke-width="3"/>
        <path d="M88 43 Q105 25 100 8 Q75 18 69 43" fill="#e7e2ff" stroke="#c5b8ff" stroke-width="3"/>
        <path d="M60 27 L84 39 L90 80 L60 101 L30 80 L36 39 Z" fill="#ffffff" stroke="#dae7ff" stroke-width="4"/>
        <path d="M60 27 L84 39 L90 80 L60 101 Z" fill="#d9d2ff" opacity=".86"/>
        <path d="M60 31 L60 98" stroke="rgba(31,0,55,.45)" stroke-width="4"/>
        <path d="M41 52 Q60 45 79 52" fill="none" stroke="#32104f" stroke-width="5" stroke-linecap="round"/>
        <circle cx="48" cy="64" r="6" fill="#f8fbff" stroke="#6f2cff" stroke-width="2"/>
        <circle cx="72" cy="64" r="6" fill="#1b0938" stroke="#d100ff" stroke-width="2"/>
        ${angry
          ? `<path d="M44 50 L53 55" stroke="#2b004a" stroke-width="4" stroke-linecap="round"/><path d="M76 50 L67 55" stroke="#2b004a" stroke-width="4" stroke-linecap="round"/><path d="M44 84 Q60 70 76 84" fill="none" stroke="#2b004a" stroke-width="6" stroke-linecap="round"/>`
          : `<path d="M45 80 Q60 90 75 80" fill="none" stroke="#3e326c" stroke-width="5" stroke-linecap="round"/>`}
        <path d="M36 91 L84 91" stroke="rgba(255,240,168,.58)" stroke-width="3" stroke-linecap="round"/>
        <path d="M39 42 C46 38 53 39 60 46 C67 39 74 38 81 42" fill="none" stroke="rgba(255,240,168,.7)" stroke-width="2"/>
      </svg>`;
  }

  return `
    <svg class="enemySvg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="guardianCore" cx="50%" cy="38%" r="56%">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset=".48" stop-color="#edf7ff"/>
          <stop offset="1" stop-color="#abc8ff"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="18" r="13" fill="none" stroke="#fff0a8" stroke-width="5"/>
      <circle cx="60" cy="18" r="22" fill="none" stroke="rgba(255,240,168,.35)" stroke-width="2"/>
      <path d="M29 48 Q10 32 13 12 Q38 19 50 44" fill="#f6fbff" stroke="#d4e7ff" stroke-width="3"/>
      <path d="M91 48 Q110 32 107 12 Q82 19 70 44" fill="#f6fbff" stroke="#d4e7ff" stroke-width="3"/>
      <path d="M25 48 C25 24 95 24 95 48 L90 84 C82 104 38 104 30 84 Z" fill="url(#guardianCore)" stroke="#d8e8ff" stroke-width="4"/>
      <path d="M38 47 Q60 37 82 47" stroke="rgba(255,240,168,.8)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="45" cy="61" r="6.5" fill="${eyeGlow}" stroke="#6f2cff" stroke-width="2"/>
      <circle cx="75" cy="61" r="6.5" fill="${eyeGlow}" stroke="#6f2cff" stroke-width="2"/>
      <circle cx="60" cy="55" r="5" fill="#2b004f" opacity=".78"/>
      ${angry
        ? `<path d="M41 50 L53 55" stroke="#3e006d" stroke-width="4" stroke-linecap="round"/><path d="M79 50 L67 55" stroke="#3e006d" stroke-width="4" stroke-linecap="round"/><path d="M42 84 Q60 69 78 84" fill="none" stroke="#3e006d" stroke-width="6" stroke-linecap="round"/>`
        : mouth}
      <path d="M39 92 C47 82 73 82 81 92" fill="rgba(43,0,79,.22)"/>
      <path d="M60 30 C66 39 66 45 60 51 C54 45 54 39 60 30 Z" fill="rgba(111,44,255,.25)" stroke="rgba(111,44,255,.55)" stroke-width="2"/>
    </svg>`;
}

function renderActionInput(tokens){
  if(tokens.length === 0) return "?";
  let output = "";
  let inside = false;
  for(const token of tokens){
    if(token === "()"){
      if(inside) output += ")";
      output += "(";
      inside = true;
      continue;
    }
    if(token === "²"){
      if(inside){
        output += ")";
        inside = false;
      }
      output += "²";
      continue;
    }
    output += token;
  }
  if(inside) output += ")";
  return output;
}

function renderInput(){
  els.answerBox.textContent = renderActionInput(state.input);
  const isWrong = state.input.length > 0 && getMatchingCandidates(state.input).length === 0;
  els.answerBox.classList.toggle("wrong", isWrong);
  const maxLength = Math.max(...state.current.answerCandidates.map(c => c.length));
  const progress = state.input.length / maxLength;
  els.hpFill.style.width = `${Math.max(0, 1 - progress) * 100}%`;
}

function getMatchingCandidates(input){
  return state.current.answerCandidates.filter(candidate => prefixMatch(candidate, input));
}

function renderProblem(){
  state.current = nextProblem();
  state.input = [];
  els.problem.textContent = state.current.problemText;
  const labels = [state.strong ? "強化" : "通常"];
  if(state.limitMode) labels.push("極限");
  els.modeLabel.textContent = `${labels.join("+")} / ${modeNames[state.mode]}モード`;
  setEnemyVisual(state.current.kind);
  renderKeypad();
  renderInput();
}

function renderKeypad(){
  els.keypad.innerHTML = "";
  els.keypad.classList.remove("squareMode");
  for(const item of keypadBase){
    const btn = document.createElement("button");
    btn.className = `key ${item.className}`;
    btn.textContent = item.label;
    btn.dataset.key = item.label;
    btn.addEventListener("click", () => handleKey(item.label));
    els.keypad.appendChild(btn);
  }
}

function spawnSparks(){
  const rect = els.stage.getBoundingClientRect();
  const baseX = rect.width * 0.50;
  const baseY = rect.height * 0.42;
  for(let i = 0; i < 12; i++){
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = `${baseX + randInt(-22, 22)}px`;
    s.style.top = `${baseY + randInt(-18, 18)}px`;
    s.style.setProperty("--dx", `${randInt(-76, 76)}px`);
    s.style.setProperty("--dy", `${randInt(-70, 54)}px`);
    els.stage.appendChild(s);
    setTimeout(() => s.remove(), 520);
  }
}

function spawnFeathers(){
  const rect = els.stage.getBoundingClientRect();
  const baseX = rect.width * 0.50;
  const baseY = rect.height * 0.46;
  for(let i = 0; i < 9; i++){
    const f = document.createElement("span");
    f.className = "feather";
    f.style.left = `${baseX + randInt(-12, 12)}px`;
    f.style.top = `${baseY + randInt(-10, 10)}px`;
    f.style.setProperty("--dx", `${randInt(-90, 90)}px`);
    f.style.setProperty("--dy", `${randInt(-70, 80)}px`);
    f.style.setProperty("--rot", `${randInt(-260, 260)}deg`);
    els.stage.appendChild(f);
    setTimeout(() => f.remove(), 980);
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
    state.endReason = "体力が0になりました。";
    setTimeout(() => AudioManager.playSE("fail"), 120);
    setTimeout(() => endGame(false, false), 520);
  }
}


function pressCorrectAnswerButton(){
  if(!state.running || state.ending || !state.current) return;
  const matching = getMatchingCandidates(state.input);
  const target = matching[0] || state.current.answerCandidates[0];
  const nextToken = target[state.input.length];
  if(nextToken) handleKey(nextToken);
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

function handleKey(key){
  if(!state.running || state.ending || !state.current) return;
  const nextInput = [...state.input, key];
  const matching = getMatchingCandidates(nextInput);
  if(matching.length > 0){
    state.input = nextInput;
    addAttackScore(state.score, state.strong);
    els.scoreNow.textContent = String(state.score.score);
    damageEffect();
    renderInput();
    if(matching.some(candidate => candidate.length === state.input.length)){
      defeatEnemy();
    }
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
  addDefeatScore(state.score, { extremeMode: state.limitMode });
  els.killCount.textContent = String(state.score.kills);
  els.scoreNow.textContent = String(state.score.score);
  AudioManager.playSE("defeat");
  spawnFeathers();
  els.enemy.classList.remove("hit");
  els.enemy.classList.add("defeat");
  setTimeout(() => {
    if(state.running && !state.ending){
      renderProblem();
    }
  }, 520);
}

function resetStatus(){
  state.score = createScoreState();
  state.heroHp = state.limitMode ? 1 : 5;
  state.endReason = "";
  state.warned30 = false;
  state.warned10 = false;
  state.input = [];
  state.problemDeck = state.mode === "rush" ? [] : buildProblemDeck();
  state.rushDecks = state.mode === "rush" ? buildRushDecks() : null;
  state.rushKindDeck = state.mode === "rush" ? createDeck([...rushKinds]) : [];
  state.current = null;
  state.debugAnswerUnlocked = false;
  if(state.hpPressTimer){
    clearTimeout(state.hpPressTimer);
    state.hpPressTimer = null;
  }
  els.heroHpBadge.classList.remove("debugReady");
  state.ending = false;
  state.running = false;
  els.killCount.textContent = "0";
  els.scoreNow.textContent = "0";
  els.heroHp.textContent = String(state.heroHp);
  els.timeLabel.textContent = "60.0";
  els.timeFill.style.width = "100%";
  els.timeLabel.classList.remove("timeWarn", "timeDanger");
}

function triggerTimeWarning(kind){
  els.timeLabel.classList.remove("timeWarn", "timeDanger");
  void els.timeLabel.offsetWidth;
  els.timeLabel.classList.add(kind === "danger" ? "timeDanger" : "timeWarn");
  AudioManager.playSE(kind === "danger" ? "start" : "count");
}

function startGame(mode){
  AudioManager.primeAudio();
  state.mode = mode;
  state.lastMode = mode;
  resetStatus();
  showScreen("game");
  renderProblem();
  stopCountdown();
  state.countdownController = runCountdown({
    overlay: els.countdownOverlay,
    seconds: 3,
    onCount(){ AudioManager.playSE("count"); },
    onDone(){
      state.running = true;
      AudioManager.playSE("start");
      AudioManager.startBgm(state.strong || state.limitMode ? "tense" : "normal");
      clock.start();
    }
  });
}

function stopCountdown(){
  if(state.countdownController){
    state.countdownController.cancel();
    state.countdownController = null;
  }
}

function bestLabel(mode, strong){
  return `${strong ? "強化" : "通常"} / ${modeNames[mode]}モード`;
}

function recordText(record){
  if(!record) return "記録なし";
  return `${record.kills}体 / ${record.score}点`;
}

function renderBestModal(){
  const modes = ["basic", "square", "diff", "rush"];
  const section = (strong) => {
    const rows = modes.map(mode => {
      const rec = bestStore.get(mode, strong);
      return `
        <div class="bestRow"><strong>${modeNames[mode]}</strong><br>
          ${rec ? `${rec.kills}体 / ${rec.score}点<br><small>ミス:${rec.miss}　最大コンボ:${rec.combo}</small>` : `記録なし<br><small>まだ遊んでいません</small>`}
        </div>`;
    }).join("");
    return `<div class="bestSection"><div class="bestSectionTitle">${strong ? "強化モード" : "通常モード"}</div><div class="bestRows">${rows}</div></div>`;
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

  const strongMessage = "強化モード：両方のxに同じ係数がつく神々しい問題が出ます。";
  const limitMessage = "極限モード：体力が1になる代わりに、撃破点が激増します。";

  if(state.strongUnlocked){
    els.strongToggle.disabled = false;
    els.strongToggle.textContent = state.strong ? "強化モード：ON" : "強化モード：OFF";
    if(state.strong && state.limitMode){
      els.unlockNote.textContent = state.activeModeInfo === "limit" ? limitMessage : strongMessage;
    }else if(state.strong){
      els.unlockNote.textContent = strongMessage;
    }else if(state.limitMode){
      els.unlockNote.textContent = limitMessage;
    }else{
      els.unlockNote.textContent = "強化モード解放済み。押すと通常/強化を切り替えます。";
    }
  }else{
    state.strong = false;
    els.strongToggle.disabled = true;
    els.strongToggle.textContent = "強化モード：未解放";
    els.unlockNote.textContent = state.limitMode
      ? limitMessage
      : "天界ラッシュで5体以上撃破すると強化モードが解放されます。";
  }

  els.soundToggle.textContent = state.sound ? "音：ON" : "音：OFF";
  els.limitToggle.textContent = state.limitMode ? "極限モード：ON" : "極限モード：OFF";
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
  AudioManager.stopBgm();
  if(manual){
    showResult(true, false);
    return;
  }
  setTimeout(() => showResult(false, timeUp), 2000);
}

function showResult(manual, timeUp){
  addHealthBonus(state.score, state.heroHp);

  let unlockedNow = false;
  if(state.mode === "rush" && state.score.kills >= 5 && !state.strongUnlocked){
    state.strongUnlocked = true;
    Storage.saveFlag(UNLOCK_KEY, true);
    unlockedNow = true;
  }

  const record = {
    mode: state.mode,
    strong: state.strong,
    kills: state.score.kills,
    score: state.score.score,
    miss: state.score.miss,
    combo: state.score.maxCombo,
    savedAt: new Date().toISOString()
  };
  const bestInfo = bestStore.update(state.mode, state.strong, record);

  els.resultKills.textContent = String(state.score.kills);
  els.resultScore.textContent = String(state.score.score);
  els.resultMiss.textContent = String(state.score.miss);
  els.resultCombo.textContent = String(state.score.maxCombo);
  els.bestResult.innerHTML = bestInfo.updated
    ? `自己ベスト更新！<br>${bestLabel(state.mode, state.strong)}：${recordText(bestInfo.bestRecord)}`
    : `自己ベスト<br>${bestLabel(state.mode, state.strong)}：${recordText(bestInfo.bestRecord)}`;

  els.breakdown.innerHTML = [
    `闇弾成功点：${state.score.attackScore} 点`,
    `撃破点：${state.score.defeatedScore} 点`,
    `連続撃破ボーナス：${state.score.comboScore} 点`,
    `極限モードボーナス：${state.score.extremeBonus} 点`,
    `残り体力ボーナス：${state.score.healthBonus} 点`,
    unlockedNow ? `<strong>強化モード解放！</strong>` : "",
    state.endReason || (manual ? "途中終了しました。" : (timeUp ? "60秒終了。" : "戦闘終了。"))
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
  AudioManager.stopBgm();
  updateMenu();
  showScreen("menu");
}

function handleKeydown(event){
  if(state.screen !== "game") return;
  const map = {
    "(": "()",
    ")": "()",
    "+": "+",
    "-": "-",
    x: "x",
    X: "x",
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    "^": "²"
  };
  if(map[event.key]){
    handleKey(map[event.key]);
  }
}

function wireEvents(){
  document.querySelectorAll(".modeBtn").forEach(btn => {
    btn.addEventListener("click", () => startGame(btn.dataset.mode));
  });
  els.strongToggle.addEventListener("click", () => {
    if(!state.strongUnlocked) return;
    state.strong = !state.strong;
    state.activeModeInfo = state.strong ? "strong" : (state.limitMode ? "limit" : null);
    updateMenu();
    toast(state.strong ? "強化モード ON" : "通常モード");
    AudioManager.playSE("result");
  });
  els.limitToggle.addEventListener("click", () => {
    state.limitMode = !state.limitMode;
    state.activeModeInfo = state.limitMode ? "limit" : (state.strong ? "strong" : null);
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
      Storage.saveFlag(UNLOCK_KEY, true);
      updateMenu();
      toast("裏ワザ成功：強化モード解放！");
      AudioManager.playSE("defeat");
      return;
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
  els.retry.addEventListener("click", () => startGame(state.lastMode));
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

AudioManager.wireUserGestureUnlock();
wireEvents();
updateMenu();
