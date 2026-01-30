/**
 * Loading skeleton component for content placeholders
 * Provides a better UX than "Loading..." text
 */
export function LoadingSkeleton({ type = 'text', count = 3, height = '20px', className = '' }) {
  const skeletonStyle = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '4px',
    height: height,
    marginBottom: '10px'
  };

  const darkSkeletonStyle = {
    ...skeletonStyle,
    background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
    backgroundSize: '200% 100%'
  };

  // Determine if dark mode
  const isDark = document.documentElement.classList.contains('dark') || 
                 document.body.classList.contains('dark');

  const appliedStyle = isDark ? darkSkeletonStyle : skeletonStyle;

  if (type === 'avatar') {
    return (
      <div
        className={className}
        style={{
          ...appliedStyle,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          marginBottom: '0'
        }}
      />
    );
  }

  if (type === 'card') {
    return (
      <div className={className} style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ ...appliedStyle, height: '120px', marginBottom: '12px' }} />
        <div style={{ ...appliedStyle, height: '20px', width: '80%', marginBottom: '8px' }} />
        <div style={{ ...appliedStyle, height: '16px', width: '60%' }} />
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            ...appliedStyle,
            width: i === count - 1 ? '70%' : '100%'
          }}
        />
      ))}
    </div>
  );
}

// Add keyframe animation for shimmer effect (inject into document)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}
