import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Inter (weight axis 100-900, font-display: swap). The CSS ships
// per-script unicode-range subsets, so browsers only fetch the latin file here.
import '@fontsource-variable/inter/wght.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
