export const gameConfig = {
  gameId: "template-game-sample",
  titleHtml: "テンプレート<br>ゲーム",
  subtitle: "新しい算数ゲームを追加するときの土台です。問題の作り方、入力方式、見た目、BGM を差し替える前提で作っています。",
  instructions: "このサンプルでは数字ボタンで答えます。将来は drag-drop や swap 用の入力アダプタを追加して差し替えます。",
  resultTitle: "リザルト",
  defaultDurationMs: 60000,
  features: {
    strongMode: true,
    limitMode: true,
    bestModal: true,
    soundToggle: true
  },
  unlock: {
    rushKillsForStrong: 5,
    storageKey: "template-game-strong-unlocked-v1"
  },
  score: {
    attackPoint: 10,
    strongAttackPoint: 15,
    defeatPoint: 100,
    comboStep: 20,
    comboMax: 200,
    extremeBonus: 100,
    healthPoint: 100
  },
  modes: [
    {
      id: "add",
      name: "たし算",
      menuTitle: "スター足し算",
      description: "2つの数を足して答える基本モード。",
      durationMs: 60000,
      bgm: { type: "generated", mode: "normal" }
    },
    {
      id: "sub",
      name: "ひき算",
      menuTitle: "ムーン引き算",
      description: "引き算をすばやく答える練習モード。",
      durationMs: 60000,
      bgm: { type: "generated", mode: "normal" }
    },
    {
      id: "mix",
      name: "ミックス",
      menuTitle: "コズミックラッシュ",
      description: "たし算とひき算がまざって出るモード。5体撃破で強化解放。",
      durationMs: 60000,
      bgm: { type: "generated", mode: "tense" }
    }
  ],
  input: {
    type: "button",
    layoutId: "number-pad"
  },
  best: {
    labels: {
      normal: "通常モード",
      strong: "強化モード"
    }
  }
};
