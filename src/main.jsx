import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppProvider from './components/AppProvider'
import { ToastProvider } from './components/ui'
import SyncProvider from './components/SyncProvider'
import AuthProvider from './components/AuthProvider'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'

// Service worker: app shell dan tile yang pernah dilihat tersedia offline
registerSW({ immediate: true, onOfflineReady: () => window.dispatchEvent(new Event('pwa-offline-siap')) })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider><AuthProvider><ToastProvider><SyncProvider><App /></SyncProvider></ToastProvider></AuthProvider></AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
