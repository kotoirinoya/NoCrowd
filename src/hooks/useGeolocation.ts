import { useEffect, useState } from 'react'

interface GeolocationState {
  coords: { lat: number; lng: number } | null
  error: string | null
  loading: boolean
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, error: '位置情報がサポートされていません。', loading: false })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          error: null,
          loading: false,
        })
      },
      () => {
        setState({
          coords: null,
          error: '位置情報を取得できませんでした。近い順の表示はできません。',
          loading: false,
        })
      },
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }, [])

  return state
}
