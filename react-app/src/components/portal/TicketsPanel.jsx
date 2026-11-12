import { formatDate } from './formatDate';

function TicketComposer({ ticket, onChange, onSubmit }) {
	return (
		<form className="portal-form ticket-composer" onSubmit={onSubmit}>
			<label>
				Subject
				<input
					value={ticket.subject}
					onChange={(e) => onChange({ ...ticket, subject: e.target.value })}
					minLength="3"
					maxLength="120"
					required
				/>
			</label>
			<label>
				Category
				<select value={ticket.category} onChange={(e) => onChange({ ...ticket, category: e.target.value })}>
					<option value="general">General</option>
					<option value="technical">Technical</option>
					<option value="sales">Sales</option>
					<option value="billing">Billing</option>
				</select>
			</label>
			<label>
				Message
				<textarea
					value={ticket.message}
					onChange={(e) => onChange({ ...ticket, message: e.target.value })}
					maxLength="4000"
					required
				/>
			</label>
			<button className="btn btn-primary">Create ticket</button>
		</form>
	);
}

function Conversation({ ticket, messages, userId, reply, onReplyChange, replySending, onSendReply }) {
	return (
		<div className="conversation">
			<h3>{ticket.subject}</h3>
			<div className="conversation-messages">
				{messages.map((message) => (
					<div className={message.author_id === userId ? 'message own' : 'message'} key={message.id}>
						<p>{message.body}</p>
						<small>{formatDate(message.created_at)}</small>
					</div>
				))}
			</div>
			{ticket.status !== 'closed' && (
				<form onSubmit={onSendReply}>
					<textarea
						value={reply}
						onChange={(e) => onReplyChange(e.target.value)}
						maxLength="4000"
						aria-label="Reply"
						disabled={replySending}
						required
					/>
					<button className="btn btn-primary" disabled={replySending}>
						{replySending ? 'Sending…' : 'Send reply'}
					</button>
				</form>
			)}
		</div>
	);
}

export default function TicketsPanel({
	tickets,
	selectedTicket,
	messages,
	userId,
	showComposer,
	onToggleComposer,
	newTicket,
	onNewTicketChange,
	onCreateTicket,
	onOpenTicket,
	reply,
	onReplyChange,
	replySending,
	onSendReply,
}) {
	return (
		<section className="portal-card tickets-card">
			<div className="tickets-heading">
				<div>
					<h2>Support history</h2>
					<p>Review your tickets and continue existing conversations.</p>
				</div>
				<button className={showComposer ? 'btn btn-secondary' : 'btn btn-primary'} onClick={onToggleComposer}>
					{showComposer ? 'Cancel' : 'New ticket'}
				</button>
			</div>
			{showComposer ? (
				<TicketComposer ticket={newTicket} onChange={onNewTicketChange} onSubmit={onCreateTicket} />
			) : (
				<div className="ticket-workspace">
					<div className="ticket-list" aria-label="Your tickets">
						{tickets.length ? tickets.map((ticket) => (
							<button
								key={ticket.id}
								onClick={() => onOpenTicket(ticket)}
								className={selectedTicket?.id === ticket.id ? 'active' : ''}
							>
								<strong>{ticket.subject}</strong>
								<span>{ticket.status.replaceAll('_', ' ')}</span>
							</button>
						)) : (
							<p className="ticket-empty">You have not created any support tickets yet.</p>
						)}
					</div>
					<div className="conversation-panel">
						{selectedTicket ? (
							<Conversation
								ticket={selectedTicket}
								messages={messages}
								userId={userId}
								reply={reply}
								onReplyChange={onReplyChange}
								replySending={replySending}
								onSendReply={onSendReply}
							/>
						) : (
							<div className="ticket-empty ticket-empty-detail">
								<strong>Select a ticket</strong>
								<p>Choose a conversation from the history to view its messages.</p>
							</div>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
