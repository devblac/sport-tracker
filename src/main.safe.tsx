
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Error handling for the entire app
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Safer app loading
async function loadApp() {
  try {
    const { default: App } = await import('./App.stable');
    
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ App loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load app:', error);
    
    // Show basic error UI
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f3f4f6;
          padding: 1rem;
        ">
          <div style="text-align: center; max-width: 400px;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">💥</div>
            <h1 style="color: #dc2626; margin-bottom: 1rem;">App Failed to Load</h1>
            <p style="color: #6b7280; margin-bottom: 2rem;">
              There was an error loading the application. Please try refreshing the page.
            </p>
            <button 
              onclick="window.location.reload()" 
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 1rem;
              "
            >
              Reload App
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Load app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadApp);
} else {
  loadApp();
}
