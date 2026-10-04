export const PRODUCTS = [
	{
		id: 'windows-11',
		name: 'Custom Windows 11 ISO',
		price: 75,
		description: 'A streamlined Windows 11 build for current hardware, games, and drivers.',
		bestFor: 'Newer PCs that require Windows 11, TPM 2.0, or current gaming features.',
		features: ['DirectX 12 Ultimate support', 'Auto HDR support', 'Windowed gaming configuration', 'Customer-supplied valid Windows licence required'],
		icon: 'fab fa-windows',
		badge: 'For newer PCs',
	},
	{
		id: 'windows-10',
		name: 'Custom Windows 10 ISO',
		price: 65,
		description: 'A streamlined Windows 10 build for an existing setup that still requires the older operating system.',
		bestFor: 'PCs with a specific Windows 10 compatibility requirement and a supported Windows edition.',
		features: ['Reduced preinstalled software', 'Gaming-focused configuration', 'Lower background overhead', 'Customer-supplied valid Windows licence required'],
		icon: 'fab fa-windows',
		badge: 'Older-build option',
	},
	{
		id: 'bios-optimization',
		name: 'BIOS Optimization Service',
		price: 50,
		description: 'BIOS settings configured for your motherboard, CPU, memory, cooling, and stability requirements.',
		bestFor: 'PCs with unstable memory, uneven frame times, or firmware settings that have not been checked.',
		features: ['CPU and power settings', 'Memory settings', 'Stability checks', 'Saved recovery profile when supported'],
		icon: 'fas fa-microchip',
		badge: 'Hardware service',
	},
];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
