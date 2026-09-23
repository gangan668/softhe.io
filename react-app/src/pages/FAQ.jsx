import { useState } from "react";
import SEO from "../components/SEO";
import { absoluteUrl, siteConfig } from "../config/site";
import { trackEvent } from "../utils/analytics";
import "./FAQ.css";

// Helper function to extract text from React elements safely
const extractTextFromReactElement = (element) => {
	if (typeof element === "string") {
		return element;
	}
	if (typeof element === "number") {
		return String(element);
	}
	if (Array.isArray(element)) {
		return element.map(extractTextFromReactElement).join(" ");
	}
	if (element?.props?.children) {
		return extractTextFromReactElement(element.props.children);
	}
	return "";
};

function FAQ() {
	const [activeCategory, setActiveCategory] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [activeItems, setActiveItems] = useState([]);

	const faqData = {
		general: [
			{
				question: "What is Softhe.io and what do you offer?",
				answer:
					"Softhe.io sells custom Windows builds and BIOS tuning for gaming PCs. The work targets background use, frame-time consistency, and settings that match the customer's hardware.",
			},
			{
				question: "What exactly is included in the custom Windows ISO?",
				answer: (
					<div>
						<p>The Windows builds include:</p>
						<ul>
							<li>
								<strong>Preinstalled software:</strong> Selected Windows apps
								and services are removed or disabled
							</li>
							<li>
								<strong>System settings:</strong> Windows settings configured
								for the intended gaming workload
							</li>
							<li>
								<strong>Service Optimization:</strong> Only essential services
								enabled, reducing CPU and RAM usage
							</li>
							<li>
								<strong>Privacy Settings:</strong> Pre-configured for stronger
								privacy and minimal telemetry
							</li>
							<li>
								<strong>Maintenance tools:</strong> Included scripts for supported
								updates and configuration tasks
							</li>
							<li>
								<strong>Performance Profiles:</strong> Pre-configured power
								plans and GPU settings
							</li>
							<li>
								<strong>Updates:</strong> The applicable update terms are stated with the product and order
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
							The builds are based on official
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
								Back up your data and keep official recovery media before installation
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
						<p>The services are intended for:</p>
						<ul>
							<li>
								<strong>Competitive players:</strong> Players who want measured and repeatable PC changes
							</li>
							<li>
								<strong>Content Creators:</strong> Streamers and YouTubers
								requiring smooth performance
							</li>
							<li>
								<strong>PC enthusiasts:</strong> Users who want a documented Windows or BIOS configuration
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
							System settings can affect many games, but results depend on the game,
							hardware, drivers, and bottleneck. Common requests include:
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
							No setting guarantees an improvement in every title. Measure each change on your own PC.
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
						Performance improvements vary based on hardware, software, drivers,
						game settings, and the starting condition of the system. The current
						published sample shows:
						</p>
						<ul>
							<li>
								<strong>CS2 average FPS:</strong> 658 to 826 in the two-run medians
							</li>
							<li>
								<strong>CS2 1% low:</strong> 225 to 285 FPS in the two-run medians
							</li>
							<li>
								<strong>Idle processes:</strong> 111 to 31 in the Task Manager sample
							</li>
							<li>
								<strong>Idle memory:</strong> 2.5 GB to 0.8 GB in the Task Manager sample
							</li>
						</ul>
						<p>
							<strong>Note:</strong> These are single-system observations, not a
							guarantee. Review the benchmark page and ask about compatibility
							before purchasing.
						</p>
					</div>
				),
			},
			{
				question: "Will this work with my specific hardware?",
				answer: (
					<div>
						<p>
							Compatibility depends on the exact motherboard, CPU, GPU, firmware, drivers, and Windows edition. General starting points are:
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
							You should be comfortable installing Windows and following recovery instructions.
							The supplied material includes:
						</p>
						<ul>
							<li>Step-by-step installation guides with screenshots</li>
							<li>Video tutorials walking through the entire process</li>
							<li>Pre-configured settings (no manual tweaking required)</li>
							<li>Automated scripts that do the work for you</li>
								<li>Email and Discord support for setup questions</li>
							<li>Discord community for peer support</li>
						</ul>
						<p>
							Contact support before ordering if you have not installed Windows or changed BIOS settings before.
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
							<li>For a specific Windows 10 compatibility requirement</li>
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
							<li>For newer hardware and software that requires Windows 11</li>
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
							BIOS tuning configures motherboard firmware for the installed hardware and workload. This can include:
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
							<li>Want to improve consistency and reduce system overhead</li>
							<li>Have a high-end system that's not performing as expected</li>
							<li>Experience stuttering or inconsistent frame times</li>
							<li>Want a documented BIOS profile and stability check</li>
						</ul>
						<p>
							A compatibility check is required before deciding whether BIOS tuning is appropriate. No remote session can guarantee stability under every workload.
						</p>
					</div>
				),
			},
			{
				question: "Will Windows Update undo the optimizations?",
				answer: (
					<div>
						<p>
							Windows updates can reset or replace settings. The included maintenance guidance explains which settings may need to be checked again.
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
							Stripe handles the payment form. Softhe.io does not collect card numbers through this website.
						</p>
					</div>
				),
			},
			{
				question: "What is your refund policy?",
				answer: (
					<div>
						<p>
							A 14-day withdrawal period may apply. The legal terms and any consent to begin digital delivery determine your rights for a specific order.
						</p>
						<ul>
							<li>Submit the withdrawal form or email support with your order number</li>
							<li>Digital delivery and work already started can affect the amount due</li>
							<li>Read the Terms of Service and withdrawal notice before checkout</li>
						</ul>
						<p>
							To request a refund, email{" "}
							<a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> with your
							order number. Support will confirm whether the request qualifies and what happens next.
						</p>
					</div>
				),
			},
			{
				question: "How long does delivery take?",
				answer: (
					<div>
						<p>Delivery and scheduling depend on the product and current availability:</p>
						<ul>
							<li>
								<strong>Windows builds:</strong> The order confirmation states the delivery method and timing
							</li>
							<li>
								<strong>BIOS tuning:</strong> Support confirms compatibility before scheduling a remote session
							</li>
							<li>
								<strong>Custom work:</strong> Timing depends on scope and hardware
							</li>
							<li>
								<strong>Support:</strong> Response times vary with request volume
							</li>
						</ul>
						<p>
							Check the order confirmation for the delivery estimate. Contact support if it does not arrive.
						</p>
					</div>
				),
			},
			{
				question: "Do you offer discounts or bundle deals?",
				answer: (
					<div>
						<p>The checkout applies the current bundle discounts:</p>
						<ul>
							<li>
								<strong>Two products:</strong> 5% off the bundle
							</li>
							<li>
								<strong>Three products:</strong> 10% off the bundle
							</li>
							<li>
								<strong>Other offers:</strong> Only discounts shown in the store or checkout apply
							</li>
						</ul>
						<p>The server calculates the final discount before Stripe opens.</p>
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
						<p>Support is available through these channels:</p>
						<ul>
							<li>
								<strong>Email Support:</strong>{" "}
								<a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
								(response time varies with request volume)
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
								(availability varies)
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
							Support scope and duration follow the purchased product and the
							terms shown at checkout.
						</p>
					</div>
				),
			},
			{
				question: "How quickly do you respond to support requests?",
				answer: (
					<div>
					<p>Response times vary with request volume and availability:</p>
						<ul>
							<li>
								<strong>Discord:</strong> monitored when support is available
							</li>
							<li>
								<strong>Email:</strong> primary channel for traceable requests
							</li>
							<li>
								<strong>Complex requests:</strong> may require additional diagnostic time
							</li>
							<li>
								<strong>Paid support:</strong> handled according to the purchased service scope
							</li>
						</ul>
					<p>Do not rely on a guaranteed response deadline unless it is stated in your order.</p>
					</div>
				),
			},
			{
				question: "What if I need help installing the ISO?",
				answer: (
					<div>
						<p>Installation support can include:</p>
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
							Back up important data and keep official Windows recovery media available before installation.
						</p>
					</div>
				),
			},
			{
				question: "Do you offer custom optimization services?",
				answer: (
					<div>
						<p>
							Custom work may be available for specific hardware or software requirements:
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
						<p>Stop and contact support if installation does not complete as expected:</p>
						<ul>
							<li>Contact support immediately for troubleshooting assistance</li>
							<li>We'll help diagnose and fix the issue remotely</li>
							<li>If needed, we'll guide you through a clean reinstallation</li>
							<li>Use your backup or official recovery media when a clean rollback is required</li>
							<li>We include recovery tools in case of system issues</li>
						</ul>
						<p>
							Serious issues are uncommon when the installation guide is followed,
							and support can help troubleshoot if something does not behave as expected.
						</p>
					</div>
				),
			},
			{
				question: "Can I upgrade from Windows 10 to Windows 11 ISO later?",
				answer: (
					<div>
						<p>
							Contact support with your order number if you later need Windows 11:
						</p>
						<ul>
							<li>You can upgrade by paying the difference (€15)</li>
							<li>Contact us with your original order number</li>
							<li>Support will confirm hardware compatibility and the current upgrade terms</li>
							<li>Delivery timing is confirmed with the upgrade order</li>
						</ul>
						<p>
							Do not upgrade until you have checked Windows 11 hardware and software compatibility.
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
		if (value.trim().length >= 3) {
			trackEvent("faq_search", { search_term: value.trim().slice(0, 80) });
		}
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
							: extractTextFromReactElement(item.answer).toLowerCase();

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
					: extractTextFromReactElement(item.answer).toLowerCase();

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
				title="Windows and BIOS tuning FAQ | Softhe.io"
				description="Answers about Softhe.io Windows builds, BIOS tuning, compatibility, benchmark limits, orders, and support."
				keywords="PC optimization FAQ, Windows ISO questions, BIOS tuning help, gaming optimization FAQ"
				canonicalUrl={absoluteUrl('/faq')}
			/>

			<section className="page-header">
				<div className="container">
					<h1>Questions about products and support</h1>
					<p>Read about compatibility, installation, benchmark limits, ordering, and support.</p>
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
									trackEvent("faq_category_select", { category: category.id });
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
							placeholder="Search the FAQ"
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
