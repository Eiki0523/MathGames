export const themeConfig = {
  cssVars: {
    "--vice-bg-1": "#0b1220",
    "--vice-bg-2": "#243a64",
    "--vice-accent-1": "#fff1a5",
    "--vice-accent-2": "#7ed9ff",
    "--vice-accent-3": "#d8f2ff",
    "--vice-danger": "#ff5f74",
    "--vice-evil": "#6f7cff",
    "--vice-evil-2": "#31133d"
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
    strong: "強化モードでは3桁の魂が現れます。",
    limit: "極限モードでは見逃し回数が1になります。",
    locked: "ランダムモードで12体以上見抜くと強化モードが解放されます。",
    unlocked: "強化モード解放済み。押すと通常/強化を切り替えます。"
  }
};

export function applyThemeVars(root = document.documentElement){
  Object.entries(themeConfig.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function getFace(mood){
  if(mood === "thanks"){
    return {
      eyePath: `<path d="M38 56 Q46 49 54 56" fill="none" stroke="#14325b" stroke-width="5" stroke-linecap="round"/><path d="M66 56 Q74 49 82 56" fill="none" stroke="#14325b" stroke-width="5" stroke-linecap="round"/>`,
      mouth: `<path d="M42 82 Q60 98 78 82" fill="none" stroke="#28508c" stroke-width="6" stroke-linecap="round"/>`
    };
  }
  if(mood === "cry"){
    return {
      eyePath: `<ellipse cx="46" cy="56" rx="7" ry="10" fill="#14325b"/><ellipse cx="74" cy="56" rx="7" ry="10" fill="#14325b"/><path d="M42 45 L52 51" stroke="#14325b" stroke-width="4" stroke-linecap="round"/><path d="M68 51 L78 45" stroke="#14325b" stroke-width="4" stroke-linecap="round"/><path d="M44 67 C40 74 40 84 45 91" fill="none" stroke="#83dfff" stroke-width="4" stroke-linecap="round"/><path d="M76 67 C80 74 80 84 75 91" fill="none" stroke="#83dfff" stroke-width="4" stroke-linecap="round"/>`,
      mouth: `<path d="M42 86 Q60 72 78 86" fill="none" stroke="#35506d" stroke-width="6" stroke-linecap="round"/>`
    };
  }
  if(mood === "evil"){
    return {
      eyePath: `<path d="M36 53 L54 59" stroke="#1e0425" stroke-width="6" stroke-linecap="round"/><path d="M84 53 L66 59" stroke="#1e0425" stroke-width="6" stroke-linecap="round"/><ellipse cx="46" cy="60" rx="8" ry="6" fill="#fff2aa"/><ellipse cx="74" cy="60" rx="8" ry="6" fill="#fff2aa"/><circle cx="46" cy="60" r="3" fill="#3d0028"/><circle cx="74" cy="60" r="3" fill="#3d0028"/>`,
      mouth: `<path d="M40 82 Q60 66 80 82" fill="none" stroke="#2d001b" stroke-width="7" stroke-linecap="round"/><path d="M44 82 L50 89 L56 82 L62 89 L68 82 L74 89" fill="none" stroke="#fff0df" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    };
  }
  return {
    eyePath: `<ellipse cx="46" cy="58" rx="8" ry="10" fill="#14325b"/><ellipse cx="74" cy="58" rx="8" ry="10" fill="#14325b"/><circle cx="43" cy="55" r="2" fill="#ffffff"/><circle cx="71" cy="55" r="2" fill="#ffffff"/>`,
    mouth: `<path d="M44 84 Q60 92 76 84" fill="none" stroke="#35506d" stroke-width="5" stroke-linecap="round"/>`
  };
}

export function renderEnemySvg(problem, mood = "normal"){
  const isEvil = mood === "evil";
  const { eyePath, mouth } = getFace(mood);
  const fill1 = isEvil ? "#8366ff" : "#f7fbff";
  const fill2 = isEvil ? "#4830a3" : "#92d7ff";
  const stroke = isEvil ? "#1a0625" : "#daf2ff";
  const aura = isEvil ? "#ff7ab4" : "#fff1a5";
  return `
    <svg class="enemySvg" viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <radialGradient id="viceBody" cx="50%" cy="38%" r="62%">
          <stop offset="0" stop-color="${fill1}"/>
          <stop offset=".52" stop-color="${fill1}"/>
          <stop offset="1" stop-color="${fill2}"/>
        </radialGradient>
      </defs>
      <g transform="translate(18,42)">
        <ellipse cx="62" cy="102" rx="42" ry="10" fill="rgba(0,0,0,.22)"/>
        <circle cx="62" cy="58" r="48" fill="url(#viceBody)" stroke="${stroke}" stroke-width="4"/>
        <path d="M23 26 C10 42 10 72 22 88" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
        <path d="M101 26 C114 42 114 72 102 88" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="62" cy="58" r="54" fill="none" stroke="${aura}" stroke-width="4" opacity=".5"/>
        <text x="62" y="54" text-anchor="middle" font-size="34" font-weight="1000" fill="${isEvil ? "#fff6bf" : "#15335e"}">${problem.number}</text>
        ${eyePath}
        ${mouth}
      </g>
    </svg>`;
}
