import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AuthCallback from './components/AuthCallback';
import { AuthProvider } from './contexts/AuthContext';
import { Auth } from './pages/Auth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />

            {/* OAuth Callback Routes */}
            <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route path="/auth/github/callback" element={<AuthCallback />} />
          </Routes>
        </div>
      </Router>      
    </AuthProvider>

  );
}

export default App;