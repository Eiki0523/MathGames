// MathGame_browser shared/storage.js
// localStorage保存の共通モジュール。
// 注意：ログインなし保存は端末・ブラウザ・URLごとに別保存。

export const Storage = (() => {
  function safeLoad(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(raw == null) return fallback;
      return JSON.parse(raw);
    }catch(e){
      return fallback;
    }
  }

  function safeSave(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadFlag(key){
    return localStorage.getItem(key) === "true";
  }

  function saveFlag(key, value){
    localStorage.setItem(key, value ? "true" : "false");
  }

  function remove(key){
    localStorage.removeItem(key);
  }

  return {
    safeLoad,
    safeSave,
    loadFlag,
    saveFlag,
    remove
  };
})();
