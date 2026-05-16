import { createDeck } from "../../shared/game-core.js";

function makeAnswerCandidates(answerValue){
  return [String(answerValue).split("")];
}

function makeAddProblem(a, b){
  return {
    kind: "add",
    promptText: `${a} + ${b}`,
    answerCandidates: makeAnswerCandidates(a + b)
  };
}

function makeSubProblem(a, b){
  return {
    kind: "sub",
    promptText: `${a} - ${b}`,
    answerCandidates: makeAnswerCandidates(a - b)
  };
}

function createAddDeck(strong){
  const deck = [];
  const max = strong ? 49 : 20;
  for(let a = 0; a <= max; a++){
    for(let b = 0; b <= max; b++){
      deck.push(makeAddProblem(a, b));
    }
  }
  return createDeck(deck);
}

function createSubDeck(strong){
  const deck = [];
  const max = strong ? 49 : 20;
  for(let a = 0; a <= max; a++){
    for(let b = 0; b <= a; b++){
      deck.push(makeSubProblem(a, b));
    }
  }
  return createDeck(deck);
}

export function createProblemSource({ modeId, strong }){
  if(modeId === "add"){
    return { type: "single", kind: "add", deck: createAddDeck(strong) };
  }
  if(modeId === "sub"){
    return { type: "single", kind: "sub", deck: createSubDeck(strong) };
  }
  return {
    type: "mix",
    decks: {
      add: createAddDeck(strong),
      sub: createSubDeck(strong)
    },
    kindDeck: createDeck(["add", "sub"])
  };
}

export function nextProblemFromSource(source, strong){
  if(source.type === "single"){
    if(source.deck.length === 0){
      source.deck = source.kind === "sub" ? createSubDeck(strong) : createAddDeck(strong);
    }
    return source.deck.pop();
  }

  if(source.kindDeck.length === 0){
    source.kindDeck = createDeck(["add", "sub"]);
  }
  const kind = source.kindDeck.pop();
  if(source.decks[kind].length === 0){
    source.decks[kind] = kind === "add" ? createAddDeck(strong) : createSubDeck(strong);
  }
  return source.decks[kind].pop();
}
