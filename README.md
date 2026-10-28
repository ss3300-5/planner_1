# Planner

予定・TODO・メモ・Claudeの進捗を一画面で管理するアプリ（現在はモバイル版）。
ビルド不要の静的サイトで、`index.html` を開けば動きます。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | 画面の骨組み（モバイル版）とスクリプトの読み込み |
| `css/mobile.css` | モバイル版のスタイル |
| `js/storage.js` | **データ保存層**（保存先の読み書き・JSON書き出し／読み込み） |
| `js/core.js` | データ・定数・日付ヘルパー・繰り返し予定の展開 |
| `js/ui.js` | 画面切替・モーダル・メニュー・フォルダー一覧 |
| `js/calendar.js` | カレンダー（日／週／月の連続スクロール） |
| `js/events.js` | 予定の作成・編集・削除・詳細 |
| `js/lists.js` | TODO・メモ・Claude進捗・使用量 |
| `js/home.js` | ホーム画面と上部ボックスの描画 |
| `js/main.js` | 起動処理 |

読み込み順は `index.html` のとおりです（順番を変えると動きません）。

## ローカルで動かす

```
python3 -m http.server 8000
```
ブラウザで `http://localhost:8000` を開きます。

## GitHub Pagesで公開する

1. このフォルダの中身をリポジトリのルートに置いて push
2. リポジトリの Settings → Pages → Source を `Deploy from a branch`、Branch を `main` / `(root)` にする
3. 表示されたURLを開く

## データについて

- 予定などのデータは **ブラウザのlocalStorage** に保存されます。端末・ブラウザ・URLごとに別データで、スマホとPCでは共有されません。
- メニューの「データを書き出す／読み込む」でJSONバックアップを取れます。個人データなので、書き出したファイルはリポジトリに入れないでください（`.gitignore` で除外済み）。
- 端末間で自動同期するには、クラウド保存（Supabase / Firebase 等）が別途必要です。`js/storage.js` の `Store` を差し替える想定です。

## これから

- [ ] PC版（`css/pc.css` などを追加）。現状 `core.js` と `storage.js` は画面に依存しない部分。`calendar.js` / `home.js` / `ui.js` / `events.js` はモバイル画面のIDに依存しているため、PC版の着手時にUI部分の分離を行う
- [ ] クラウド保存（ログイン付き）
