import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import RemoteLoader from './components/RemoteLoader'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold text-gray-900">Homecare Shell</h1>
            <nav className="mt-4 space-x-4">
              <Link to="/" className="text-blue-600">Home</Link>
              <Link to="/auth" className="text-blue-600">Auth</Link>
              <Link to="/booking" className="text-blue-600">Booking</Link>
              <Link to="/services" className="text-blue-600">Services</Link>
              <Link to="/profile" className="text-blue-600">Profile</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/*" element={<RemoteLoader remote="auth/Routes" />} />
            <Route path="/booking/*" element={<RemoteLoader remote="booking/Routes" />} />
            <Route path="/services/*" element={<RemoteLoader remote="services/Routes" />} />
            <Route path="/profile/*" element={<RemoteLoader remote="profile/Routes" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
