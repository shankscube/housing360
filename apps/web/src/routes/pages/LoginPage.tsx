import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, status, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (currentUser) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surfaceApp px-7">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-formCardWidth rounded-2xl bg-surface px-14 py-18 shadow-card"
      >
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Sign in to Housing360
        </h1>
        <p className="mt-2.5 text-sm text-textMuted">Case Manager Portal</p>
        <label className="mt-9 block text-xs font-semibold uppercase tracking-wide text-textMuted">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-3 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink"
          />
        </label>
        <label className="mt-7 block text-xs font-semibold uppercase tracking-wide text-textMuted">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-3 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink"
          />
        </label>
        {error ? <p className="mt-7 text-sm font-medium text-coralDeep">{error}</p> : null}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-9 w-full rounded-md bg-ink px-9 py-4.5 text-base font-semibold text-surface transition-colors hover:bg-inkHover disabled:opacity-60"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
