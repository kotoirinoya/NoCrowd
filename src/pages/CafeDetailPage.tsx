import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiClient, ApiError } from '@/api/client'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuth } from '@/context/AuthContext'
import { CongestionBadge } from '@/components/CongestionBadge'
import { AmenityIcons } from '@/components/AmenityIcons'
import { ShareButton } from '@/components/ShareButton'
import { formatRating } from '@/lib/rating'
import type { PostDTO, ShopDTO } from '@shared/types'

export function CafeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { coords } = useGeolocation()
  const { user } = useAuth()
  const [shop, setShop] = useState<ShopDTO | null>(null)
  const [posts, setPosts] = useState<PostDTO[]>([])
  const [error, setError] = useState<string | null>(null)

  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const [partySize, setPartySize] = useState(1)
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  useEffect(() => {
    if (!id) return
    const query = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : ''
    apiClient
      .get<ShopDTO>(`/shops/${id}${query}`)
      .then(setShop)
      .catch(() => setError('カフェ情報を取得できません。'))
    apiClient
      .get<PostDTO[]>(`/posts?shopId=${id}`)
      .then(setPosts)
      .catch(() => setPosts([]))
    // coordsは初回取得後に一度だけ反映すれば十分なため依存配列には含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (user) {
      setContactPhone(user.phone ?? '')
      setContactEmail(user.email ?? '')
    }
  }, [user])

  async function handleReserve() {
    if (!id) return
    setReserveError(null)
    if (!contactPhone && !contactEmail) {
      setReserveError('電話番号かメールアドレスのどちらかを入力してください。')
      return
    }
    setReserving(true)
    try {
      await apiClient.post('/reservations', {
        shopId: id,
        type: 'INSTANT',
        partySize,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
      })
      navigate('/reservations')
    } catch (err) {
      setReserveError(err instanceof ApiError ? err.message : '予約に失敗しました。')
    } finally {
      setReserving(false)
    }
  }

  if (error) return <p className="field-error">{error}</p>
  if (!shop) return <p>読み込み中...</p>

  return (
    <div className="page">
      <Link to="/search">← 地図に戻る</Link>
      <h1>{shop.name}</h1>
      <div className="cafe-detail__badges">
        <CongestionBadge level={shop.congestionLevel} />
        <span className="notice">{formatRating(shop.averageRating, shop.reviewCount)}</span>
      </div>
      {shop.congestionUpdatedAt && (
        <p className="notice">
          混雑状況の最終更新: {new Date(shop.congestionUpdatedAt).toLocaleString('ja-JP')}
        </p>
      )}

      {shop.photos.length > 0 && (
        <div className="cafe-detail__photos">
          {shop.photos.map((url) => (
            <img key={url} src={url} alt={shop.name} />
          ))}
        </div>
      )}

      <p>{shop.address}</p>
      {shop.distanceKm !== null && <p>現在地から約 {shop.distanceKm.toFixed(1)} km</p>}
      {shop.description && <p>{shop.description}</p>}

      <AmenityIcons shop={shop} />

      <p>
        空席 {shop.availableSeats} / {shop.totalSeats}
      </p>

      {(shop.menuPhotos.length > 0 || shop.menuItems.length > 0) && (
        <>
          <h2>メニュー</h2>
          {shop.menuItems.length > 0 && (
            <ul className="cafe-detail__menu-items">
              {shop.menuItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {shop.menuPhotos.length > 0 && (
            <div className="cafe-detail__photos">
              {shop.menuPhotos.map((url) => (
                <img key={url} src={url} alt="メニュー" />
              ))}
            </div>
          )}
        </>
      )}

      <div className="cafe-detail__reserve">
        {shop.availableSeats > 0 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleReserve()
            }}
          >
            <label>
              人数
              <input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </label>
            <label>
              電話番号
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </label>
            <label>
              メールアドレス
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </label>
            <button type="submit" disabled={reserving}>
              {reserving ? '確保中...' : '今すぐ座席を確保する'}
            </button>
          </form>
        ) : (
          <p className="notice">満席のため、現在座席を確保できません。</p>
        )}
        {reserveError && <p className="field-error">{reserveError}</p>}
      </div>

      <div className="cafe-detail__share">
        <ShareButton title={shop.name} url={window.location.href} />
      </div>

      <h2>みんなの投稿</h2>
      {posts.length === 0 && <p className="notice">まだ投稿がありません。</p>}
      <div className="post-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-grid__item">
            <img src={post.photoUrl} alt={post.comment} />
            <p className="post-grid__shop">@{post.user.username}</p>
            <p>{post.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
