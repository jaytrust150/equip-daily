import React, { useState, useEffect } from 'react';

/**
 * Health Status Component
 * Displays system health checks in real-time
 */
export default function HealthStatus() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err) {
      setError(err.message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (!health && !error && !loading) {
    return null;
  }

  // Theme colors are handled by statusColors object

  const statusColors = {
    healthy: 'bg-green-100 border-green-300 text-green-800',
    degraded: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    unhealthy: 'bg-red-100 border-red-300 text-red-800'
  };

  const checkStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${health ? statusColors[health.status] : 'bg-gray-100'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">🏥 System Health</h3>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="px-3 py-1 text-sm bg-opacity-20 rounded hover:bg-opacity-30 disabled:opacity-50"
        >
          {loading ? '⟳ Checking...' : '🔄 Refresh'}
        </button>
      </div>

      {error ? (
        <div className="text-red-700">Error: {error}</div>
      ) : health ? (
        <>
          <div className="space-y-2 text-sm">
            {/* Environment Check */}
            <div className="flex items-center gap-2">
              <span>{checkStatusIcon(health.checks.environment?.status)}</span>
              <div className="flex-1">
                <span className="font-semibold">Environment</span>
                <div className="text-xs opacity-75">
                  {health.checks.environment?.message}
                  {health.checks.environment?.keyLength && (
                    <span> ({health.checks.environment.keyLength}-char key)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bible API Check */}
            <div className="flex items-center gap-2">
              <span>{checkStatusIcon(health.checks.bibleAPI?.status)}</span>
              <div className="flex-1">
                <span className="font-semibold">Bible API</span>
                <div className="text-xs opacity-75">
                  {health.checks.bibleAPI?.message}
                  {health.checks.bibleAPI?.availableBibles && (
                    <span> ({health.checks.bibleAPI.availableBibles} bibles)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Authorized Bibles Check */}
            <div className="flex items-center gap-2">
              <span>{checkStatusIcon(health.checks.authorizedBibles?.status)}</span>
              <div className="flex-1">
                <span className="font-semibold">Authorized Bibles</span>
                <div className="text-xs opacity-75">
                  {health.checks.authorizedBibles?.message}
                  {health.checks.authorizedBibles?.licensed && (
                    <span> ({health.checks.authorizedBibles.verified}/{health.checks.authorizedBibles.licensed})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {health.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <div className="text-xs font-semibold mb-1">Issues:</div>
              <ul className="text-xs space-y-1">
                {health.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs opacity-60">
            Last checked: {lastChecked?.toLocaleTimeString()}
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
