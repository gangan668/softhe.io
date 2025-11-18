import React from 'react';
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

		// In production, you might want to log to an error reporting service
		// logErrorToService(error, errorInfo);
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
							<i className="fas fa-exclamation-triangle"></i>
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
								<i className="fas fa-redo"></i> Try Again
							</button>

							<button
								className="btn btn-secondary"
								onClick={this.handleReload}
							>
								<i className="fas fa-sync"></i> Reload Page
							</button>

							<a
								href="/"
								className="btn btn-secondary"
							>
								<i className="fas fa-home"></i> Go Home
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
							<a href="mailto:support@softhe.io" className="support-link">
								<i className="fas fa-envelope"></i> support@softhe.io
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
