import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    // devcontainer環境でIPv6/IPv4解決の違いにより `vercel dev` の起動検知が
    // 失敗することがあるため、全インターフェースでlistenする
    host: true,
    // `vercel dev` はビルダーに割り当てたポート番号をPORT環境変数で渡し、
    // そのポートでサーバーが起動しているかを確認する。指定がなければ
    // 5173番が埋まっている時に別ポートへフォールバックし検知失敗の原因になるため、
    // 必ず指定ポートで起動しそれ以外へは逃がさないようにする。
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: true,
    proxy: {
      // ローカル開発では scripts/dev-api-server.ts (npm run dev:api) が4000番で応答する
      '/api': 'http://localhost:4000',
    },
  },
})
