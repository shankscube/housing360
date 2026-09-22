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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-xl"
      >
        <h1 className="text-xl font-semibold text-neutral-900">Sign in to Housing360</h1>
        <label className="mt-lg block text-sm font-medium text-neutral-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-xs w-full rounded-md border border-neutral-300 px-md py-xs text-sm"
          />
        </label>
        <label className="mt-md block text-sm font-medium text-neutral-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-xs w-full rounded-md border border-neutral-300 px-md py-xs text-sm"
          />
        </label>
        {error ? <p className="mt-md text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-lg w-full rounded-md bg-primary-600 px-md py-sm text-sm font-medium text-white disabled:opacity-60"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
