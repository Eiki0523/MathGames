export const gameConfig = {
  gameId: "multiple-vice",
  titleHtml: "倍数<br>ヴァイス",
  subtitle: "あなたは善良な倍数の魂と悪霊の魂を見分ける天国の門番。悪霊に騙されないよう、白黒見極めよう。",
  instructions: "大きな数字と吹き出しを見て、話している内容が本当なら◯、嘘なら✕を押します。通常は2桁まで、強化モードでは3桁の魂が現れます。固定モードはその倍数だけを判定、ランダムモードではその時に使える全ての倍数のタマシイが出現します。12体以上見抜くと強化モードが解放されます。音ボタンを10回押す裏解放もあります。",
  resultTitle: "審判結果",
  defaultDurationMs: 30000,
  features: {
    strongMode: true,
    limitMode: true,
    bestModal: true,
    soundToggle: true
  },
  unlock: {
    rushKillsForStrong: 12,
    storageKey: "multiple-vice-strong-unlocked-v1"
  },
  score: {
    attackPoint: 40,
    strongAttackPoint: 60,
    defeatPoint: 120,
    comboStep: 25,
    comboMax: 250,
    extremeBonus: 120,
    healthPoint: 100
  },
  modes: [
    {
      id: "m2",
      name: "2の倍数",
      menuTitle: "白門の2審",
      description: "2の倍数を名乗る魂だけを審判。偶数かどうかを見抜こう。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "normal" },
      strongOnly: false
    },
    {
      id: "m3",
      name: "3の倍数",
      menuTitle: "白門の3審",
      description: "3の倍数を名乗る魂だけを審判。桁和の勘も試される。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "normal" },
      strongOnly: false
    },
    {
      id: "m5",
      name: "5の倍数",
      menuTitle: "白門の5審",
      description: "5の倍数を名乗る魂だけを審判。末尾に惑わされるな。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "normal" },
      strongOnly: false
    },
    {
      id: "m6",
      name: "6の倍数",
      menuTitle: "白門の6審",
      description: "2と3の条件を兼ねた難所。善霊か悪霊かを見極めよう。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: false
    },
    {
      id: "m7",
      name: "7の倍数",
      menuTitle: "白門の7審",
      description: "7の倍数を名乗る魂だけを審判。引き算の見分け方を使いこなそう。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: false
    },
    {
      id: "m8",
      name: "8の倍数",
      menuTitle: "白門の8審",
      description: "8の倍数を名乗る魂だけを審判。下3ケタに注目しよう。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: false
    },
    {
      id: "m9",
      name: "9の倍数",
      menuTitle: "白門の9審",
      description: "9の倍数を名乗る魂だけを審判。大きい数でも冷静に。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: false
    },
    {
      id: "m11",
      name: "11の倍数",
      menuTitle: "白門の11審",
      description: "11の倍数を名乗る魂だけを審判。偶数ケタと奇数ケタの差で見抜こう。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: true
    },
    {
      id: "m25",
      name: "25の倍数",
      menuTitle: "白門の25審",
      description: "25の倍数を名乗る魂だけを審判。下2ケタを一瞬で読む。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: true
    },
    {
      id: "random",
      name: "ランダム",
      menuTitle: "天門ヴァイス",
      description: "その時に使える全ての倍数の魂が混ざって出現。12体以上で強化解放。",
      durationMs: 30000,
      bgm: { type: "generated", mode: "tense" },
      strongOnly: false
    }
  ],
  input: {
    type: "button",
    layoutId: "judge-binary"
  },
  best: {
    labels: {
      normal: "通常モード",
      strong: "強化モード"
    }
  }
};
