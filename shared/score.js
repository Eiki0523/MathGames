// MathGame_browser shared/score.js
// スコアと自己ベスト保存の共通モジュール。

import { Storage } from "./storage.js";

export function createScoreState(){
  return {
    score: 0,
    kills: 0,
    miss: 0,
    combo: 0,
    maxCombo: 0,
    attackScore: 0,
    defeatedScore: 0,
    comboScore: 0,
    extremeBonus: 0,
    healthBonus: 0
  };
}

export function addAttackScore(scoreState, isHard = false){
  const point = 30;
  scoreState.attackScore += point;
  scoreState.score += point;
  return point;
}

export function addDefeatScore(scoreState, options = {}){
  const defeatPoint = options.defeatPoint ?? 100;
  const comboPoint = Math.min(scoreState.combo * 20, 200);
  const extremePoint = options.extremeMode ? 100 : 0;

  scoreState.defeatedScore += defeatPoint;
  scoreState.comboScore += comboPoint;
  scoreState.extremeBonus += extremePoint;
  scoreState.score += defeatPoint + comboPoint + extremePoint;

  return {defeatPoint, comboPoint, extremePoint};
}

export function addHealthBonus(scoreState, hp){
  const point = Math.max(0, hp) * 100;
  scoreState.healthBonus += point;
  scoreState.score += point;
  return point;
}

export function createBestStore(gameId){
  const key = `mathgame-best:${gameId}:v1`;

  function modeKey(mode, hard = false){
    // 極限モードなど「自己ベストに含めない難易度」はここに入れない。
    return `${hard ? "hard" : "normal"}:${mode}`;
  }

  function loadAll(){
    return Storage.safeLoad(key, {});
  }

  function saveAll(records){
    Storage.safeSave(key, records);
  }

  function isBetter(newRecord, oldRecord){
    if(!oldRecord) return true;
    if(newRecord.kills !== oldRecord.kills) return newRecord.kills > oldRecord.kills;
    return newRecord.score > oldRecord.score;
  }

  function get(mode, hard = false){
    return loadAll()[modeKey(mode, hard)] || null;
  }

  function update(mode, hard, record){
    const records = loadAll();
    const k = modeKey(mode, hard);
    const old = records[k] || null;
    const updated = isBetter(record, old);
    if(updated){
      records[k] = record;
      saveAll(records);
    }
    return {updated, oldRecord: old, bestRecord: records[k] || record};
  }

  return {get, update, loadAll};
}
