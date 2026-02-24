import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import { ToastProvider } from './components/ui';
import { ErrorBoundary } from './components/ui';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Overview } from './pages/Overview';
import { EventDetail } from './pages/EventDetail';
import { CreateEvent } from './pages/CreateEvent';
import { EditEvent } from './pages/EditEvent';
import { RsvpPage } from './pages/RsvpPage';
import { Login } from './pages/Login';
import { PublicEvent } from './pages/PublicEvent';
import { AdminDashboard } from './pages/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

/** Route guard — redirects to /login if not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/** Route guard — requires admin role */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

/** Redirect logged-in users away from login page */
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BrowserRouter basename="/stage">
              <Routes>
                {/* Public routes */}
                <Route path="/rsvp/:token" element={<RsvpPage />} />
                <Route path="/e/:slug" element={<PublicEvent />} />
                <Route
                  path="/login"
                  element={
                    <GuestOnly>
                      <Login />
                    </GuestOnly>
                  }
                />

                {/* Protected routes */}
                <Route
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route path="/" element={<Overview />} />
                  <Route path="/events/new" element={<CreateEvent />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/events/:id/edit" element={<EditEvent />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminDashboard />
                      </RequireAdmin>
                    }
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
