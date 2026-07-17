import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import IncomePage from "./pages/IncomePage";
import ExpensePage from "./pages/ExpensePage";
import WalletPage from "./pages/WalletPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-grab-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-grab-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return currentUser && isAdmin ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <WalletProvider>
              <Layout>
                <Dashboard />
              </Layout>
            </WalletProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/income"
        element={
          <ProtectedRoute>
            <WalletProvider>
              <Layout>
                <IncomePage />
              </Layout>
            </WalletProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expense"
        element={
          <ProtectedRoute>
            <WalletProvider>
              <Layout>
                <ExpensePage />
              </Layout>
            </WalletProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallets"
        element={
          <ProtectedRoute>
            <WalletProvider>
              <Layout>
                <WalletPage />
              </Layout>
            </WalletProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <WalletProvider>
              <Layout>
                <ReportsPage />
              </Layout>
            </WalletProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <WalletProvider>
              <Layout>
                <AdminPage />
              </Layout>
            </WalletProvider>
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
