# Planner

予定・TODO・メモ・Claudeの進捗を一画面で管理するアプリ（現在はモバイル版）。
ビルド不要の静的サイトで、`index.html` を開けば動きます。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | 画面の骨組み（モバイル版）とスクリプトの読み込み |
| `pc.html` / `css/pc.css` / `js/pc.js` / `img/logo.png` | PC版（ダッシュボード）。データ処理は `storage.js` / `core.js` / `account.js` を共有 |
| `css/mobile.css` | モバイル版のスタイル |
| `js/config.js` | クラウド保存（Supabase）の接続情報（自分で作成）。無い／空ならこの端末のみに保存。見本は `js/config.example.js` |
| `js/storage.js` | **データ保存層**（端末への保存・Supabase同期・JSON書き出し／読み込み） |
| `js/account.js` | アカウント／同期の画面 |
| `js/core.js` | データ・定数・日付ヘルパー・繰り返し予定の展開 |
| `js/ui.js` | 画面切替・モーダル・メニュー・フォルダー一覧 |
| `js/calendar.js` | カレンダー（日／週／月の連続スクロール） |
| `js/events.js` | 予定の作成・編集・削除・詳細 |
| `js/lists.js` | TODO・メモ・Claude進捗・使用量 |
| `js/home.js` | ホーム画面と上部ボックスの描画 |
| `js/main.js` | 起動処理 |

表示は端末に合わせて自動で振り分けます（幅1024px以上のマウス操作環境ならPC版、それ以外はモバイル版）。
手動で切り替えるには、モバイル版のメニューの「PC表示に切り替え」、PC版のサイドバーの「モバイル表示に切り替え」を使います。選んだ表示はその端末のブラウザに保存され、「表示を自動に戻す」で元に戻せます。
`index.html?mobile` を開くと、一時的にモバイル表示になります。

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

## フォントについて

PC版の文字は **游明朝**（Windows / Mac に入っているフォント）を使います。Webフォントは読み込みません。入っていない環境（一部のLinuxなど）では、代わりの明朝体で表示されます。

## データについて

- 予定などのデータは **ブラウザのlocalStorage** に保存されます。端末・ブラウザ・URLごとに別データで、スマホとPCでは共有されません。
- メニューの「データを書き出す／読み込む」でJSONバックアップを取れます。個人データなので、書き出したファイルはリポジトリに入れないでください（`.gitignore` で除外済み）。
- 端末間で自動同期するには、下記の「クラウド保存の設定」を行います（未設定でも端末内保存で動きます）。

## クラウド保存の設定（Supabase）

1. [Supabase](https://supabase.com) でプロジェクトを作成（無料枠の条件は公式で確認）
2. SQL Editor で `supabase/setup.sql` を実行（**RLSで自分のデータだけ読み書き可能**になります）
3. Authentication → Providers で Email を有効化（メール確認を使う場合は、URL Configuration の Site URL に公開URLを設定）
4. `js/config.example.js` を `js/config.js` にコピーし、Project Settings → API の **Project URL** と **anon public key** を貼る（`service_role` キーは絶対に貼らない）
5. push して公開 → メニューの「アカウント／同期」から新規登録・ログイン

- ログイン後は、変更のたびに自動で同期します。2台で別々に編集した場合は、更新が新しい方が採用されます（個人利用向けの簡易方式）。
- 端末にもデータを持つので、オフラインでも使えます。

## これから

- [ ] PC版（`css/pc.css` などを追加）。現状 `core.js` と `storage.js` は画面に依存しない部分。`calendar.js` / `home.js` / `ui.js` / `events.js` はモバイル画面のIDに依存しているため、PC版の着手時にUI部分の分離を行う
- [x] クラウド保存（Supabase・ログイン付き）
