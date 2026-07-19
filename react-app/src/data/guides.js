export const guides = [
	{
		title: 'CS2 Optimization Checklist',
		slug: 'cs2-optimization-checklist',
		description: 'A repeatable checklist for reducing overhead, checking launch settings, keeping drivers clean, and validating Counter-Strike 2 performance changes.',
		readingTime: '7 min read',
		points: ['Validate a baseline first', 'Change one variable at a time', 'Compare frame pacing, not only average FPS'],
		sections: [
			{
				heading: 'Capture a baseline you can reproduce',
				paragraphs: [
					'Use the same map, workshop benchmark, graphics settings, resolution, and warm-up period for every run. Record average FPS, 1% lows, frame time, temperatures, clock behavior, and the applications running in the background.',
					'A single high FPS number is not enough. Run the same scenario several times and keep the median result so a lucky run does not become the baseline.',
				],
			},
			{
				heading: 'Remove avoidable background variability',
				paragraphs: [
					'Update the GPU driver deliberately, close overlays you do not use, review startup applications, and pause unrelated downloads or scans during testing. Keep required security controls enabled and document anything you disable temporarily.',
					'Do not paste large collections of registry edits or launch options into a competitive PC. Apply one understood change, retest, and keep a rollback path.',
				],
			},
			{
				heading: 'Check the complete latency path',
				paragraphs: [
					'Confirm the display refresh rate, in-game frame limiter, NVIDIA Reflex or equivalent latency settings, fullscreen mode, mouse polling stability, and power behavior. A higher average FPS can still feel worse if frame-time spikes increase.',
					'Keep only improvements that repeat across runs without crashes, thermal throttling, corrupted files, or reduced system security.',
				],
			},
		],
	},
	{
		title: 'Windows 10 vs Windows 11 for Gaming',
		slug: 'windows-10-vs-11-gaming',
		description: 'How to choose an operating system when hardware support, security, competitive performance, and feature compatibility all matter.',
		readingTime: '6 min read',
		points: ['Match the OS to supported hardware', 'Prioritize current security and driver support', 'Prepare a tested rollback before migrating'],
		sections: [
			{
				heading: 'Start with support, not benchmark folklore',
				paragraphs: [
					'Operating-system choice should begin with CPU, motherboard, driver, anti-cheat, and game support. A small benchmark difference does not outweigh missing security updates or unstable drivers.',
					'Windows 11 is usually the practical baseline for newer hardware and current platform features. A Windows 10 setup should only be considered when its edition, support lifecycle, hardware, and software requirements are clearly understood.',
				],
			},
			{
				heading: 'Compare on the same machine',
				paragraphs: [
					'Use matching game builds, drivers, firmware, graphics settings, power configuration, and background software. Compare frame-time distributions and 1% lows alongside average FPS.',
					'Allow time for driver compilation, indexing, and updates to settle before treating a fresh installation as representative.',
				],
			},
			{
				heading: 'Plan migration and recovery',
				paragraphs: [
					'Back up personal data and recovery keys, export critical settings, verify installation media, and document licensing before changing operating systems. Test peripherals and required work applications as well as games.',
					'The best gaming OS is the supported configuration that remains stable, secure, recoverable, and fast on the hardware you actually use.',
				],
			},
		],
	},
	{
		title: 'BIOS Optimization for Stable FPS',
		slug: 'bios-optimization-stable-fps',
		description: 'A safety-first guide to BIOS baselines, memory tuning, thermals, stability testing, and consistent frame pacing.',
		readingTime: '8 min read',
		points: ['Record a known-good baseline', 'Tune memory and power conservatively', 'Stress test before trusting gaming results'],
		sections: [
			{
				heading: 'Preserve a recoverable baseline',
				paragraphs: [
					'Record the motherboard model, firmware version, current settings, memory kit, CPU, and cooling configuration. Save a known-good profile when the firmware supports it and know how to clear CMOS before experimenting.',
					'Firmware updates and voltage changes carry real risk. Follow the motherboard vendor instructions and do not interrupt a firmware update.',
				],
			},
			{
				heading: 'Stability is part of performance',
				paragraphs: [
					'Memory profiles, boost behavior, fan control, and power limits can affect frame pacing, but aggressive values may introduce silent calculation errors or intermittent crashes. Start with vendor-rated settings and move in small documented steps.',
					'Monitor temperature, voltage, effective clocks, corrected hardware errors, and throttling. A benchmark score gained by operating outside safe limits is not a production-ready result.',
				],
			},
			{
				heading: 'Validate beyond one game',
				paragraphs: [
					'Use appropriate CPU, memory, and combined-load stability tests, followed by the games and applications you rely on. Test cold boots, sleep or restart behavior, and several longer sessions.',
					'If the system becomes inconsistent, return to the documented baseline instead of layering more changes onto an unstable configuration.',
				],
			},
		],
	},
	{
		title: 'Gaming PC Latency Basics',
		slug: 'gaming-pc-latency-basics',
		description: 'A plain-English guide to frame time, input latency, display latency, network delay, and repeatable measurement.',
		readingTime: '6 min read',
		points: ['Separate FPS from end-to-end latency', 'Watch frame-time spikes', 'Measure changes with repeatable tests'],
		sections: [
			{
				heading: 'Latency is a chain',
				paragraphs: [
					'Input latency includes the device, USB processing, game simulation, CPU and GPU render queues, frame presentation, display scanout, and pixel response. Network latency is a separate path that affects server communication rather than local click-to-photon time.',
					'Average FPS describes throughput. Frame time and its consistency show how evenly frames arrive, which is why two systems with similar averages can feel different.',
				],
			},
			{
				heading: 'Fix obvious configuration issues first',
				paragraphs: [
					'Confirm the monitor uses its intended refresh rate, the game is using the correct GPU and display mode, temperatures are controlled, and unnecessary overlays are not adding instability. Use vendor-supported low-latency features when the game and hardware support them.',
					'A frame cap can improve consistency in some configurations. Test it against uncapped behavior rather than assuming one rule works everywhere.',
				],
			},
			{
				heading: 'Measure before buying hardware',
				paragraphs: [
					'Use repeatable in-game captures or reputable latency tools, keep settings constant, and compare several runs. Record what changed and reverse it when the result is neutral or worse.',
					'Optimization should reduce known bottlenecks without trading away stability, recoverability, or security for an unrepeatable result.',
				],
			},
		],
	},
];

export const findGuide = (slug) => guides.find((guide) => guide.slug === slug);
