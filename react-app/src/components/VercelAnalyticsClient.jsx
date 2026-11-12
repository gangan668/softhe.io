import { Analytics } from '@vercel/analytics/react';
import { beforeSendAnalytics } from '../utils/vercelAnalytics';

export default function VercelAnalyticsClient({ path }) {
	return <Analytics mode="production" debug={false} scriptSrc="/_vercel/insights/script.js" endpoint="/_vercel/insights" beforeSend={beforeSendAnalytics} route={path} path={path} />;
}
