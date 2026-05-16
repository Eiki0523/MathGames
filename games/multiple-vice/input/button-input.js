const buttonLayout = [
  { label: "◯", className: "judge yes" },
  { label: "✕", className: "judge no" }
];

export function mountButtonInput({ mount, onKey }){
  mount.innerHTML = "";

  const keypad = document.createElement("div");
  keypad.className = "judgePad";

  buttonLayout.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `judgeKey ${item.className}`;
    btn.textContent = item.label;
    btn.addEventListener("click", () => onKey(item.label));
    keypad.appendChild(btn);
  });

  const hint = document.createElement("div");
  hint.className = "inputHint";
  hint.textContent = "本当なら◯、嘘なら✕を押します。";

  mount.appendChild(keypad);
  mount.appendChild(hint);
}
