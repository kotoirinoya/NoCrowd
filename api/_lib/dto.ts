import type { Shop, Reservation, User } from '@prisma/client'
import { haversineDistanceKm } from '../../shared/distance'
import type { ShopDTO, ReservationDTO, ShopReservationDTO, UserDTO } from '../../shared/types'

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    avatarUrl: user.avatarUrl,
    age: user.age,
    schoolType: user.schoolType,
    schoolName: user.schoolName,
    gender: user.gender,
    birthday: user.birthday ? user.birthday.toISOString() : null,
  }
}

interface RatingStats {
  average: number | null
  count: number
}

export function toShopDTO(
  shop: Shop,
  coords?: { lat: number; lng: number } | null,
  ratingStats?: RatingStats,
): ShopDTO {
  return {
    id: shop.id,
    name: shop.name,
    address: shop.address,
    lat: shop.lat,
    lng: shop.lng,
    isChain: shop.isChain,
    hasWifi: shop.hasWifi,
    hasPower: shop.hasPower,
    smokingStatus: shop.smokingStatus,
    photos: shop.photos,
    menuPhotos: shop.menuPhotos,
    menuItems: shop.menuItems,
    description: shop.description,
    totalSeats: shop.totalSeats,
    availableSeats: shop.availableSeats,
    congestionLevel: shop.congestionLevel,
    congestionUpdatedAt: shop.congestionUpdatedAt ? shop.congestionUpdatedAt.toISOString() : null,
    distanceKm: coords ? haversineDistanceKm(coords.lat, coords.lng, shop.lat, shop.lng) : null,
    averageRating: ratingStats?.average ?? null,
    reviewCount: ratingStats?.count ?? 0,
  }
}

export function toReservationDTO(reservation: Reservation & { shop: Shop }): ReservationDTO {
  return {
    id: reservation.id,
    code: reservation.code,
    type: reservation.type,
    status: reservation.status,
    reservedAt: reservation.reservedAt.toISOString(),
    expiresAt: reservation.expiresAt ? reservation.expiresAt.toISOString() : null,
    cancelledAt: reservation.cancelledAt ? reservation.cancelledAt.toISOString() : null,
    partySize: reservation.partySize,
    scheduledFor: reservation.scheduledFor ? reservation.scheduledFor.toISOString() : null,
    contactPhone: reservation.contactPhone,
    contactEmail: reservation.contactEmail,
    shop: {
      id: reservation.shop.id,
      name: reservation.shop.name,
      address: reservation.shop.address,
    },
  }
}

export function toShopReservationDTO(
  reservation: Reservation & { user: User },
): ShopReservationDTO {
  return {
    id: reservation.id,
    code: reservation.code,
    type: reservation.type,
    status: reservation.status,
    reservedAt: reservation.reservedAt.toISOString(),
    expiresAt: reservation.expiresAt ? reservation.expiresAt.toISOString() : null,
    partySize: reservation.partySize,
    scheduledFor: reservation.scheduledFor ? reservation.scheduledFor.toISOString() : null,
    user: { username: reservation.user.username },
  }
}
