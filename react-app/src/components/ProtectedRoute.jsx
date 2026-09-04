import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ children, staffOnly = false }) {
	const { configured, loading, user, staff, staffCheckedUserId } = useAuth();
	const location = useLocation();
	if (!configured) return <div className="portal-state" role="alert">Customer portal is not configured.</div>;
	if (loading) return <div className="portal-state" role="status">Loading your account…</div>;
	if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
	if (staffOnly && staffCheckedUserId !== user.id) return <div className="portal-state" role="status">Checking staff access…</div>;
	if (staffOnly && !staff) return <Navigate to="/account" replace />;
	return children;
}
