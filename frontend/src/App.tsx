import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';

const ChildApp     = lazy(() => import('./views/child/ChildApp'));
const ParentApp    = lazy(() => import('./views/parent/ParentApp'));
const Login        = lazy(() => import('./views/parent/Login'));
const Join         = lazy(() => import('./views/parent/Join'));
const SetupWizard  = lazy(() => import('./views/SetupWizard'));

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-blue-700">
      <div className="text-white text-2xl font-semibold">Ebbe</div>
    </div>
  );
}

export default function App() {
  // null = checking, true = configured, false = needs setup
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/v1/setup/status')
      .then((r) => r.json())
      .then((j: { data: { configured: boolean } }) => setConfigured(j.data.configured))
      .catch(() => setConfigured(true)); // assume configured on network error (prevents lock-out)
  }, []);

  if (configured === null) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {!configured ? (
            // Not configured — redirect everything to the setup wizard
            <>
              <Route path="/setup" element={<SetupWizard />} />
              <Route path="*"      element={<Navigate to="/setup" replace />} />
            </>
          ) : (
            // Normal app routes
            <>
              {/* Child kiosk view — token auth via query param */}
              <Route path="/child" element={<ChildApp />} />

              {/* Parent admin panel */}
              <Route path="/parent/login" element={<Login />} />
              <Route path="/parent/join"  element={<Join />} />
              <Route path="/parent/*"     element={<ParentApp />} />

              {/* Setup wizard redirect once configured */}
              <Route path="/setup" element={<Navigate to="/parent" replace />} />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/child" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
