import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Higher-order component that wraps a component with an error boundary
 * Usage: export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary(Component, fallbackMessage = 'Something went wrong') {
  function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary fallback={<div style={{ padding: '20px', textAlign: 'center' }}><p>{fallbackMessage}</p></div>}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WithErrorBoundaryWrapper;
}
