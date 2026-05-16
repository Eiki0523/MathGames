export const themeConfig = {
  cssVars: {
    "--template-bg-1": "#08121f",
    "--template-bg-2": "#102b46",
    "--template-accent-1": "#ffd55a",
    "--template-accent-2": "#5bd6ff",
    "--template-accent-3": "#7d8bff",
    "--template-danger": "#ff6a84"
  },
  labels: {
    strongOn: "強化モード：ON",
    strongOff: "強化モード：OFF",
    strongLocked: "強化モード：未解放",
    limitOn: "極限モード：ON",
    limitOff: "極限モード：OFF",
    soundOn: "音：ON",
    soundOff: "音：OFF"
  },
  notes: {
    strong: "強化モードでは大きい数の問題が増えます。",
    limit: "極限モードでは体力が1になります。",
    locked: "ミックスモードで5体以上撃破すると強化モードが解放されます。",
    unlocked: "強化モード解放済み。押すと通常/強化を切り替えます。"
  }
};

export function applyThemeVars(root = document.documentElement){
  Object.entries(themeConfig.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function renderEnemySvg(kind, mood = "normal"){
  const angry = mood === "attack";
  const baseColor = kind === "sub" ? "#8ba2ff" : kind === "mix" ? "#ffd55a" : "#5bd6ff";
  const glowColor = kind === "sub" ? "#d3dcff" : kind === "mix" ? "#fff4b0" : "#c8f8ff";

  return `
    <svg class="enemySvg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="templateEnemyCore" cx="50%" cy="40%" r="58%">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset=".42" stop-color="${glowColor}"/>
          <stop offset="1" stop-color="${baseColor}"/>
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="24" rx="20" ry="8" fill="none" stroke="${glowColor}" stroke-width="4"/>
      <path d="M25 44 Q8 28 14 14 Q36 18 48 42" fill="#f9fbff" stroke="${glowColor}" stroke-width="3"/>
      <path d="M95 44 Q112 28 106 14 Q84 18 72 42" fill="#f9fbff" stroke="${glowColor}" stroke-width="3"/>
      <circle cx="60" cy="65" r="34" fill="url(#templateEnemyCore)" stroke="${glowColor}" stroke-width="4"/>
      <circle cx="46" cy="59" r="6" fill="#1d2a40"/>
      <circle cx="74" cy="59" r="6" fill="#1d2a40"/>
      ${angry
        ? `<path d="M42 84 Q60 67 78 84" fill="none" stroke="#3b1630" stroke-width="6" stroke-linecap="round"/>`
        : `<path d="M44 79 Q60 89 76 79" fill="none" stroke="#35506d" stroke-width="5" stroke-linecap="round"/>`}
      <path d="M39 43 Q60 34 81 43" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
}
