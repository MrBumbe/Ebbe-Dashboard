import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
const ChildApp  = lazy(() => import('./views/child/ChildApp'));
const ParentApp = lazy(() => import('./views/parent/ParentApp'));
const Login     = lazy(() => import('./views/parent/Login'));

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-blue-700">
      <div className="text-white text-2xl font-semibold">Ebbe</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Child kiosk view — token auth via query param */}
          <Route path="/child" element={<ChildApp />} />

          {/* Parent admin panel */}
          <Route path="/parent/login" element={<Login />} />
          <Route path="/parent/*"     element={<ParentApp />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/child" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
