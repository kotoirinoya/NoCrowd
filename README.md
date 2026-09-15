# NoCrowd

テスト期間に勉強できるカフェを探す大学生向けの、混雑状況共有＆座席予約・投稿アプリ。

## 技術スタック

- フロントエンド: Vite + React + TypeScript
- 地図: Leaflet + OpenStreetMap（APIキー不要）
- 画像保存: Vercel Blob
- API: `api/` 配下の Vercel Functions（ブラウザは直接DBに接続しない）
- DB: Vercel Postgres (Neon) + Prisma ORM
- デプロイ: Vercel (Hobby)

## セットアップ

1. 依存関係をインストール
   ```
   npm install
   ```
2. `.env.local.example` を `.env.local` にコピーし、以下を設定する。
   ```
   cp .env.local.example .env.local
   ```
   - `DATABASE_URL`: Vercel Dashboard の Storage (Postgres/Neon) から取得
   - `JWT_SECRET`: ランダムな長い文字列（`openssl rand -hex 32` などで生成）
   - `BLOB_READ_WRITE_TOKEN`: Vercel Dashboard の Storage → Blob でストアを作成して発行（投稿写真・プロフィール画像のアップロードに必要）
3. マイグレーションとサンプルデータ投入
   ```
   npx prisma migrate dev
   npx prisma db seed
   ```
   （店舗スタッフの初期ユーザー名・パスワードは `prisma/seed.ts` を参照。ローカル検証用の値のため、実運用前に変更すること）
4. ローカル起動（ターミナルを2つ使う）
   ```
   # ターミナル1: フロントエンド
   npm run dev

   # ターミナル2: ローカルAPIサーバー（api/配下のハンドラーをそのまま実行する）
   npm run dev:api
   ```
   `npm run dev` は `http://localhost:5173` で起動し、`/api/*` へのリクエストは `vite.config.ts` の proxy 設定により `npm run dev:api`（`http://localhost:4000`）へ転送される。

   > `npx vercel dev` でも動かせるが、開発コンテナ環境ではNode Functionsのリクエストがハングする既知の問題があるため、ローカル開発では上記の2コマンド構成を推奨する。本番デプロイ（Vercelへのpush）では通常の Vercel Functions として問題なく動作する。

## 主な画面

- `/` ランディングページ
- `/signup`, `/login` 会員登録・ログイン
- `/onboarding` 登録直後のプロフィール設定（スキップ可、あとから `/profile` でいつでも変更可）
- `/search` 地図でカフェを探す（現在地 or 三宮エリア、混雑度・評価・設備をポップアップ表示）
- `/cafe/:id` カフェ詳細・座席の即時予約 or 日時指定予約・投稿レビュー閲覧・共有
- `/post` カフェへの写真付きレビュー投稿
- `/reservations` 自分の予約状況（即時予約は残り時間、日時指定予約は人数・日時を表示）
- `/profile` プロフィール編集・自分の投稿一覧
- `/shop/login`, `/shop/dashboard` 店舗スタッフ用（混雑度・空席数の手動更新、来店/未来店の処理）

ログイン後は下部の4タブ（探す/投稿/予約/プロフィール）で画面を切り替える。

## 検証

- `npm run build`: フロントエンドのビルド確認
- `npm run typecheck`: TypeScript の型検証（`src` / `api` / `shared` / `prisma`）
- `npx prisma validate`: Prisma スキーマの妥当性確認（DB接続不要）

本番相当の動作確認（会員登録・予約・投稿・店舗ダッシュボード等）は、実際の Neon Postgres に接続した状態で `npm run dev` + `npm run dev:api` を使って行うこと。画像アップロードの確認には `BLOB_READ_WRITE_TOKEN` の設定が必要。
