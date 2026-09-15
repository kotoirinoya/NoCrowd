import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, ApiError } from '@/api/client'
import type { ReservationDTO } from '@shared/types'

const STATUS_LABELS: Record<ReservationDTO['status'], string> = {
  ACTIVE: '有効',
  COMPLETED: '来店済み',
  CANCELLED: 'キャンセル',
  EXPIRED: '失効',
}

function formatRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'まもなく失効'
  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)
  return `残り ${minutes}分${seconds.toString().padStart(2, '0')}秒`
}

function formatScheduledFor(scheduledFor: string): string {
  return new Date(scheduledFor).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationDTO[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, setTick] = useState(0)

  function reload() {
    apiClient
      .get<ReservationDTO[]>('/reservations')
      .then(setReservations)
      .catch(() => setError('予約情報を取得できませんでした。'))
  }

  useEffect(() => {
    reload()
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleCancel(id: string) {
    try {
      await apiClient.post(`/reservations/${id}/cancel`)
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'キャンセルに失敗しました。')
    }
  }

  const active = reservations?.filter((r) => r.status === 'ACTIVE') ?? []
  const past = reservations?.filter((r) => r.status !== 'ACTIVE') ?? []

  return (
    <div className="page">
      <Link to="/search">← 地図に戻る</Link>
      <h1>予約状況</h1>
      {error && <p className="field-error">{error}</p>}

      {active.length === 0 && <p>有効な予約はありません。</p>}
      {active.map((r) => (
        <div key={r.id} className="reservation-card reservation-card--active">
          <h2>{r.shop.name}</h2>
          <p>{r.shop.address}</p>
          <p>予約番号: {r.code}</p>
          <p>スマホの充電切れ等の場合は、上記の予約番号かユーザー名をお店に伝えてください。</p>
          {r.partySize !== null && <p>人数: {r.partySize}名</p>}
          {(r.contactPhone || r.contactEmail) && (
            <p className="notice">連絡先: {r.contactPhone || r.contactEmail}</p>
          )}
          {r.type === 'INSTANT' && r.expiresAt ? (
            <p className="reservation-card__timer">{formatRemaining(r.expiresAt)}</p>
          ) : (
            r.scheduledFor && <p>{formatScheduledFor(r.scheduledFor)}</p>
          )}
          <button type="button" onClick={() => handleCancel(r.id)}>
            予約をキャンセル
          </button>
        </div>
      ))}

      {past.length > 0 && (
        <>
          <h2>過去の予約</h2>
          {past.map((r) => (
            <div key={r.id} className="reservation-card">
              <p>
                {r.shop.name}（{STATUS_LABELS[r.status]}）
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
