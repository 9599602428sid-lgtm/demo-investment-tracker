'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('Demo@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="login-page">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">📈</div>
          <div>
            <div className="login-title">FAMILY INVESTMENT TRACKER</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="aseem@cbslgroup.in"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button id="login-btn" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)' }}>
          Admin access only
        </p>
      </div>
    </div>
  );
}
