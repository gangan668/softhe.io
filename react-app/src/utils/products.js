export const STRIPE_PRODUCT_URLS = {
	'windows-10': 'https://buy.stripe.com/7sY5kwg8AdMfcxm5ST28800',
	'windows-11': 'https://buy.stripe.com/cNiaEQ9KcdMf2WMbdd28803',
	'bios-optimization': 'https://buy.stripe.com/bJe9AMe0sfUn8h62GH28804',
};

export const openExternalUrl = (url) => {
	const opened = window.open(url, '_blank', 'noopener,noreferrer');
	if (opened) {
		opened.opener = null;
	}
};
