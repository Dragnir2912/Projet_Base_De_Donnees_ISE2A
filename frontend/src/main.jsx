import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: '"Poppins", system-ui, sans-serif',
            fontSize: '14px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--border-subtle)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)

