export const buttonLayout = [
  { label: "7" }, { label: "8" }, { label: "9" }, { label: "-" },
  { label: "4" }, { label: "5" }, { label: "6" }, { label: "C", className: "special" },
  { label: "1" }, { label: "2" }, { label: "3" }, { label: "OK", className: "special" },
  { label: "0" }, { label: "00" }, { label: "⌫", className: "op" }, { label: " " }
];

export function mountButtonInput({ mount, onKey }){
  mount.innerHTML = "";

  const keypad = document.createElement("div");
  keypad.className = "inputKeypad";

  buttonLayout.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `inputKey${item.className ? ` ${item.className}` : ""}`;
    btn.textContent = item.label;
    btn.disabled = item.label === " ";
    btn.addEventListener("click", () => {
      if(item.label !== " ") onKey(item.label);
    });
    keypad.appendChild(btn);
  });

  const hint = document.createElement("div");
  hint.className = "inputHint";
  hint.textContent = "button 入力の雛形です。drag-drop や swap は別アダプタとして追加します。";

  mount.appendChild(keypad);
  mount.appendChild(hint);
}
