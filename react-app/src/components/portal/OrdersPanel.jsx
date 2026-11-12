import { formatDate } from './formatDate';

const formatAmount = (order) => new Intl.NumberFormat(undefined, {
	style: 'currency',
	currency: order.currency.toUpperCase(),
}).format(order.amount_total / 100);

export default function OrdersPanel({ orders }) {
	return (
		<section className="portal-card">
			<h2>Orders</h2>
			{!orders.length ? (
				<p>No linked orders yet. Guest purchases are claimed after your verified email matches the Stripe receipt.</p>
			) : (
				<div className="portal-list">
					{orders.map((order) => (
						<article key={order.id}>
							<div>
								<strong>Order {order.stripe_session_id.slice(-10)}</strong>
								<p>{formatDate(order.created_at)} · {order.status}</p>
								<small>{order.order_items?.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</small>
							</div>
							<strong>{formatAmount(order)}</strong>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
