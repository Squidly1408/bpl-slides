import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import UpdatePwaToast from './components/UpdatePwaToast'
import Dashboard from './pages/Dashboard'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

// Editor/Present/Upload/Draw pull in heavy client-side libraries (three.js,
// pptxgenjs, mammoth, pdfjs, jszip) — code-split them so the dashboard's
// first load stays light.
const UploadWork = lazy(() => import('./pages/UploadWork'))
const Editor = lazy(() => import('./pages/Editor'))
const Present = lazy(() => import('./pages/Present'))
const Draw = lazy(() => import('./pages/Draw'))

function PageFallback() {
  return <div className="p-8 text-sm">Loading…</div>
}

export default function App() {
  return (
    <>
      <UpdatePwaToast />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/project/:id/present" element={<Present />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id/upload" element={<UploadWork />} />
            <Route path="/project/:id/edit" element={<Editor />} />
            <Route path="/draw" element={<Draw />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
