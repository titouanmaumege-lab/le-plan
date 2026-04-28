import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AuthGate from './AuthGate.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      {({ session, signOut }) => <App session={session} signOut={signOut} />}
    </AuthGate>
  </StrictMode>,
)
