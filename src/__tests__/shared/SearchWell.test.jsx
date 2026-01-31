import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../hooks/useDraggableWindow', () => ({
  useDraggableWindow: () => ({ handleMouseDown: vi.fn() }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => ({}),
  })),
}));

vi.mock('../../config/firebase', () => ({
  db: {},
}));

describe('SearchWell Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [] }),
    }));
  });

  it('returns null when closed', async () => {
    const SearchWell = (await import('../../shared/SearchWell.jsx')).default;

    const { container } = render(
      <SearchWell
        theme="light"
        isOpen={false}
        onClose={() => {}}
        initialQuery=""
        onJumpToVerse={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders when open', async () => {
    const SearchWell = (await import('../../shared/SearchWell.jsx')).default;

    render(
      <SearchWell
        theme="light"
        isOpen
        onClose={() => {}}
        initialQuery=""
        onJumpToVerse={() => {}}
      />
    );

    expect(await screen.findByText(/the well/i)).toBeTruthy();
  });
});
