import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import DayRoute from '@/routes/day'
import HomeRoute from '@/routes/home'
import LandingRoute from '@/routes/landing'
import NotFoundRoute from '@/routes/not-found'
import SignupRoute from '@/routes/signup'
import VerifyRoute from '@/routes/verify'
import { AppLayout } from './layout'

// Route-split: screens that aren't on the first-visit path load on demand.
const JourneyRoute = lazy(() => import('@/routes/journey'))
const PodRoute = lazy(() => import('@/routes/pod'))
const SettingsRoute = lazy(() => import('@/routes/settings'))
const ModRoute = lazy(() => import('@/routes/mod'))
const PreviewRoute = lazy(() => import('@/routes/preview'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingRoute />} />
        <Route path="signup" element={<SignupRoute />} />
        <Route path="verify" element={<VerifyRoute />} />
        <Route path="home" element={<HomeRoute />} />
        <Route path="day/:n" element={<DayRoute />} />
        <Route path="journey" element={<JourneyRoute />} />
        <Route path="pod" element={<PodRoute />} />
        <Route path="settings" element={<SettingsRoute />} />
        <Route path="mod" element={<ModRoute />} />
        <Route path="preview/:n" element={<PreviewRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  )
}
