# あたり・はずれルーレット

公開URL: https://roulette-psi-ochre.vercel.app

## 構成

- `roulette.html` … 編集用のアプリ本体
- `deploy/` … Vercel に公開されるフォルダ（Vercel のルートディレクトリ）
  - `index.html` … `roulette.html` のコピー
  - `api/spins.js` … 履歴の保存・取得 API（Neon Postgres）
  - `scripts/init-db.mjs` … テーブル作成（初回のみ）

## 更新手順

1. `roulette.html` を編集する
2. `deploy/index.html` にコピーする
3. `main` に push すると Vercel が自動で本番デプロイする
