export const PRODUCTS = [
	{
		id: 'windows-10',
		name: 'Custom Windows 10 ISO',
		price: 65,
		description: 'Our custom Windows Enterprise ISO is built for ultimate speed and no bloat. Experience gaming as it should be.',
		bestFor: 'Competitive FPS players who want maximum compatibility and low overhead.',
		features: ['Reduced preinstalled software', 'Gaming-focused configuration', 'Lower background overhead', 'Customer-supplied valid Windows licence required'],
		icon: 'fab fa-windows',
		badge: 'Best Seller',
	},
	{
		id: 'windows-11',
		name: 'Custom Windows 11 ISO',
		price: 75,
		description: 'Latest Windows 11 for next-gen gaming performance and DirectX 12 Ultimate support.',
		bestFor: 'Newer systems that need current Windows 11 gaming features.',
		features: ['DirectX 12 Ultimate support', 'Auto HDR support', 'Windowed gaming configuration', 'Customer-supplied valid Windows licence required'],
		icon: 'fab fa-windows',
		badge: null,
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
