import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@sentry/react', async () => {
  const actual = await vi.importActual('@sentry/react');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    },
  };
});

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [null, false],
}));

vi.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => ({}),
  })),
  updateDoc: vi.fn(async () => ({})),
}));

vi.mock('../../services/firestoreService', () => ({
  subscribeToNotes: vi.fn(() => () => {}),
  saveNote: vi.fn(async () => ({})),
  deleteNote: vi.fn(async () => ({})),
  subscribeToUserProfile: vi.fn(() => () => {}),
  updateUserHighlight: vi.fn(async () => ({})),
}));

vi.mock('../../shared/CommunityFeed', () => ({
  default: () => <div data-testid="community-feed" />,
}));

describe('BibleStudy Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      const urlString = typeof url === 'string' ? url : (url?.url || '');
      const isBibles = urlString.includes('/api/bibles') || urlString.includes('rest.api.bible/v1/bibles');
      const response = {
        ok: true,
        json: async () => (
          isBibles
            ? { data: [{ id: 'KJV', name: 'KJV', abbreviation: 'KJV', language: { id: 'eng' }, audioBibles: [] }] }
            : { data: { content: [] } }
        ),
      };
      return {
        ...response,
        clone: () => response,
      };
    });
    window.scrollTo = vi.fn();
  });

  it('renders sign-in banner for guests', async () => {
    const BibleStudy = (await import('../../features/bible/BibleStudy.jsx')).default;

    render(
      <BibleStudy
        theme="light"
        book="Genesis"
        setBook={() => {}}
        chapter={1}
        setChapter={() => {}}
        onSearch={() => {}}
        onProfileClick={() => {}}
        historyStack={[]}
        onGoBack={() => {}}
      />
    );

    expect(await screen.findByRole('button', { name: /sign in/i })).toBeTruthy();
    expect(await screen.findByText(/old testament/i)).toBeTruthy();
  });
});
