import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '@/api/client'
import { uploadImage } from '@/lib/uploadImage'
import type { PostDTO, ShopDTO } from '@shared/types'

export function PostPage() {
  const [shops, setShops] = useState<ShopDTO[]>([])
  const [shopId, setShopId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<PostDTO | null>(null)

  useEffect(() => {
    apiClient
      .get<ShopDTO[]>('/shops')
      .then((list) => {
        setShops(list)
        if (list.length > 0) setShopId(list[0].id)
      })
      .catch(() => setError('カフェ一覧を取得できませんでした。'))
  }, [])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      setPhotoUrl(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '写真のアップロードに失敗しました。')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!shopId) {
      setError('カフェを選択してください。')
      return
    }
    if (!photoUrl) {
      setError('写真を選択してください。')
      return
    }
    if (!comment.trim()) {
      setError('コメントを入力してください。')
      return
    }
    setSubmitting(true)
    try {
      const post = await apiClient.post<PostDTO>('/posts', {
        shopId,
        photoUrl,
        comment,
        rating: rating > 0 ? rating : null,
      })
      setSuccess(post)
      setPhotoUrl(null)
      setComment('')
      setRating(0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '投稿に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>投稿する</h1>
      <p className="notice">気に入ったカフェの写真とコメントをシェアしよう。</p>

      <form onSubmit={handleSubmit}>
        <label>
          カフェを選ぶ
          <select value={shopId} onChange={(e) => setShopId(e.target.value)}>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </label>

        <label className="button">
          {uploading ? 'アップロード中...' : photoUrl ? '写真を変更' : '写真を選ぶ'}
          <input type="file" accept="image/*" hidden onChange={handlePhotoChange} disabled={uploading} />
        </label>
        {photoUrl && <img src={photoUrl} alt="選択した写真" className="post-page__preview" />}

        <label>
          コメント
          <textarea
            value={comment}
            maxLength={500}
            rows={4}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        <div className="post-page__rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`post-page__star${n <= rating ? ' post-page__star--filled' : ''}`}
              onClick={() => setRating(n === rating ? 0 : n)}
              aria-label={`${n}つ星`}
            >
              ★
            </button>
          ))}
        </div>

        {error && <p className="field-error">{error}</p>}
        {success && <p className="notice">投稿しました！</p>}

        <button type="submit" disabled={submitting || uploading}>
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </form>
    </div>
  )
}
