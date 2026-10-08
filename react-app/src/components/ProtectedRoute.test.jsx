import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
function mount(auth, staffOnly = false) { return render(<MemoryRouter initialEntries={['/protected']}><AuthContext.Provider value={{ configured: true, loading: false, ...auth }}><Routes><Route path="/protected" element={<ProtectedRoute staffOnly={staffOnly}><div>Private data</div></ProtectedRoute>} /><Route path="/login" element={<div>Login destination</div>} /><Route path="/account" element={<div>Account destination</div>} /></Routes></AuthContext.Provider></MemoryRouter>); }
describe('ProtectedRoute access boundaries', () => {
	it('redirects anonymous users without rendering private data', async () => { mount({ user: null }); await screen.findByText('Login destination'); expect(screen.queryByText('Private data')).not.toBeInTheDocument(); });
	it('denies checked nonstaff users access to operations', async () => { mount({ user: { id: 'customer' }, staffCheckedUserId: 'customer', staff: false }, true); await screen.findByText('Account destination'); expect(screen.queryByText('Private data')).not.toBeInTheDocument(); });
	it('waits for the current user staff check', () => { mount({ user: { id: 'new' }, staffCheckedUserId: 'old', staff: true }, true); expect(screen.getByText('Checking staff access…')).toBeInTheDocument(); expect(screen.queryByText('Private data')).not.toBeInTheDocument(); });
	it('allows verified staff and exposes recoverable initialization failure', () => { const view = mount({ user: { id: 'staff' }, staffCheckedUserId: 'staff', staff: true }, true); expect(screen.getByText('Private data')).toBeInTheDocument(); view.unmount(); mount({ error: 'Initialization failed', retry: vi.fn() }); expect(screen.getByRole('alert')).toHaveTextContent('Initialization failed'); expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument(); });
});
