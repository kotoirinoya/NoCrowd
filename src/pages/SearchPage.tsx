import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { shopMarkerIcon } from '@/lib/leafletIcon'
import { apiClient } from '@/api/client'
import { useGeolocation } from '@/hooks/useGeolocation'
import { CongestionBadge } from '@/components/CongestionBadge'
import { AmenityIcons } from '@/components/AmenityIcons'
import { ShopListItem } from '@/components/ShopListItem'
import { formatRating } from '@/lib/rating'
import type { ShopDTO } from '@shared/types'

// 位置情報が取れない/拒否された場合のデフォルト中心地（神戸・三宮）
const SANNOMIYA_CENTER = { lat: 34.6952, lng: 135.1955 }
const DEFAULT_ZOOM = 15
// このズームレベル以上に拡大した時だけ、ピンの上にカフェ名を常時表示する
const NAME_LABEL_MIN_ZOOM = 16

function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng])
  }, [center.lat, center.lng, map])
  return null
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  })
  return null
}

export function SearchPage() {
  const { coords, loading: geoLoading } = useGeolocation()
  const [shops, setShops] = useState<ShopDTO[]>([])
  const [error, setError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [wifiOnly, setWifiOnly] = useState(false)
  const [powerOnly, setPowerOnly] = useState(false)
  const [minSeats, setMinSeats] = useState(0)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const center = coords ?? SANNOMIYA_CENTER

  useEffect(() => {
    if (geoLoading) return
    apiClient
      .get<ShopDTO[]>(`/shops?lat=${center.lat}&lng=${center.lng}`)
      .then(setShops)
      .catch(() => setError('カフェ一覧を取得できませんでした。'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoLoading, coords?.lat, coords?.lng])

  const filteredShops = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shops.filter((shop) => {
      if (q) {
        const matchesName = shop.name.toLowerCase().includes(q)
        const matchesMenu = shop.menuItems.some((item) => item.toLowerCase().includes(q))
        if (!matchesName && !matchesMenu) return false
      }
      if (minRating > 0 && (shop.averageRating ?? 0) < minRating) return false
      if (wifiOnly && !shop.hasWifi) return false
      if (powerOnly && !shop.hasPower) return false
      if (minSeats > 0 && shop.availableSeats < minSeats) return false
      return true
    })
  }, [shops, query, minRating, wifiOnly, powerOnly, minSeats])

  return (
    <div className={viewMode === 'map' ? 'search-page' : 'search-page search-page--list'}>
      <div className="search-page__toolbar">
        <input
          ref={searchInputRef}
          type="search"
          placeholder="カフェ名やメニューで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') searchInputRef.current?.blur()
          }}
        />
        <button type="button" onClick={() => searchInputRef.current?.blur()}>
          検索
        </button>
        <button type="button" className="button" onClick={() => setShowFilters((v) => !v)}>
          フィルター
        </button>
        <button
          type="button"
          className="button"
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        >
          {viewMode === 'map' ? 'リスト表示' : '地図表示'}
        </button>
      </div>

      {showFilters && (
        <div className="search-page__filters">
          <label>
            評価
            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
              <option value={0}>指定なし</option>
              <option value={3}>★3以上</option>
              <option value={4}>★4以上</option>
              <option value={5}>★5</option>
            </select>
          </label>
          <label className="search-page__filter-checkbox">
            <input type="checkbox" checked={wifiOnly} onChange={(e) => setWifiOnly(e.target.checked)} />
            Wi-Fiあり
          </label>
          <label className="search-page__filter-checkbox">
            <input type="checkbox" checked={powerOnly} onChange={(e) => setPowerOnly(e.target.checked)} />
            充電できる
          </label>
          <label>
            空席数
            <select value={minSeats} onChange={(e) => setMinSeats(Number(e.target.value))}>
              <option value={0}>指定なし</option>
              <option value={1}>1席以上</option>
              <option value={3}>3席以上</option>
              <option value={5}>5席以上</option>
            </select>
          </label>
        </div>
      )}

      {!geoLoading && !coords && (
        <p className="notice search-page__notice">
          位置情報が取得できなかったため、三宮エリアを表示しています。
        </p>
      )}
      {error && <p className="field-error search-page__notice">{error}</p>}

      {viewMode === 'map' ? (
        <MapContainer center={[center.lat, center.lng]} zoom={DEFAULT_ZOOM} className="search-page__map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={center} />
          <ZoomWatcher onZoomChange={setZoom} />
          {filteredShops.map((shop) => (
            <Marker key={shop.id} position={[shop.lat, shop.lng]} icon={shopMarkerIcon}>
              {zoom >= NAME_LABEL_MIN_ZOOM && (
                <Tooltip permanent direction="top" offset={[0, -40]} className="nocrowd-marker-label">
                  {shop.name}
                </Tooltip>
              )}
              <Popup>
                <div className="search-page__popup">
                  {shop.photos[0] && <img src={shop.photos[0]} alt={shop.name} />}
                  <h3>{shop.name}</h3>
                  <CongestionBadge level={shop.congestionLevel} />
                  <p>{formatRating(shop.averageRating, shop.reviewCount)}</p>
                  <AmenityIcons shop={shop} />
                  <p>
                    空席 {shop.availableSeats} / {shop.totalSeats}
                  </p>
                  <Link to={`/cafe/${shop.id}`}>詳細・予約はこちら</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="cafe-list">
          {filteredShops.length === 0 && <p className="notice">条件に合うカフェが見つかりません。</p>}
          {filteredShops.map((shop) => (
            <ShopListItem key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  )
}
