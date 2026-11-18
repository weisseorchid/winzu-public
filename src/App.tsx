import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell/AppShell'
import { HomePage } from './pages/HomePage'
import { PaperPage } from './pages/PaperPage'
import { PapersPage } from './pages/PapersPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="papers" element={<PapersPage />} />
          <Route path="papers/:slug" element={<PaperPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
