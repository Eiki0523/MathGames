import { createDeck } from "../../shared/game-core.js";

const divisors = [2, 3, 5, 6, 9];

function getDivisorForMode(modeId){
  const map = {
    m2: 2,
    m3: 3,
    m5: 5,
    m6: 6,
    m9: 9
  };
  return map[modeId] || null;
}

function makeProblem({ number, claimDivisor, truth }){
  return {
    kind: truth ? "pure" : "vice",
    number,
    claimDivisor,
    truth,
    promptText: String(number),
    speechText: `私は${claimDivisor}の倍数です`,
    answerCandidates: [[truth ? "◯" : "✕"]]
  };
}

function isMultiple(number, divisor){
  return number % divisor === 0;
}

function getRange(strong){
  return strong ? { min: 100, max: 999 } : { min: 10, max: 99 };
}

function buildSingleModeDeck(divisor, strong){
  const { min, max } = getRange(strong);
  const trueNumbers = [];
  const falseNumbers = [];

  for(let number = min; number <= max; number++){
    if(isMultiple(number, divisor)) trueNumbers.push(number);
    else falseNumbers.push(number);
  }

  const pairCount = Math.min(trueNumbers.length, falseNumbers.length);
  const truths = createDeck(trueNumbers).slice(0, pairCount).map(number => makeProblem({ number, claimDivisor: divisor, truth: true }));
  const lies = createDeck(falseNumbers).slice(0, pairCount).map(number => makeProblem({ number, claimDivisor: divisor, truth: false }));
  return createDeck([...truths, ...lies]);
}

function buildRandomDeck(strong){
  const { min, max } = getRange(strong);
  const truths = [];
  const lies = [];
  const usedPairs = new Set();

  for(let number = min; number <= max; number++){
    const trueDivisors = divisors.filter(divisor => isMultiple(number, divisor));
    const falseDivisors = divisors.filter(divisor => !isMultiple(number, divisor));

    if(trueDivisors.length > 0){
      const claimDivisor = trueDivisors[Math.floor(Math.random() * trueDivisors.length)];
      const key = `${number}:T:${claimDivisor}`;
      if(!usedPairs.has(key)){
        usedPairs.add(key);
        truths.push(makeProblem({ number, claimDivisor, truth: true }));
      }
    }

    if(falseDivisors.length > 0){
      const claimDivisor = falseDivisors[Math.floor(Math.random() * falseDivisors.length)];
      const key = `${number}:F:${claimDivisor}`;
      if(!usedPairs.has(key)){
        usedPairs.add(key);
        lies.push(makeProblem({ number, claimDivisor, truth: false }));
      }
    }
  }

  const pairCount = Math.min(truths.length, lies.length);
  return createDeck([
    ...createDeck(truths).slice(0, pairCount),
    ...createDeck(lies).slice(0, pairCount)
  ]);
}

export function createProblemSource({ modeId, strong }){
  const divisor = getDivisorForMode(modeId);
  const deck = divisor ? buildSingleModeDeck(divisor, strong) : buildRandomDeck(strong);
  return { modeId, strong, deck };
}

export function nextProblemFromSource(source, strong){
  if(source.deck.length === 0){
    const divisor = getDivisorForMode(source.modeId);
    source.deck = divisor ? buildSingleModeDeck(divisor, strong) : buildRandomDeck(strong);
  }
  return source.deck.pop();
}
