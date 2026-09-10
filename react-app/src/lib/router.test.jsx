import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import {
	BrowserRouter,
	Link,
	MemoryRouter,
	Navigate,
	NavLink,
	Route,
	Routes,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from './router';

function RoutedFixture() {
	const params = useParams();
	const [search] = useSearchParams();
	return <div>{params.slug}:{search.get('checkout')}</div>;
}

it('matches parameters and search parameters in memory routing', () => {
	render(<MemoryRouter initialEntries={['/guides/demo?checkout=success']}><Routes>
		<Route path="/guides/:slug" element={<RoutedFixture />} />
		<Route path="*" element={<div>Missing</div>} />
	</Routes></MemoryRouter>);
	expect(screen.getByText('demo:success')).toBeInTheDocument();
});

it('navigates links and computes active navigation classes', async () => {
	const user = userEvent.setup();
	render(<MemoryRouter initialEntries={['/']}><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
		<Link to="/next">Next</Link><Routes><Route path="/" element={<div>Index</div>} /><Route path="/next" element={<div>Next page</div>} /></Routes>
	</MemoryRouter>);
	expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active');
	await user.click(screen.getByRole('link', { name: 'Next' }));
	expect(screen.getByText('Next page')).toBeInTheDocument();
});

it('uses the fallback route for unknown locations', () => {
	render(<MemoryRouter initialEntries={['/unknown']}><Routes>
		<Route path="/" element={<div>Index</div>} />
		<Route path="*" element={<div>Not found</div>} />
	</Routes></MemoryRouter>);
	expect(screen.getByText('Not found')).toBeInTheDocument();
});

function StateDestination() {
	const location = useLocation();
	return <div>{location.state?.from || 'missing state'}</div>;
}

function StateNavigation() {
	const navigate = useNavigate();
	return <button onClick={() => navigate('/destination', { state: { from: '/account' } })}>Navigate</button>;
}

it('preserves browser navigation state', async () => {
	window.history.replaceState(null, '', '/');
	const user = userEvent.setup();
	render(<BrowserRouter><StateNavigation /><Routes>
		<Route path="/" element={<div>Index</div>} />
		<Route path="/destination" element={<StateDestination />} />
	</Routes></BrowserRouter>);
	await user.click(screen.getByRole('button', { name: 'Navigate' }));
	expect(screen.getByText('/account')).toBeInTheDocument();
});

it('supports replace redirects', () => {
	render(<MemoryRouter initialEntries={['/old']}><Routes>
		<Route path="/old" element={<Navigate to="/new" replace />} />
		<Route path="/new" element={<div>Redirected</div>} />
	</Routes></MemoryRouter>);
	expect(screen.getByText('Redirected')).toBeInTheDocument();
});
