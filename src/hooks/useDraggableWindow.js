import { useState, useRef, useEffect } from 'react';

/**
 * useDraggableWindow Hook
 * 
 * Custom React hook that enables window/panel dragging functionality.
 * Manages:
 * - Window position (x, y coordinates)
 * - Window size (width, height)
 * - Mouse drag events and position calculations
 * - Initial positioning (desktop: right side, mobile: default)
 * 
 * @param {Object} initialSize - Initial window dimensions {w, h}
 * @param {number} initialSize.w - Initial width in pixels (default: 340)
 * @param {number} initialSize.h - Initial height in pixels (default: 600)
 * @returns {Object} Window state and drag handler
 * @returns {Object} winState - Current window state {x, y, w, h}
 * @returns {Function} setWinState - Update window state
 * @returns {Function} handleMouseDown - Mouse down event handler to initiate drag
 */
export function useDraggableWindow(initialSize = { w: 340, h: 600 }) {
  // Window state: x,y position and w,h dimensions
  const [winState, setWinState] = useState({ x: 20, y: 80, ...initialSize });
  // Store drag start position for delta calculations
  const dragStart = useRef(null);

  /**
   * Effect: Position window on right side of screen on desktop
   * Only runs once on mount, and only on desktop (>768px width)
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      // Position window at right edge with 20px margin
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWinState(prev => ({ ...prev, x: window.innerWidth - prev.w - 20 }));
    }
  }, []);

  /**
   * Handle mouse down event to initiate dragging
   * Ignores clicks on interactive elements (buttons, inputs)
   * Sets up mousemove and mouseup listeners for drag tracking
   * 
   * @param {MouseEvent} e - Mouse down event
   */
  const handleMouseDown = (e) => {
    // Don't initiate drag if user clicked on a button or input
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    
    // Store initial window position and mouse position for delta calculation
    dragStart.current = { startX: winState.x, startY: winState.y, mouseX: e.clientX, mouseY: e.clientY };
    
    /**
     * Handle mouse move during drag
     * Calculate new position based on mouse delta from drag start
     */
    const onMove = (mv) => {
        if (!dragStart.current) return;
        // Update window position by mouse delta
        setWinState(prev => ({ 
          ...prev, 
          x: dragStart.current.startX + (mv.clientX - dragStart.current.mouseX), 
          y: dragStart.current.startY + (mv.clientY - dragStart.current.mouseY) 
        }));
    };
    
    /**
     * Handle mouse up to end drag
     * Cleans up event listeners and resets drag state
     */
    const onUp = () => { 
      dragStart.current = null; 
      window.removeEventListener('mousemove', onMove); 
      window.removeEventListener('mouseup', onUp); 
    };
    
    // Register global mouse event listeners for drag tracking
    window.addEventListener('mousemove', onMove); 
    window.addEventListener('mouseup', onUp);
  };
  
  // Return window state and drag handler for consumer components
  return { winState, setWinState, handleMouseDown };
}