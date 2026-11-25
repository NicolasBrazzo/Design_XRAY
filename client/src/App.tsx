import { Link, Navigate, Route, Routes } from 'react-router-dom'
import SearchWebsite from './pages/SearchWebsite.tsx'
import Results from './pages/Results.tsx'

function App() {
  return (
    <div className="mx-auto min-h-svh max-w-3xl px-6 pb-24">
      <header className="flex items-baseline justify-between py-6">
        <Link to="/" className="font-semibold tracking-tight text-ink">
          Design XRAY
        </Link>
      </header>

      <Routes>
        <Route path="/" element={<SearchWebsite />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
