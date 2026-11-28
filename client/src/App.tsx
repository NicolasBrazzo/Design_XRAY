import { Link, Navigate, Route, Routes } from 'react-router-dom'
import SearchWebsite from './pages/SearchWebsite.tsx'
import Results from './pages/Results.tsx'

const REPO_URL = 'https://github.com/NicolasBrazzo/Design_XRAY'

function App() {
  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-5 sm:px-8">
      <header className="flex items-baseline justify-between py-6">
        <Link to="/" className="text-lg font-bold tracking-tight">
          Design XRAY
        </Link>
        <a href={REPO_URL} className="text-sm text-muted underline decoration-rule underline-offset-4 hover:text-ink">
          Source on GitHub
        </a>
      </header>

      <div className="flex-1 pb-24">
        <Routes>
          <Route path="/" element={<SearchWebsite />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
