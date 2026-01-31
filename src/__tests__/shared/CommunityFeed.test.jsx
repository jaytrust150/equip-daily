import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../shared/MemberCard', () => ({
  default: ({ thought }) => <div data-testid="member-card">{thought}</div>,
}));

vi.mock('../../services/firestoreService', () => ({
  subscribeToReflections: vi.fn((field, value, callback) => {
    callback([]);
    return () => {};
  }),
  saveReflection: vi.fn(async () => ({})),
  deleteReflection: vi.fn(async () => ({})),
  toggleFruitReaction: vi.fn(async () => ({})),
}));

describe('CommunityFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default title with city name', async () => {
    const CommunityFeed = (await import('../../shared/CommunityFeed.jsx')).default;

    render(
      <CommunityFeed
        queryField="chapter"
        queryValue="Genesis 1"
        user={null}
        theme="light"
        onSearch={() => {}}
        onProfileClick={() => {}}
      />
    );

    expect(screen.getByText(/Sebastian Body Directory/i)).toBeTruthy();
  });

  it('shows input when user is provided', async () => {
    const CommunityFeed = (await import('../../shared/CommunityFeed.jsx')).default;

    render(
      <CommunityFeed
        queryField="chapter"
        queryValue="Genesis 1"
        user={{ uid: 'user1', displayName: 'Test User', photoURL: '' }}
        theme="light"
        onSearch={() => {}}
        onProfileClick={() => {}}
      />
    );

    expect(screen.getByPlaceholderText(/share with the body/i)).toBeTruthy();
  });
});
