import React from 'react';
import { siteConfig } from '../config/site';
import { reportError } from '../utils/monitoring';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			errorCount: 0
		};
	}

	static getDerivedStateFromError() {
		// Update state so the next render will show the fallback UI
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		// Log error details for debugging
		console.error('ErrorBoundary caught an error:', error, errorInfo);

		this.setState(prevState => ({
			error,
			errorInfo,
			errorCount: prevState.errorCount + 1
		}));

		reportError(error, {
			source: 'ErrorBoundary',
			componentStack: errorInfo?.componentStack,
		});
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null
		});
	};

	handleReload = () => {
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			return (
				<div className="error-boundary">
					<div className="error-boundary-container">
						<div className="error-icon">
							<i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
						</div>

						<h1 className="error-title">Oops! Something went wrong</h1>

						<p className="error-message">
							We're sorry for the inconvenience. The application encountered an unexpected error.
						</p>

						<div className="error-actions">
							<button
								className="btn btn-primary"
								onClick={this.handleReset}
							>
								<i className="fas fa-redo" aria-hidden="true"></i> Try Again
							</button>

							<button
								className="btn btn-secondary"
								onClick={this.handleReload}
							>
								<i className="fas fa-sync" aria-hidden="true"></i> Reload Page
							</button>

							<a
								href="/"
								className="btn btn-secondary"
							>
								<i className="fas fa-home" aria-hidden="true"></i> Go Home
							</a>
						</div>

						{/* Show error details in development mode */}
						{import.meta.env.DEV && this.state.error && (
							<details className="error-details">
								<summary>Error Details (Development Only)</summary>
								<div className="error-stack">
									<h3>Error:</h3>
									<pre>{this.state.error.toString()}</pre>

									{this.state.errorInfo && (
										<>
											<h3>Component Stack:</h3>
											<pre>{this.state.errorInfo.componentStack}</pre>
										</>
									)}
								</div>
							</details>
						)}

						<div className="error-support">
							<p>If the problem persists, please contact our support team:</p>
							<a href={`mailto:${siteConfig.supportEmail}`} className="support-link">
								<i className="fas fa-envelope" aria-hidden="true"></i> {siteConfig.supportEmail}
							</a>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
