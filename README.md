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

## AWS 版

公開URL: https://d3nhegk708l5n.cloudfront.net

CloudFront（HTTPS）→ S3（画面） / Lambda（`/api/*`）→ Neon。構成は `aws/template.yaml`（スタック名 `roulette`、東京リージョン）。

- 画面の更新:
  `aws s3 cp roulette.html s3://roulette-sitebucket-rrrvbkhe2iye/index.html --content-type "text/html; charset=utf-8" --cache-control "max-age=60"`
- API・構成の更新: `aws/` で `aws cloudformation package` → `aws cloudformation deploy`（`DatabaseUrl` パラメータが必要）
