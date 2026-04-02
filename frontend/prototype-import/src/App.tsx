import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Templates } from './pages/Templates';
import { Generate } from './pages/Generate';
import { Deployments } from './pages/Deployments';
import { Transcripts } from './pages/Transcripts';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Builder } from './pages/Builder';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/deployments" element={<Deployments />} />
        <Route path="/transcripts" element={<Transcripts />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />

        {/* Core Builder Route */}
        <Route path="/builder/:id" element={<Builder />} />
      </Routes>
    </BrowserRouter>);

}
