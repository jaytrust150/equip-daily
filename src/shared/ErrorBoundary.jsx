/**
 * Error Boundary Component
 * 
 * Wraps the entire application to catch React component errors
 * Integrates with Sentry for error tracking
 * 
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

import { Component } from 'react';
import * as Sentry from '@sentry/react';
import { captureError } from '../services/monitoring';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log error to console and Sentry
   */
  componentDidCatch(error, errorInfo) {
    // Set state to show error UI
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (!import.meta.env.PROD) {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Capture error in Sentry
    captureError(error, {
      componentStack: errorInfo.componentStack,
      severity: 'critical',
    });
  }

  /**
   * Reset error state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>
              ⚠️ Something Went Wrong
            </h1>
            <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
              We're sorry, but the application encountered an unexpected error.
              Our team has been notified and is working on a fix.
            </p>

            {!import.meta.env.PROD && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginBottom: '30px',
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    marginTop: '10px',
                    overflow: 'auto',
                    fontSize: '12px',
                    color: '#d32f2f',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.resetError}
              style={{
                padding: '10px 30px',
                fontSize: '16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '10px 30px',
                fontSize: '16px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap with Sentry error boundary
export default Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>An error occurred. Please refresh the page.</p>
    </div>
  ),
  showDialog: false,
});
