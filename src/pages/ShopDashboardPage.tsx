import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, ApiError } from '@/api/client'
import type { CongestionLevel, ShopDTO, ShopReservationDTO } from '@shared/types'

interface StatusResponse {
  shop: ShopDTO
  reservations: ShopReservationDTO[]
}

function formatReservationTiming(r: ShopReservationDTO): string {
  if (r.type === 'INSTANT') {
    return r.expiresAt ? `〜${new Date(r.expiresAt).toLocaleTimeString('ja-JP')}` : '-'
  }
  const when = r.scheduledFor ? new Date(r.scheduledFor).toLocaleString('ja-JP') : '-'
  return `${when}・${r.partySize ?? '?'}名`
}

const CONGESTION_OPTIONS: { value: CongestionLevel; label: string }[] = [
  { value: 'EMPTY', label: '空席あり' },
  { value: 'MODERATE', label: 'やや混雑' },
  { value: 'FULL', label: '満席' },
]

export function ShopDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [congestionLevel, setCongestionLevel] = useState<CongestionLevel>('EMPTY')
  const [availableSeats, setAvailableSeats] = useState(0)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  function reload() {
    apiClient
      .get<StatusResponse>('/shop/status')
      .then((res) => {
        setData(res)
        setCongestionLevel(res.shop.congestionLevel === 'UNKNOWN' ? 'EMPTY' : res.shop.congestionLevel)
        setAvailableSeats(res.shop.availableSeats)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/shop/login')
          return
        }
        setError('店舗情報を取得できませんでした。')
      })
  }

  useEffect(reload, [navigate])

  async function handleUpdateStatus(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiClient.post('/shop/status', { congestionLevel, availableSeats })
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '更新に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  async function handleReservationAction(id: string, action: 'complete' | 'no_show') {
    try {
      await apiClient.post(`/shop/reservations/${id}`, { action })
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '更新に失敗しました。')
    }
  }

  async function handleLogout() {
    await apiClient.post('/shop-auth/logout')
    navigate('/shop/login')
  }

  if (!data) return <p>読み込み中...</p>

  const filteredReservations = data.reservations.filter((r) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return r.code.toLowerCase().includes(q) || r.user.username.toLowerCase().includes(q)
  })

  return (
    <div className="page">
      <header className="page__header">
        <h1>{data.shop.name} 管理画面</h1>
        <button type="button" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      {error && <p className="field-error">{error}</p>}

      <form onSubmit={handleUpdateStatus} className="shop-status-form">
        <label>
          混雑状況
          <select
            value={congestionLevel}
            onChange={(e) => setCongestionLevel(e.target.value as CongestionLevel)}
          >
            {CONGESTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          空席数（全{data.shop.totalSeats}席）
          <input
            type="number"
            min={0}
            max={data.shop.totalSeats}
            value={availableSeats}
            onChange={(e) => setAvailableSeats(Number(e.target.value))}
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? '更新中...' : '更新する'}
        </button>
      </form>

      <h2>有効な予約一覧</h2>
      <input
        type="text"
        placeholder="予約番号またはユーザー名で検索"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table className="reservation-table">
        <thead>
          <tr>
            <th>種別</th>
            <th>予約番号</th>
            <th>ユーザー名</th>
            <th>日時/人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredReservations.map((r) => (
            <tr key={r.id}>
              <td>{r.type === 'INSTANT' ? '今すぐ' : '日時指定'}</td>
              <td>{r.code}</td>
              <td>{r.user.username}</td>
              <td>{formatReservationTiming(r)}</td>
              <td>
                <button type="button" onClick={() => handleReservationAction(r.id, 'complete')}>
                  来店済み
                </button>
                <button type="button" onClick={() => handleReservationAction(r.id, 'no_show')}>
                  未来店（解放）
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
