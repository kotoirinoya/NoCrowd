import { Link } from 'react-router-dom'
import type { ShopDTO } from '@shared/types'
import { CongestionBadge } from './CongestionBadge'
import { AmenityIcons } from './AmenityIcons'
import { formatRating } from '@/lib/rating'

export function ShopListItem({ shop }: { shop: ShopDTO }) {
  return (
    <Link to={`/cafe/${shop.id}`} className="cafe-card">
      <div className="cafe-card__header">
        <h3>{shop.name}</h3>
        <CongestionBadge level={shop.congestionLevel} />
      </div>
      <p className="cafe-card__address">{shop.address}</p>
      {shop.distanceKm !== null && (
        <p className="cafe-card__distance">現在地から約 {shop.distanceKm.toFixed(1)} km</p>
      )}
      <p className="cafe-card__seats">
        空席 {shop.availableSeats} / {shop.totalSeats} ・ {formatRating(shop.averageRating, shop.reviewCount)}
      </p>
      <AmenityIcons shop={shop} />
    </Link>
  )
}
