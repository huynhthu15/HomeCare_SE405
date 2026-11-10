import React from 'react'
import { createRoot } from 'react-dom/client'
import RootShell from './portal/RootShell'
import './portal/index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootShell />
  </React.StrictMode>,
)
