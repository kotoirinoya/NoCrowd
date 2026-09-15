import type { ReactNode } from 'react'
import { BottomTabBar } from '@/components/BottomTabBar'

export function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="authed-layout">
      <div className="authed-layout__content">{children}</div>
      <BottomTabBar />
    </div>
  )
}
