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

function getPalette(divisor, isEvil){
  const normalPalette = {
    2: { fill1: "#f6fbff", fill2: "#8fd7ff", stroke: "#daf2ff", aura: "#fff1a5", text: "#15335e" },
    3: { fill1: "#f7fff5", fill2: "#8fe7b3", stroke: "#d9f8e3", aura: "#fff1a5", text: "#16462c" },
    5: { fill1: "#fff8f1", fill2: "#ffc27a", stroke: "#ffe1bd", aura: "#fff1a5", text: "#6a3a11" },
    6: { fill1: "#fff8f8", fill2: "#ff9fa8", stroke: "#ffd7db", aura: "#ffe4a8", text: "#692436" },
    7: { fill1: "#faf7ff", fill2: "#c4a0ff", stroke: "#eadcff", aura: "#ffe6ff", text: "#4f2675" },
    8: { fill1: "#f3fffd", fill2: "#8fe5d7", stroke: "#d6fbf3", aura: "#eaffe8", text: "#185247" },
    9: { fill1: "#fff9ef", fill2: "#f2d37c", stroke: "#ffefc5", aura: "#fff2b4", text: "#6a5614" },
    11: { fill1: "#f5f7ff", fill2: "#9aa8ff", stroke: "#dde3ff", aura: "#ece7ff", text: "#263778" },
    25: { fill1: "#fff7fb", fill2: "#ff9bc4", stroke: "#ffd7e9", aura: "#ffe0f0", text: "#7a224b" }
  };
  const evilPalette = {
    2: { fill1: "#866dff", fill2: "#4a37b3", stroke: "#1a0625", aura: "#ff7ab4", text: "#fff6bf" },
    3: { fill1: "#4b9d74", fill2: "#29593f", stroke: "#102519", aura: "#d9ff7a", text: "#f4ffe7" },
    5: { fill1: "#d5873f", fill2: "#7d4218", stroke: "#341a08", aura: "#ffcb7a", text: "#fff3d6" },
    6: { fill1: "#d9617d", fill2: "#7f2033", stroke: "#2f0911", aura: "#ff9eb8", text: "#fff0f2" },
    7: { fill1: "#9b67df", fill2: "#532684", stroke: "#220a38", aura: "#d69cff", text: "#f8efff" },
    8: { fill1: "#4db4aa", fill2: "#1f615f", stroke: "#0a2d2d", aura: "#8cffea", text: "#eafffb" },
    9: { fill1: "#c3a04a", fill2: "#665015", stroke: "#2d2308", aura: "#ffe17a", text: "#fff7d8" },
    11: { fill1: "#6f7cff", fill2: "#2f3b8e", stroke: "#14183d", aura: "#a2abff", text: "#f4f6ff" },
    25: { fill1: "#db71a6", fill2: "#7d2b53", stroke: "#330d21", aura: "#ff9cc8", text: "#fff1f8" }
  };
  const source = isEvil ? evilPalette : normalPalette;
  return source[divisor] || source[2];
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
  if(mood === "busted"){
    return {
      eyePath: `<path d="M39 52 L52 63" stroke="#240415" stroke-width="6" stroke-linecap="round"/><path d="M52 52 L39 63" stroke="#240415" stroke-width="6" stroke-linecap="round"/><path d="M68 52 L81 63" stroke="#240415" stroke-width="6" stroke-linecap="round"/><path d="M81 52 L68 63" stroke="#240415" stroke-width="6" stroke-linecap="round"/>`,
      mouth: `<path d="M42 84 Q60 74 78 84" fill="none" stroke="#2d001b" stroke-width="7" stroke-linecap="round"/><path d="M50 91 Q60 98 70 91" fill="none" stroke="#ffd7e9" stroke-width="3" stroke-linecap="round"/>`
    };
  }
  return {
    eyePath: `<ellipse cx="46" cy="58" rx="8" ry="10" fill="#14325b"/><ellipse cx="74" cy="58" rx="8" ry="10" fill="#14325b"/><circle cx="43" cy="55" r="2" fill="#ffffff"/><circle cx="71" cy="55" r="2" fill="#ffffff"/>`,
    mouth: `<path d="M44 84 Q60 92 76 84" fill="none" stroke="#35506d" stroke-width="5" stroke-linecap="round"/>`
  };
}

export function renderEnemySvg(problem, mood = "normal"){
  const isEvil = mood === "evil" || mood === "busted";
  const { eyePath, mouth } = getFace(mood);
  const palette = getPalette(problem.claimDivisor, isEvil);
  const { fill1, fill2, stroke, aura, text } = palette;
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
        <text x="62" y="42" text-anchor="middle" font-size="31" font-weight="1000" fill="${text}">${problem.number}</text>
        ${eyePath}
        ${mouth}
      </g>
    </svg>`;
}
