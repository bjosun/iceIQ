// TODO: implement main entry
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isNativeApp } from './utils/platform'

// I appen ska sidan aldrig kunna zoomas (vare sig av ett fält som får fokus
// eller av en nypning): då hamnar den lätt förstorad och blir kvar så.
if (isNativeApp) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)