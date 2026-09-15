import L from 'leaflet'

// ViteのバンドルではLeaflet標準のPNGピンが正しく解決されないことがあるため、
// 画像ファイルに依存しないSVG(divIcon)で自前のピンを描画する
export const shopMarkerIcon = L.divIcon({
  className: 'nocrowd-marker',
  html: `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="#8B7AE0" stroke="#fff" stroke-width="1.5" />
      <circle cx="16" cy="16" r="7" fill="#FFD6E8" />
    </svg>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
})
