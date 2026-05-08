# Math Game HW integrated v5

Netlifyにアップロードする統合版です。

- `/index.html` : ゲーム一覧トップ
- `/games/tenkai-lightning/` : 展開ライトニング
- `/games/factorization-revenger/` : 因数分解リベンジャー
- `/shared/` : 因数分解リベンジャーなどで使う共通JS/CSS

v5変更:
- 天界ラッシュを basic / square / diff の3種類均等出現に変更
- 入力ボタンの `²` を常時表示に変更

Netlifyの Production deploys のドラッグ枠に、このフォルダ全体を入れてください。

## 開発ルール（新規ゲーム追加時）

今後、学年・単元別の数学ゲームを追加する際は、以下のルールを守って開発します。

1. **既存ゲームは変更しない**
   - すでに公開済みのゲーム（`games/tenkai-lightning/`、`games/factorization-revenger/` など）の挙動・UI・難易度は、原則として新規追加作業で変更しません。

2. **ゲームは `games/英語名/` に配置する**
   - 新規ゲームは `games/<english-name>/` のディレクトリを作成して追加します。
   - 例: `games/quadratic-quest/`

3. **共通処理は `shared/` を使う**
   - 複数ゲームで再利用する処理（スコア、保存、音、共通UI/CSSなど）は `shared/` に配置し、各ゲームから読み込みます。

4. **トップページ `index.html` にリンクを追加する**
   - 新規ゲーム公開時は、必ずトップページ（`/index.html`）にゲーム導線を追加し、一覧から遷移できるようにします。

5. **スマホ対応を前提に実装する**
   - タッチ操作・画面幅の小さい端末での操作性を優先します。
   - ボタンサイズ、文字サイズ、余白、縦画面表示を確認してから公開します。
