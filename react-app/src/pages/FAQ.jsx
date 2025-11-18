import { useState } from "react";
import SEO from "../components/SEO";
import "./FAQ.css";

function FAQ() {
	const [activeCategory, setActiveCategory] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [activeItems, setActiveItems] = useState([]);

	const faqData = {
		general: [
			{
				question: "What is Softhe.io and what do you offer?",
				answer:
					"Softhe.io is a premium PC optimization service specializing in maximizing gaming performance for esports professionals and enthusiasts. We offer custom-built Windows ISOs with all bloatware removed, expert BIOS optimization services, and comprehensive performance tuning packages. Our solutions are designed to squeeze every bit of performance from your hardware, resulting in higher FPS, lower latency, and smoother gameplay.",
			},
			{
				question: "What exactly is included in the custom Windows ISO?",
				answer: (
					<div>
						<p>Our custom Windows ISO includes:</p>
						<ul>
							<li>
								<strong>Bloatware Removal:</strong> All unnecessary Windows apps
								and services removed
							</li>
							<li>
								<strong>Registry Optimizations:</strong> Gaming-focused tweaks
								for maximum performance
							</li>
							<li>
								<strong>Service Optimization:</strong> Only essential services
								enabled, reducing CPU and RAM usage
							</li>
							<li>
								<strong>Privacy Settings:</strong> Pre-configured for maximum
								privacy and minimal telemetry
							</li>
							<li>
								<strong>Automation Scripts:</strong> 200+ scripts for Windows
								Updates, driver updates, and per-game optimizations
							</li>
							<li>
								<strong>Performance Profiles:</strong> Pre-configured power
								plans and GPU settings
							</li>
							<li>
								<strong>Lifetime Updates:</strong> Free updates to the ISO as we
								continue to improve it
							</li>
							<li>
								<strong>Documentation:</strong> Detailed installation guides and
								optimization explanations
							</li>
						</ul>
					</div>
				),
			},
			{
				question: "Is the Windows ISO legal and safe to use?",
				answer: (
					<div>
						<p>
							<strong>Yes, absolutely.</strong> Our ISOs are based on official
							Microsoft Windows builds sourced directly from Microsoft. We
							optimize and customize the installation process, but the core
							Windows files are genuine and unmodified.
						</p>
						<p>Important notes:</p>
						<ul>
							<li>
								You still need a <strong>valid Windows license</strong> to
								activate Windows
							</li>
							<li>
								All modifications are <strong>safe and reversible</strong>
							</li>
							<li>No malware, spyware, or unauthorized software is included</li>
							<li>We do not provide pirated or cracked software</li>
							<li>All optimizations are documented and transparent</li>
						</ul>
					</div>
				),
			},
			{
				question: "Who are your typical customers?",
				answer: (
					<div>
						<p>Our customer base includes:</p>
						<ul>
							<li>
								<strong>Esports Professionals:</strong> Competitive players who
								need every advantage
							</li>
							<li>
								<strong>Content Creators:</strong> Streamers and YouTubers
								requiring smooth performance
							</li>
							<li>
								<strong>Serious Gamers:</strong> Enthusiasts who want the best
								possible experience
							</li>
							<li>
								<strong>LAN Centers:</strong> Gaming cafes looking to optimize
								multiple systems
							</li>
							<li>
								<strong>PC Builders:</strong> System integrators offering
								optimized PCs to clients
							</li>
						</ul>
					</div>
				),
			},
			{
				question: "What games do your optimizations work with?",
				answer: (
					<div>
						<p>
							Our optimizations are <strong>game-agnostic</strong> and improve
							performance across all titles. However, we have specific
							optimization profiles for popular esports games including:
						</p>
						<ul>
							<li>Counter-Strike 2 (CS2)</li>
							<li>Valorant</li>
							<li>League of Legends</li>
							<li>Dota 2</li>
							<li>Fortnite</li>
							<li>Apex Legends</li>
							<li>Call of Duty (Warzone & multiplayer)</li>
							<li>Rainbow Six Siege</li>
							<li>Overwatch 2</li>
						</ul>
						<p>
							The system-level optimizations benefit all games, while our
							included scripts can apply game-specific tweaks.
						</p>
					</div>
				),
			},
		],
		technical: [
			{
				question: "How much performance improvement can I expect?",
				answer: (
					<div>
						<p>
							Performance improvements vary based on your hardware and current
							setup, but typical results include:
						</p>
						<ul>
							<li>
								<strong>FPS Increase:</strong> 30-50% average FPS boost (up to
								100+ FPS in some cases)
							</li>
							<li>
								<strong>Frame Time Consistency:</strong> 40-60% improvement in
								1% and 0.1% lows
							</li>
							<li>
								<strong>Input Lag Reduction:</strong> 5-15ms lower end-to-end
								latency
							</li>
							<li>
								<strong>Resource Usage:</strong> 70-80% fewer background
								processes
							</li>
							<li>
								<strong>Boot Time:</strong> 40-60% faster startup times
							</li>
						</ul>
						<p>
							<strong>Note:</strong> Systems that are currently unoptimized or
							bloated see the most dramatic improvements. High-end systems
							already running clean setups may see more modest gains.
						</p>
					</div>
				),
			},
			{
				question: "Will this work with my specific hardware?",
				answer: (
					<div>
						<p>
							Our optimizations work with virtually all modern gaming hardware:
						</p>
						<ul>
							<li>
								<strong>CPUs:</strong> Intel (6th gen+) and AMD Ryzen (all
								generations)
							</li>
							<li>
								<strong>GPUs:</strong> NVIDIA (GTX 900 series+) and AMD (RX 400
								series+)
							</li>
							<li>
								<strong>RAM:</strong> 8GB minimum, 16GB+ recommended
							</li>
							<li>
								<strong>Storage:</strong> SSD strongly recommended for best
								results
							</li>
							<li>
								<strong>Operating Systems:</strong> Windows 10 (1903+) and
								Windows 11
							</li>
						</ul>
						<p>
							If you have specific concerns about compatibility,{" "}
							<a href="/contact">contact us</a> before purchasing and we'll
							verify compatibility with your system.
						</p>
					</div>
				),
			},
			{
				question: "Do I need technical knowledge to use your products?",
				answer: (
					<div>
						<p>
							<strong>Not at all!</strong> While we serve many tech-savvy users,
							our products are designed to be accessible to everyone:
						</p>
						<ul>
							<li>Step-by-step installation guides with screenshots</li>
							<li>Video tutorials walking through the entire process</li>
							<li>Pre-configured settings (no manual tweaking required)</li>
							<li>Automated scripts that do the work for you</li>
							<li>24/7 support team ready to help</li>
							<li>Discord community for peer support</li>
						</ul>
						<p>
							If you can install Windows, you can use our products. And if you
							need help, we're always here.
						</p>
					</div>
				),
			},
			{
				question: "What's the difference between Windows 10 and Windows 11 ISOs?",
				answer: (
					<div>
						<p>Both are fully optimized, but have key differences:</p>
						<h4>Windows 10 Enterprise ISO:</h4>
						<ul>
							<li>Maximum stability and compatibility</li>
							<li>Best for competitive gaming (proven platform)</li>
							<li>Lower system requirements</li>
							<li>Wider driver support</li>
							<li>Recommended for: CS2, Valorant, competitive FPS</li>
						</ul>
						<h4>Windows 11 Pro Gaming Edition:</h4>
						<ul>
							<li>Latest features and DirectX 12 Ultimate</li>
							<li>Auto HDR and improved gaming features</li>
							<li>Better for newer games (2022+)</li>
							<li>Requires newer hardware (TPM 2.0, UEFI)</li>
							<li>Recommended for: Latest AAA games, future-proofing</li>
						</ul>
						<p>
							Not sure which to choose? <a href="/contact">Contact us</a> and
							we'll recommend based on your hardware and games.
						</p>
					</div>
				),
			},
			{
				question: "What is BIOS optimization and do I need it?",
				answer: (
					<div>
						<p>
							BIOS optimization involves configuring your motherboard's firmware
							settings to maximize gaming performance. This includes:
						</p>
						<ul>
							<li>Memory (RAM) timing optimization</li>
							<li>CPU power delivery tuning</li>
							<li>Disabling unused hardware features</li>
							<li>Optimizing PCIe lane allocation</li>
							<li>Power management configuration</li>
							<li>Boot optimization</li>
						</ul>
						<p>
							<strong>Do you need it?</strong> If you:
						</p>
						<ul>
							<li>Want to extract maximum performance from your hardware</li>
							<li>Have a high-end system that's not performing as expected</li>
							<li>Experience stuttering or inconsistent frame times</li>
							<li>Are a competitive player seeking every advantage</li>
						</ul>
						<p>
							Then yes, BIOS optimization can provide significant benefits. We
							handle everything remotely and ensure stability.
						</p>
					</div>
				),
			},
			{
				question: "Will Windows Update undo the optimizations?",
				answer: (
					<div>
						<p>
							No! Our optimizations are designed to persist through Windows
							Updates. Additionally:
						</p>
						<ul>
							<li>
								We include scripts that automatically reapply certain settings
								after updates
							</li>
							<li>Update policies are configured to minimize disruption</li>
							<li>You have full control over when updates are installed</li>
							<li>We provide update guides to maintain optimizations</li>
							<li>Our support team helps if any issues arise post-update</li>
						</ul>
					</div>
				),
			},
			{
				question: "Can I use your ISO on multiple computers?",
				answer: (
					<div>
						<p>Yes, but with limitations:</p>
						<ul>
							<li>
								You can use the ISO to install on{" "}
								<strong>up to 3 personal computers</strong>
							</li>
							<li>Each computer requires its own valid Windows license</li>
							<li>Commercial use requires a separate license (contact us)</li>
							<li>Redistribution of the ISO is strictly prohibited</li>
						</ul>
						<p>
							For LAN centers, PC cafes, or business use, please{" "}
							<a href="/contact">contact us</a> for commercial licensing options.
						</p>
					</div>
				),
			},
		],
		billing: [
			{
				question: "What payment methods do you accept?",
				answer: (
					<div>
						<p>
							We accept all major payment methods through our secure Stripe
							payment processor:
						</p>
						<ul>
							<li>
								Credit cards (Visa, Mastercard, American Express, Discover)
							</li>
							<li>Debit cards</li>
							<li>Apple Pay</li>
							<li>Google Pay</li>
							<li>European payment methods (iDEAL, SEPA, etc.)</li>
						</ul>
						<p>
							All transactions are encrypted and secure. We never see or store
							your card details.
						</p>
					</div>
				),
			},
			{
				question: "What is your refund policy?",
				answer: (
					<div>
						<p>
							We offer a <strong>14-day money-back guarantee</strong> on all
							products and services:
						</p>
						<ul>
							<li>
								If you're not satisfied for any reason, contact us within 14
								days
							</li>
							<li>We'll issue a full refund, no questions asked</li>
							<li>
								Digital products: Full refund available within 14 days of
								purchase
							</li>
							<li>
								Services: Full refund if not yet started, partial refund based
								on completion
							</li>
						</ul>
						<p>
							To request a refund, email{" "}
							<a href="mailto:support@softhe.io">support@softhe.io</a> with your
							order number. Refunds are typically processed within 3-5 business
							days.
						</p>
					</div>
				),
			},
			{
				question: "How long does delivery take?",
				answer: (
					<div>
						<p>Delivery times vary by product type:</p>
						<ul>
							<li>
								<strong>Custom Windows ISOs:</strong> Instant delivery via email
								after purchase
							</li>
							<li>
								<strong>BIOS Optimization Service:</strong> 24-48 hours (remote
								session scheduled)
							</li>
							<li>
								<strong>Complete Performance Tuning:</strong> 2-5 days depending
								on complexity
							</li>
							<li>
								<strong>Premium Support:</strong> Immediate access after purchase
							</li>
						</ul>
						<p>
							You'll receive an email with download links and instructions
							immediately after purchase. Check your spam folder if you don't see
							it within 5 minutes.
						</p>
					</div>
				),
			},
			{
				question: "Do you offer discounts or bundle deals?",
				answer: (
					<div>
						<p>Yes! We offer several ways to save:</p>
						<ul>
							<li>
								<strong>Bundle Packages:</strong> Save up to 25% when purchasing
								multiple services together
							</li>
							<li>
								<strong>Seasonal Sales:</strong> Special promotions during major
								gaming events
							</li>
							<li>
								<strong>Referral Program:</strong> Get 15% off when you refer
								friends (coming soon)
							</li>
							<li>
								<strong>Educational Discount:</strong> 10% off for students with
								valid ID
							</li>
							<li>
								<strong>Team/Organization Discount:</strong> Contact us for bulk
								pricing
							</li>
						</ul>
						<p>Subscribe to our newsletter to be notified of special offers!</p>
					</div>
				),
			},
			{
				question: "What currency do you charge in?",
				answer: (
					<div>
						<p>
							Our prices are listed in EUR (Euros), but we accept payments from
							customers worldwide. Your bank or payment provider will
							automatically convert the amount to your local currency at the
							current exchange rate.
						</p>
						<p>
							The final amount charged may include currency conversion fees from
							your bank.
						</p>
					</div>
				),
			},
		],
		support: [
			{
				question: "What kind of support do you provide?",
				answer: (
					<div>
						<p>We provide comprehensive support through multiple channels:</p>
						<ul>
							<li>
								<strong>Email Support:</strong>{" "}
								<a href="mailto:support@softhe.io">support@softhe.io</a>{" "}
								(response within 2-4 hours)
							</li>
							<li>
								<strong>Discord Support:</strong>{" "}
								<a
									href="https://discord.com/users/softhecs"
									target="_blank"
									rel="noopener noreferrer"
								>
									@softhecs
								</a>{" "}
								(fastest response)
							</li>
							<li>
								<strong>Documentation:</strong> Detailed guides and video
								tutorials
							</li>
							<li>
								<strong>Community Forum:</strong> Discord server with active
								community
							</li>
							<li>
								<strong>Remote Assistance:</strong> Screen sharing for complex
								issues (Premium Support customers)
							</li>
						</ul>
						<p>
							All customers receive lifetime support for their purchased
							products.
						</p>
					</div>
				),
			},
			{
				question: "How quickly do you respond to support requests?",
				answer: (
					<div>
						<p>Our typical response times are:</p>
						<ul>
							<li>
								<strong>Discord:</strong> 15-30 minutes during business hours
								(fastest)
							</li>
							<li>
								<strong>Email:</strong> 2-4 hours during business hours
							</li>
							<li>
								<strong>After Hours:</strong> Within 12 hours
							</li>
							<li>
								<strong>Premium Support:</strong> Priority response within 1
								hour, 24/7
							</li>
						</ul>
						<p>Business hours: Monday-Sunday, 9 AM - 10 PM CET</p>
					</div>
				),
			},
			{
				question: "What if I need help installing the ISO?",
				answer: (
					<div>
						<p>We're here to help! Installation support includes:</p>
						<ul>
							<li>Step-by-step written guides with screenshots</li>
							<li>Video tutorial showing the entire installation process</li>
							<li>Pre-installation checklist</li>
							<li>USB creation tool and instructions</li>
							<li>Live support via Discord or email</li>
							<li>
								Remote assistance available (for Premium Support customers)
							</li>
						</ul>
						<p>
							The vast majority of customers complete installation without
							issues, but we're always ready to help if needed.
						</p>
					</div>
				),
			},
			{
				question: "Do you offer custom optimization services?",
				answer: (
					<div>
						<p>
							Yes! For customers with specific needs or unique hardware
							configurations, we offer custom optimization services:
						</p>
						<ul>
							<li>Custom BIOS tuning for specific games or workloads</li>
							<li>Personalized Windows configuration</li>
							<li>Multi-system optimization (for LAN centers)</li>
							<li>Ongoing maintenance and monitoring</li>
							<li>Training and consultation</li>
						</ul>
						<p>
							<a href="/contact">Contact us</a> to discuss your requirements and
							get a custom quote.
						</p>
					</div>
				),
			},
			{
				question: "What if something goes wrong with the installation?",
				answer: (
					<div>
						<p>Don't worry - we've got you covered:</p>
						<ul>
							<li>Contact support immediately for troubleshooting assistance</li>
							<li>We'll help diagnose and fix the issue remotely</li>
							<li>If needed, we'll guide you through a clean reinstallation</li>
							<li>All optimizations are reversible if you want to revert</li>
							<li>We include recovery tools in case of system issues</li>
						</ul>
						<p>
							In thousands of installations, serious issues are extremely rare,
							and we've always been able to resolve them quickly.
						</p>
					</div>
				),
			},
			{
				question: "Can I upgrade from Windows 10 to Windows 11 ISO later?",
				answer: (
					<div>
						<p>
							Yes! If you purchase the Windows 10 ISO and later decide you want
							Windows 11:
						</p>
						<ul>
							<li>You can upgrade by paying the difference (€15)</li>
							<li>Contact us with your original order number</li>
							<li>We'll provide the Windows 11 ISO immediately</li>
							<li>Full installation support included</li>
						</ul>
						<p>
							We want you to have the best solution for your needs, and we make
							upgrades easy!
						</p>
					</div>
				),
			},
		],
	};

	const categories = [
		{ id: "all", label: "All Questions", icon: "fas fa-th" },
		{ id: "general", label: "General", icon: "fas fa-info-circle" },
		{ id: "technical", label: "Technical", icon: "fas fa-cog" },
		{ id: "billing", label: "Billing", icon: "fas fa-credit-card" },
		{ id: "support", label: "Support", icon: "fas fa-headset" },
	];

	const toggleItem = (category, index) => {
		const itemId = `${category}-${index}`;
		setActiveItems((prev) =>
			prev.includes(itemId)
				? prev.filter((id) => id !== itemId)
				: [...prev, itemId]
		);
	};

	const handleSearch = (value) => {
		setSearchTerm(value.toLowerCase());
		if (value) {
			// Auto-expand all matching items
			const matchingItems = [];
			Object.entries(faqData).forEach(([category, items]) => {
				items.forEach((item, index) => {
					const questionText =
						typeof item.question === "string" ? item.question.toLowerCase() : "";
					const answerText =
						typeof item.answer === "string"
							? item.answer.toLowerCase()
							: item.answer?.props?.children
								? JSON.stringify(item.answer.props.children).toLowerCase()
								: "";

					if (
						questionText.includes(value.toLowerCase()) ||
						answerText.includes(value.toLowerCase())
					) {
						matchingItems.push(`${category}-${index}`);
					}
				});
			});
			setActiveItems(matchingItems);
		} else {
			setActiveItems([]);
		}
	};

	const filterItems = (category, items) => {
		if (!searchTerm) return items;

		return items.filter((item) => {
			const questionText =
				typeof item.question === "string" ? item.question.toLowerCase() : "";
			const answerText =
				typeof item.answer === "string"
					? item.answer.toLowerCase()
					: item.answer?.props?.children
						? JSON.stringify(item.answer.props.children).toLowerCase()
						: "";

			return (
				questionText.includes(searchTerm) || answerText.includes(searchTerm)
			);
		});
	};

	const shouldShowCategory = (category) => {
		if (activeCategory !== "all" && activeCategory !== category) return false;
		if (!searchTerm) return true;
		return filterItems(category, faqData[category]).length > 0;
	};

	return (
		<div className="faq-page">
			<SEO
				title="FAQ - Frequently Asked Questions | Softhe.io"
				description="Find answers to common questions about PC optimization, custom Windows ISOs, BIOS tuning, and our services at Softhe.io."
				keywords="PC optimization FAQ, Windows ISO questions, BIOS tuning help, gaming optimization FAQ"
				canonical="https://softhe.io/faq"
			/>

			<section className="page-header">
				<div className="container">
					<h1>Frequently Asked Questions</h1>
					<p>Find answers to common questions about our services and optimization process</p>
				</div>
			</section>

			<section className="faq-section">
				<div className="container">
					{/* Category Navigation */}
					<div className="faq-categories">
						{categories.map((category) => (
							<button
								key={category.id}
								className={`category-btn ${activeCategory === category.id ? "active" : ""
									}`}
								onClick={() => {
									setActiveCategory(category.id);
									setSearchTerm("");
									setActiveItems([]);
								}}
							>
								<i className={category.icon}></i> {category.label}
							</button>
						))}
					</div>

					{/* Search Box */}
					<div className="faq-search">
						<i className="fas fa-search"></i>
						<input
							type="text"
							placeholder="Search for answers..."
							value={searchTerm}
							onChange={(e) => handleSearch(e.target.value)}
						/>
					</div>

					{/* FAQ Items by Category */}
					{Object.entries(faqData).map(([category, items]) => {
						if (!shouldShowCategory(category)) return null;

						const filteredItems = filterItems(category, items);
						if (filteredItems.length === 0) return null;

						return (
							<div key={category} className="faq-category">
								<h2 className="category-title">
									<i
										className={
											categories.find((c) => c.id === category)?.icon ||
											"fas fa-question-circle"
										}
									></i>{" "}
									{category.charAt(0).toUpperCase() + category.slice(1)}{" "}
									Questions
								</h2>

								{filteredItems.map((item) => {
									const originalIndex = items.indexOf(item);
									const itemId = `${category}-${originalIndex}`;
									const isActive = activeItems.includes(itemId);

									return (
										<div
											key={itemId}
											className={`faq-item ${isActive ? "active" : ""}`}
										>
											<button
												className="faq-question"
												onClick={() => toggleItem(category, originalIndex)}
											>
												<span>{item.question}</span>
												<i className="fas fa-chevron-down"></i>
											</button>
											<div className="faq-answer">
												{typeof item.answer === "string" ? (
													<p>{item.answer}</p>
												) : (
													item.answer
												)}
											</div>
										</div>
									);
								})}
							</div>
						);
					})}

					{/* No Results Message */}
					{searchTerm &&
						Object.keys(faqData).every(
							(category) => filterItems(category, faqData[category]).length === 0
						) && (
							<div className="no-results">
								<i className="fas fa-search"></i>
								<h3>No results found</h3>
								<p>
									Try different keywords or{" "}
									<a href="/contact">contact our support team</a>
								</p>
							</div>
						)}

					{/* CTA Section */}
					<div className="faq-cta">
						<div className="faq-cta-content">
							<h2>Still Have Questions?</h2>
							<p>
								Can't find the answer you're looking for? Our support team is
								here to help!
							</p>
							<div className="faq-cta-buttons">
								<a href="/contact" className="btn btn-primary">
									<i className="fas fa-envelope"></i> Contact Support
								</a>
								<a
									href="https://discord.com/users/softhecs"
									target="_blank"
									rel="noopener noreferrer"
									className="btn btn-secondary"
								>
									<i className="fab fa-discord"></i> Join Discord
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

export default FAQ;
