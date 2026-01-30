import React, { useState, useMemo } from 'react';

/**
 * BibleVersionPicker - A searchable dropdown component for selecting Bible translations
 * 
 * Features:
 * - Search by name, abbreviation, or language
 * - Grouped by language for better organization
 * - Highlights popular English versions at the top
 * - Responsive design
 * 
 * @param {string} selectedVersion - Currently selected Bible version ID
 * @param {function} onVersionChange - Callback when version is selected
 * @param {string} theme - Current theme ('light' or 'dark')
 */
function BibleVersionPicker({ selectedVersion, onVersionChange, theme = 'light', versions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get the selected version details
  const selectedVersionData = useMemo(() => {
    return versions.find(v => v.id === selectedVersion) || versions[0];
  }, [selectedVersion, versions]);

  // Filter versions based on search query
  const filteredVersions = useMemo(() => {
    if (!searchQuery.trim()) return versions;

    const query = searchQuery.toLowerCase();
    return versions.filter(version => 
      version.name.toLowerCase().includes(query) ||
      version.abbreviation.toLowerCase().includes(query) ||
      (version.language && version.language.toLowerCase().includes(query))
    );
  }, [searchQuery, versions]);

  // Group versions by language
  const groupedVersions = useMemo(() => {
    const groups = {
      'eng': { name: 'English', versions: [] },
      'spa': { name: 'Spanish', versions: [] },
      'other': { name: 'Other Languages', versions: [] }
    };

    filteredVersions.forEach(version => {
      const lang = version.language || 'other';
      if (groups[lang]) {
        groups[lang].versions.push(version);
      } else {
        groups['other'].versions.push(version);
      }
    });

    return Object.entries(groups).filter(([, group]) => group.versions.length > 0);
  }, [filteredVersions]);

  const handleVersionSelect = (versionId) => {
    onVersionChange(versionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Theme-based styles
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const textColor = isDark ? '#e0e0e0' : '#333333';
  const hoverBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const selectedBg = isDark ? '#0d4f8b' : '#e3f2fd';
  const groupHeaderBg = isDark ? '#252525' : '#f9f9f9';

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      {/* Selected Version Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 15px',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          color: textColor,
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#2196f3';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = borderColor;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span>
          <strong>{selectedVersionData?.abbreviation || '...'}</strong>
          <span style={{ color: isDark ? '#999' : '#666', marginLeft: '8px', fontSize: '12px' }}>
            {selectedVersionData?.name ? (
              selectedVersionData.name.length > 20 
                ? selectedVersionData.name.substring(0, 20) + '...'
                : selectedVersionData.name
            ) : 'Loading versions...'}
          </span>
        </span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: '12px'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '400px',
            overflow: 'hidden',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Input */}
          <div className="p-10" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search versions..."
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                color: textColor,
                fontSize: '13px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2196f3';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = borderColor;
              }}
            />
          </div>

          {/* Versions List */}
          <div style={{ 
            overflowY: 'auto',
            maxHeight: '350px',
            padding: '5px 0'
          }}>
            {filteredVersions.length === 0 ? (
              <div style={{ 
                padding: '20px',
                textAlign: 'center',
                color: isDark ? '#999' : '#666',
                fontSize: '13px'
              }}>
                No versions found
              </div>
            ) : (
              groupedVersions.map(([langCode, group]) => (
                <div key={langCode}>
                  {/* Language Group Header */}
                  <div style={{
                    padding: '8px 15px',
                    backgroundColor: groupHeaderBg,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isDark ? '#999' : '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}>
                    {group.name}
                  </div>

                  {/* Version Options */}
                  {group.versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => handleVersionSelect(version.id)}
                      style={{
                        width: '100%',
                        padding: '10px 15px',
                        backgroundColor: version.id === selectedVersion ? selectedBg : 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: textColor,
                        fontSize: '13px',
                        transition: 'background-color 0.15s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        if (version.id !== selectedVersion) {
                          e.currentTarget.style.backgroundColor = hoverBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (version.id !== selectedVersion) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{version.abbreviation}</strong>
                        <div style={{ 
                          fontSize: '11px', 
                          color: isDark ? '#999' : '#666',
                          marginTop: '2px'
                        }}>
                          {version.name}
                        </div>
                      </div>
                      {version.id === selectedVersion && (
                        <span style={{ color: '#2196f3', fontSize: '16px', marginLeft: '10px' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}

export default BibleVersionPicker;
