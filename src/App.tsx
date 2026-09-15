import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/components/RequireAuth'
import { AuthedLayout } from '@/layouts/AuthedLayout'
import { LandingPage } from '@/pages/LandingPage'
import { SignupPage } from '@/pages/SignupPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfileOnboardingPage } from '@/pages/ProfileOnboardingPage'
import { SearchPage } from '@/pages/SearchPage'
import { PostPage } from '@/pages/PostPage'
import { CafeDetailPage } from '@/pages/CafeDetailPage'
import { MyReservationsPage } from '@/pages/MyReservationsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ShopLoginPage } from '@/pages/ShopLoginPage'
import { ShopDashboardPage } from '@/pages/ShopDashboardPage'

function Authed({ children }: { children: React.ReactElement }) {
  return (
    <RequireAuth>
      <AuthedLayout>{children}</AuthedLayout>
    </RequireAuth>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <ProfileOnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/search"
          element={
            <Authed>
              <SearchPage />
            </Authed>
          }
        />
        <Route
          path="/post"
          element={
            <Authed>
              <PostPage />
            </Authed>
          }
        />
        <Route
          path="/cafe/:id"
          element={
            <Authed>
              <CafeDetailPage />
            </Authed>
          }
        />
        <Route
          path="/reservations"
          element={
            <Authed>
              <MyReservationsPage />
            </Authed>
          }
        />
        <Route
          path="/profile"
          element={
            <Authed>
              <ProfilePage />
            </Authed>
          }
        />
        <Route path="/shop/login" element={<ShopLoginPage />} />
        <Route path="/shop/dashboard" element={<ShopDashboardPage />} />
      </Routes>
    </AuthProvider>
  )
}
