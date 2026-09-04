export const PRODUCTS = [
	{
		id: 'windows-11',
		name: 'Custom Windows 11 ISO',
		price: 75,
		description: 'Latest Windows 11 for next-gen gaming performance and DirectX 12 Ultimate support.',
		bestFor: 'Newer systems that need current Windows 11 gaming features.',
		features: ['DirectX 12 Ultimate support', 'Auto HDR support', 'Windowed gaming configuration', 'Customer-supplied valid Windows licence required'],
		icon: 'fab fa-windows',
		badge: 'Best Seller',
	},
	{
		id: 'windows-10',
		name: 'Custom Windows 10 ISO',
		price: 65,
		description: 'A lean older-build option for customers who specifically prefer Windows 10 or need it for compatibility with an existing setup.',
		bestFor: 'Customers who intentionally want an older Windows build for familiar behavior or specific compatibility needs.',
		features: ['Reduced preinstalled software', 'Gaming-focused configuration', 'Lower background overhead', 'Customer-supplied valid Windows licence required'],
		icon: 'fab fa-windows',
		badge: 'Older-build option',
	},
	{
		id: 'bios-optimization',
		name: 'BIOS Optimization Service',
		price: 50,
		description: "Professional BIOS tuning service to unlock your hardware's maximum potential with expert configurations.",
		bestFor: 'Systems with strong hardware that still show stutter, inconsistent lows, or untuned memory.',
		features: ['CPU tuning', 'GPU tuning', 'Stability testing', 'Custom profiles'],
		icon: 'fas fa-microchip',
		badge: 'Popular',
	},
];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
