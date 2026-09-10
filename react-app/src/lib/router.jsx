/* eslint-disable react-refresh/only-export-components -- Compatibility module intentionally exports router components and hooks together. */
import { forwardRef, useMemo } from 'react';
import {
	Link as WouterLink,
	Redirect,
	Route as WouterRoute,
	Router as WouterRouter,
	Switch,
	useLocation as useWouterLocation,
	useParams,
	useSearch,
} from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

export function BrowserRouter({ children }) {
	return <WouterRouter>{children}</WouterRouter>;
}

export const Router = BrowserRouter;

export function MemoryRouter({ children, initialEntries = ['/'] }) {
	const initialPath = initialEntries[0] || '/';
	const location = useMemo(() => memoryLocation({ path: initialPath, record: true }), [initialPath]);
	return <WouterRouter hook={location.hook}>{children}</WouterRouter>;
}

export function Routes({ children }) {
	return <Switch>{children}</Switch>;
}

export function Route({ path, element, children }) {
	const routePath = path === '*' ? undefined : path;
	return <WouterRoute path={routePath}>{element ?? children}</WouterRoute>;
}

export const Link = forwardRef(function Link({ to, ...props }, ref) {
	return <WouterLink ref={ref} href={to} {...props} />;
});

export const NavLink = forwardRef(function NavLink({ to, end = false, className, ...props }, ref) {
	const [pathname] = useWouterLocation();
	const active = pathname === to || (!end && to !== '/' && pathname.startsWith(`${to}/`));
	const resolvedClassName = typeof className === 'function' ? className({ isActive: active }) : className;
	return <WouterLink ref={ref} href={to} className={resolvedClassName} {...props} />;
});

export function Navigate({ to, replace = false, state }) {
	return <Redirect to={to} replace={replace} state={state} />;
}

export function useLocation() {
	const [pathname] = useWouterLocation();
	const search = useSearch();
	return {
		pathname,
		search: search ? `?${search}` : '',
		state: typeof window === 'undefined' ? null : window.history.state,
	};
}

export function useNavigate() {
	const [, navigate] = useWouterLocation();
	return navigate;
}

export function useSearchParams() {
	const search = useSearch();
	return useMemo(() => [new URLSearchParams(search)], [search]);
}

export { useParams };
