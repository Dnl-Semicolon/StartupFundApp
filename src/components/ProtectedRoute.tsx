import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { ROUTE_PATHS } from '@/lib/index';

interface Props {
  children: React.ReactNode;
  requireEntrepreneur?: boolean;
}

/**
 * Route guard that checks on-chain registration state (via useUserRole).
 * - Not registered → redirects to /register
 * - Registered but not entrepreneur (when requireEntrepreneur=true) → redirects to /become-entrepreneur
 */
export function ProtectedRoute({ children, requireEntrepreneur = false }: Props) {
  const { isRegistered, isEntrepreneur, isLoading } = useUserRole();

  // Wait for localStorage/chain sync before deciding — prevents flash redirect
  if (isLoading) return null;

  if (!isRegistered) {
    return <Navigate to={ROUTE_PATHS.REGISTER} replace />;
  }

  if (requireEntrepreneur && !isEntrepreneur) {
    return <Navigate to={ROUTE_PATHS.ENTREPRENEUR} replace />;
  }

  return <>{children}</>;
}
