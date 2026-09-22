import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrentUser } from '../store/slices/authSlice';

/**
 * Blocks screen routes until the session check resolves, then redirects to
 * `/login` when unauthenticated. Wraps every screen route, real or stub.
 */
export function RouteGuard() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { currentUser, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, initialized]);

  if (!initialized) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
