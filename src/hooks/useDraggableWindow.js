import { useState, useRef, useEffect } from 'react';
export function useDraggableWindow(initialSize = { w: 340, h: 600 }) {
  const [winState, setWinState] = useState({ x: 20, y: 80, ...initialSize });
  const dragStart = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWinState(prev => ({ ...prev, x: window.innerWidth - prev.w - 20 }));
    }
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    dragStart.current = { startX: winState.x, startY: winState.y, mouseX: e.clientX, mouseY: e.clientY };
    const onMove = (mv) => {
        if (!dragStart.current) return;
        setWinState(prev => ({ ...prev, x: dragStart.current.startX + (mv.clientX - dragStart.current.mouseX), y: dragStart.current.startY + (mv.clientY - dragStart.current.mouseY) }));
    };
    const onUp = () => { dragStart.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };
  return { winState, setWinState, handleMouseDown };
}