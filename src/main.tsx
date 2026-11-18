import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initI18n } from './i18n'

const root = createRoot(document.getElementById('root')!)

void initI18n().then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
