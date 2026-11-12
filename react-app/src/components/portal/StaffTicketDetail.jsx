export default function StaffTicketDetail({ ticket, messages, userId, reply, onReplyChange, replySending, onSend, onStatusChange }) {
	return (
		<section className="portal-card">
			{ticket ? (
				<>
					<div className="ticket-toolbar">
						<h2>{ticket.subject}</h2>
						<select aria-label="Ticket status" value={ticket.status} onChange={(e) => onStatusChange(e.target.value)}>
							<option value="open">Open</option>
							<option value="in_progress">In progress</option>
							<option value="waiting_for_customer">Waiting for customer</option>
							<option value="closed">Closed</option>
						</select>
					</div>
					<div className="conversation">
						{messages.map((message) => (
							<div className={message.author_id === userId ? 'message own' : 'message'} key={message.id}>
								<p>{message.body}</p>
							</div>
						))}
						<form onSubmit={onSend}>
							<textarea
								value={reply}
								onChange={(e) => onReplyChange(e.target.value)}
								maxLength="4000"
								disabled={replySending}
								required
							/>
							<button className="btn btn-primary" disabled={replySending}>
								{replySending ? 'Sending…' : 'Reply as staff'}
							</button>
						</form>
					</div>
				</>
			) : (
				<p>Select a ticket to review its conversation.</p>
			)}
		</section>
	);
}
