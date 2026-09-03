import { Route, Routes } from 'react-router-dom'
import { CreditsPage } from './pages/CreditsPage'
import { SchedulePage } from './pages/SchedulePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SchedulePage />} />
      <Route path="/credits" element={<CreditsPage />} />
      <Route path="*" element={<SchedulePage />} />
    </Routes>
  )
}
