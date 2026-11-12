export default function TicketQueue({ tickets, selectedId, onOpen }) {
	return (
		<section className="portal-card">
			<h2>Ticket queue</h2>
			<div className="ticket-list">
				{tickets.map((ticket) => (
					<button key={ticket.id} onClick={() => onOpen(ticket)} className={selectedId === ticket.id ? 'active' : ''}>
						<strong>{ticket.subject}</strong>
						<span>{ticket.owner?.email || 'Customer'} · {ticket.status.replaceAll('_', ' ')}</span>
					</button>
				))}
			</div>
		</section>
	);
}
