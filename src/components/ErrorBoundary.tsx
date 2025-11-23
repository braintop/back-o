import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const isFirebaseError = errorMessage.includes('Firebase') || errorMessage.includes('environment variables');

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>⚠️ Application Error</h1>
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            marginBottom: '20px',
          }}>
            <h2 style={{ marginTop: 0 }}>Error Details:</h2>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {errorMessage}
            </pre>
          </div>
          
          {isFirebaseError && (
            <div style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '600px',
              marginBottom: '20px',
            }}>
              <h3 style={{ marginTop: 0 }}>🔧 How to Fix:</h3>
              <ol style={{ textAlign: 'left' }}>
                <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                <li>Add the following variables:
                  <ul>
                    <li>VITE_FIREBASE_API_KEY</li>
                    <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                    <li>VITE_FIREBASE_PROJECT_ID</li>
                    <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                    <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                    <li>VITE_FIREBASE_APP_ID</li>
                  </ul>
                </li>
                <li>Redeploy your application</li>
              </ol>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

