import { useState } from 'react'

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // ユーザーがキャンセルした場合は何もしない
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" onClick={handleShare}>
      {copied ? 'リンクをコピーしました' : '友達に共有する'}
    </button>
  )
}
