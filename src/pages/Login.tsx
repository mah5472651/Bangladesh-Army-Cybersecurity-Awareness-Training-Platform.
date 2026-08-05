import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, Eye, EyeOff, Info, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DEMO_ACCOUNTS } from "../data/demoAccounts";
import GlassCard from "../components/GlassCard";
import LoadingScreen from "../components/LoadingScreen";
import ArmyLogo from "../components/ArmyLogo";
import "./Login.css";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Capture then clear password from state ASAP for safety
    const pw = password;
    setPassword("");

    try {
      const result = await login(username, pw);
      if (result.ok) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="login-page">
      <div className="container login-grid">
        <div className="login-intro">
          <div className="section-eyebrow">
            <Lock size={14} /> Secure Training Access
          </div>
          <h1>Training Portal Login</h1>
          <p>
            Sign in with an assigned <strong>training account only</strong>. External email
            providers and real credentials are rejected. This system is for authorized
            Bangladesh Army cybersecurity awareness training.
          </p>

          <div className="alert alert-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Credential Safety Policy</strong>
              <br />
              Never enter real passwords. Demo passwords are training-only. Any
              credential-like input on simulation pages is discarded immediately and replaced
              with ********.
            </div>
          </div>

          <ul className="login-policy">
            <li>No Gmail, Yahoo, Outlook, or other external providers</li>
            <li>No production or personal account passwords</li>
            <li>Session stores identity only — never passwords</li>
            <li>All modules use safe, offline simulations</li>
          </ul>
        </div>

        <GlassCard strong className="login-card">
          <div className="login-card-header">
            <div className="login-emblem" style={{ background: "transparent", boxShadow: "none" }}>
              <ArmyLogo size={56} />
            </div>
            <h2>Training Authentication</h2>
            <p>Demo accounts only · Bangladesh Army</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Training Username
              </label>
              <input
                id="username"
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. trainee001"
                autoComplete="username"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Demo Password
              </label>
              <div className="pw-wrap">
                <input
                  id="password"
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Demo password only"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Authenticating…
                </>
              ) : (
                <>
                  <Shield size={16} /> Sign In to Training
                </>
              )}
            </button>
          </form>

          <div className="demo-accounts">
            <div className="demo-accounts-title">
              <Info size={14} /> Quick-fill demo accounts
            </div>
            <div className="demo-list">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  type="button"
                  className="demo-chip"
                  onClick={() => fillDemo(a.username, a.password)}
                  disabled={submitting}
                >
                  <strong>{a.username}</strong>
                  <span>
                    {a.rank} · {a.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="login-footer-link">
            <Link to="/">← Back to Home</Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
