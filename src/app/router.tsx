import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import HomeRoute from '@/routes/home'
import LandingRoute from '@/routes/landing'
import NotFoundRoute from '@/routes/not-found'
import { RedirectIfSignedIn, RequireSignedIn } from './guards'
import { AppLayout } from './layout'
import { SignedInLayout } from './signed-in-layout'

// Route-split: screens that aren't on the first-visit path load on demand. Sign-up and verify carry the
// form libraries (react-hook-form, zod), so they stay out of the first load too.
const SignupRoute = lazy(() => import('@/routes/signup'))
const VerifyRoute = lazy(() => import('@/routes/verify'))
// The day screen carries the Markdown renderer.
const DayRoute = lazy(() => import('@/routes/day'))
const JourneyRoute = lazy(() => import('@/routes/journey'))
const PodRoute = lazy(() => import('@/routes/pod'))
const SettingsRoute = lazy(() => import('@/routes/settings'))
const ModRoute = lazy(() => import('@/routes/mod'))
const PreviewRoute = lazy(() => import('@/routes/preview'))
const PrivacyRoute = lazy(() => import('@/routes/privacy'))
// DiceBear and the builder load only here and on screens that show avatars.
const AvatarRoute = lazy(() => import('@/routes/avatar'))
const QuestionsRoute = lazy(() => import('@/routes/questions'))
const UnsubscribeRoute = lazy(() => import('@/routes/unsubscribe'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route element={<RedirectIfSignedIn />}>
          <Route index element={<LandingRoute />} />
          <Route path="signup" element={<SignupRoute />} />
          <Route path="verify" element={<VerifyRoute />} />
        </Route>
        <Route element={<RequireSignedIn />}>
          <Route element={<SignedInLayout />}>
            <Route path="home" element={<HomeRoute />} />
            <Route path="journey" element={<JourneyRoute />} />
            <Route path="pod" element={<PodRoute />} />
            <Route path="settings" element={<SettingsRoute />} />
          </Route>
          <Route path="day/:n" element={<DayRoute />} />
          <Route path="avatar" element={<AvatarRoute />} />
          <Route path="questions" element={<QuestionsRoute />} />
          <Route path="mod" element={<ModRoute />} />
          <Route path="preview/:n" element={<PreviewRoute />} />
        </Route>
        {/* Open to everyone, signed in or not */}
        <Route path="privacy" element={<PrivacyRoute />} />
        <Route path="unsubscribe" element={<UnsubscribeRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  )
}
