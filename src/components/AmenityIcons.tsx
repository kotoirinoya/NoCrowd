import type { ShopDTO } from '@shared/types'

const SMOKING_LABELS: Record<ShopDTO['smokingStatus'], string> = {
  NON_SMOKING: '禁煙',
  SMOKING: '喫煙可',
  SEPARATED: '分煙',
}

export function AmenityIcons({ shop }: { shop: ShopDTO }) {
  const items = [
    shop.hasWifi ? 'Wi-Fi あり' : 'Wi-Fi なし',
    shop.hasPower ? '電源あり' : '電源なし',
    SMOKING_LABELS[shop.smokingStatus],
    shop.isChain ? 'チェーン店' : '個人店',
  ]
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: '8px 0' }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#f1f5f9',
            color: '#334155',
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}
