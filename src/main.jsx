import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NotesApp from './NotesApp.jsx'

// Simple hash router: #notes → NotesApp, default → spatial App
const page = window.location.hash === '#notes' ? 'notes' : 'spatial'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {page === 'notes' ? <NotesApp /> : <App />}
  </StrictMode>,
)
