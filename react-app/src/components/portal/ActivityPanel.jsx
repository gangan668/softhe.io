import { formatDate } from './formatDate';

export default function ActivityPanel({ activity }) {
	return (
		<section className="portal-card">
			<h2>Activity history</h2>
			<div className="timeline">
				{activity.map((event) => (
					<article key={event.id}>
						<span></span>
						<div>
							<strong>{event.event_type.replaceAll('.', ' ')}</strong>
							<p>{formatDate(event.created_at)}</p>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
