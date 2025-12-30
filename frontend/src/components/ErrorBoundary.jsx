import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Safely extract error message
      let errorMessage = 'An unexpected error occurred';
      
      if (this.state.error) {
        if (typeof this.state.error === 'string') {
          errorMessage = this.state.error;
        } else if (this.state.error?.message) {
          errorMessage = String(this.state.error.message);
        } else if (typeof this.state.error === 'object') {
          // Try to stringify if it's an object
          try {
            errorMessage = JSON.stringify(this.state.error);
          } catch {
            errorMessage = 'An unexpected error occurred';
          }
        }
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4 text-sm">
              {errorMessage}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

