import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
	const value = useContext(AuthContext);
	return value || { configured: false, session: null, user: null, loading: false, staff: false, staffCheckedUserId: null, supabase: null };
};
