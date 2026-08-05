import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Modules from "./pages/Modules";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Leaderboard from "./pages/Leaderboard";
import Certificate from "./pages/Certificate";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import EmailPhishing from "./pages/modules/EmailPhishing";
import FakeLogin from "./pages/modules/FakeLogin";
import QRPhishing from "./pages/modules/QRPhishing";
import SMSPhishing from "./pages/modules/SMSPhishing";
import VoicePhishing from "./pages/modules/VoicePhishing";
import USBSecurity from "./pages/modules/USBSecurity";
import PasswordSecurity from "./pages/modules/PasswordSecurity";
import SocialEngineering from "./pages/modules/SocialEngineering";
import "./styles/theme.css";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function withTransition(node: React.ReactNode) {
  return <PageTransition>{node}</PageTransition>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={withTransition(<Landing />)} />
        <Route path="/login" element={withTransition(<Login />)} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {withTransition(<Dashboard />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              {withTransition(<Modules />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor"
          element={
            <ProtectedRoute roles={["instructor", "admin"]}>
              {withTransition(<InstructorDashboard />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              {withTransition(<AdminDashboard />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              {withTransition(<Leaderboard />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/certificate"
          element={
            <ProtectedRoute>
              {withTransition(<Certificate />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              {withTransition(<Reports />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/email-phishing"
          element={
            <ProtectedRoute>
              {withTransition(<EmailPhishing />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/fake-login"
          element={
            <ProtectedRoute>
              {withTransition(<FakeLogin />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/qr-phishing"
          element={
            <ProtectedRoute>
              {withTransition(<QRPhishing />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/sms-phishing"
          element={
            <ProtectedRoute>
              {withTransition(<SMSPhishing />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/voice-phishing"
          element={
            <ProtectedRoute>
              {withTransition(<VoicePhishing />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/usb-security"
          element={
            <ProtectedRoute>
              {withTransition(<USBSecurity />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/password-security"
          element={
            <ProtectedRoute>
              {withTransition(<PasswordSecurity />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules/social-engineering"
          element={
            <ProtectedRoute>
              {withTransition(<SocialEngineering />)}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={withTransition(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProgressProvider>
            <AppShell>
              <AnimatedRoutes />
            </AppShell>
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
