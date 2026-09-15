export type SmokingStatus = 'NON_SMOKING' | 'SMOKING' | 'SEPARATED'
export type CongestionLevel = 'UNKNOWN' | 'EMPTY' | 'MODERATE' | 'FULL'
export type ReservationStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type ReservationType = 'INSTANT' | 'SCHEDULED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'
export type SchoolType = 'ELEMENTARY' | 'JUNIOR_HIGH' | 'HIGH_SCHOOL' | 'UNIVERSITY' | 'VOCATIONAL' | 'OTHER'

export interface UserDTO {
  id: string
  username: string
  phone: string | null
  email: string | null
  avatarUrl: string | null
  age: number | null
  schoolType: SchoolType | null
  schoolName: string | null
  gender: Gender | null
  birthday: string | null
}

export interface ShopDTO {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  isChain: boolean
  hasWifi: boolean
  hasPower: boolean
  smokingStatus: SmokingStatus
  photos: string[]
  menuPhotos: string[]
  menuItems: string[]
  description: string | null
  totalSeats: number
  availableSeats: number
  congestionLevel: CongestionLevel
  congestionUpdatedAt: string | null
  distanceKm: number | null
  averageRating: number | null
  reviewCount: number
}

export interface ReservationDTO {
  id: string
  code: string
  type: ReservationType
  status: ReservationStatus
  reservedAt: string
  expiresAt: string | null
  cancelledAt: string | null
  partySize: number | null
  scheduledFor: string | null
  contactPhone: string | null
  contactEmail: string | null
  shop: {
    id: string
    name: string
    address: string
  }
}

export interface ShopReservationDTO {
  id: string
  code: string
  type: ReservationType
  status: ReservationStatus
  reservedAt: string
  expiresAt: string | null
  partySize: number | null
  scheduledFor: string | null
  user: {
    username: string
  }
}

export interface PostDTO {
  id: string
  photoUrl: string
  comment: string
  rating: number | null
  createdAt: string
  user: { id: string; username: string }
  shop: { id: string; name: string }
}

export const RESERVATION_HOLD_MINUTES = 15
