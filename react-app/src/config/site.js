const trimTrailingSlash = (value) => value.replace(/\/$/, '');

const siteUrl = trimTrailingSlash(import.meta.env.VITE_APP_URL || 'https://softhe.io');
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@softhe.io';
const legalName = import.meta.env.VITE_LEGAL_NAME || 'Softhe.io';

export const siteConfig = Object.freeze({
	name: import.meta.env.VITE_APP_NAME || 'Softhe.io',
	url: siteUrl,
	supportEmail,
	social: Object.freeze({
		twitter: import.meta.env.VITE_TWITTER_URL || 'https://x.com/SoftheCS',
		discord: import.meta.env.VITE_DISCORD_URL || 'https://discord.com/users/softhecs',
		github: import.meta.env.VITE_GITHUB_URL || 'https://github.com/Softhe',
		youtube: import.meta.env.VITE_YOUTUBE_URL || 'https://www.youtube.com/@softhe',
	}),
	legal: Object.freeze({
		name: legalName,
		address: import.meta.env.VITE_LEGAL_ADDRESS || '',
		registrationId: import.meta.env.VITE_BUSINESS_REGISTRATION_ID || '',
		jurisdiction: import.meta.env.VITE_LEGAL_JURISDICTION || '',
		vatStatus: import.meta.env.VITE_VAT_STATUS || '',
		vatId: import.meta.env.VITE_VAT_ID || '',
		responsiblePerson: import.meta.env.VITE_EDITORIAL_RESPONSIBLE_NAME || legalName,
		disputeAuthority: import.meta.env.VITE_DISPUTE_AUTHORITY || '',
		disputeAuthorityUrl: import.meta.env.VITE_DISPUTE_AUTHORITY_URL || '',
	}),
});

export const absoluteUrl = (path = '/') => new URL(path, `${siteConfig.url}/`).toString();
