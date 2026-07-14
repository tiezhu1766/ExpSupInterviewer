import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { Home } from './pages/Home'
import { Prepare } from './pages/Prepare'
import { Interview } from './pages/Interview'
import { Report } from './pages/Report'
import { Replay } from './pages/Replay'
import { Settings } from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/prepare" element={<Prepare />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/report" element={<Report />} />
          <Route path="/replay" element={<Replay />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
