# Testing Documentation

**Author:** Jonathan Vargas — Sebastian, Florida

---

## Overview

The equip-daily application includes a comprehensive automated testing suite using Vitest and React Testing Library.

## Testing Stack

### Technologies

| Tool | Purpose | Version |
|------|---------|---------|
| **Vitest** | Unit & component testing framework | ^1.0.0 |
| **@testing-library/react** | React component testing utilities | ^14.0.0 |
| **jsdom** | DOM simulation environment | ^24.0.0 |
| **@vitest/ui** | Visual test runner interface | ^1.0.0 |

## Running Tests

### Commands

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests with UI dashboard
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Test Files Location

All tests are located in `src/__tests__/`:
```
src/__tests__/
├── setup.js                          # Global test configuration
├── services/
│   └── firestoreService.test.js      # Firestore operations tests
├── hooks/
│   └── useAudio.test.js              # Audio hook tests
└── shared/
    └── AudioPlayer.test.js           # Component tests
```

## Test Structure

### Setup (src/__tests__/setup.js)

Configures the test environment with:
- DOM testing library setup
- Firebase mocks (auth, firestore, analytics)
- React Firebase Hooks mocks
- Sentry mocks
- Global utilities (matchMedia)
- Environment variables

### Firestore Service Tests

**File:** `src/__tests__/services/firestoreService.test.js`

**Coverage:**
- ✅ Create user reflections
- ✅ Read/fetch reflections
- ✅ Update reflections
- ✅ Delete reflections
- ✅ User data management
- ✅ Reaction handling (like/emoji)
- ✅ Community reflections
- ✅ Error handling
- ✅ Data validation

**Example Test:**
```javascript
it('should create a user reflection', async () => {
  const reflectionData = {
    verse: 'John 3:16',
    thought: 'For God so loved the world...',
  }

  const result = await createUserReflection(userId, reflectionData)
  expect(result).toBeDefined()
})
```

### useAudio Hook Tests

**File:** `src/__tests__/hooks/useAudio.test.js`

**Coverage:**
- ✅ Initialization with default state
- ✅ Play/pause functionality
- ✅ Sleep timer (15/30/60 min)
- ✅ Volume control (0-1 range)
- ✅ Duration and progress tracking
- ✅ Seeking functionality
- ✅ State transitions
- ✅ Cleanup on unmount
- ✅ Error handling

**Example Test:**
```javascript
it('should set sleep timer to 15 minutes', async () => {
  const { result } = renderHook(() => useAudio(audioUrl))

  act(() => {
    result.current.setSleepTimer(15)
  })

  expect(result.current.sleepTimer).toBe(15)
})
```

### Component Tests

**File:** `src/__tests__/shared/AudioPlayer.test.js`

**Coverage:**
- ✅ Rendering
- ✅ Play/pause interactions
- ✅ Volume control
- ✅ Sleep timer UI
- ✅ Progress bar
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Edge cases (empty/undefined props)
- ✅ Props handling

**Example Test:**
```javascript
it('should render audio player', () => {
  render(<AudioPlayer url={audioUrl} />)
  expect(screen.getByRole('region')).toBeInTheDocument()
})
```

## Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 70% | Tracking |
| Functions | 70% | Tracking |
| Branches | 70% | Tracking |
| Statements | 70% | Tracking |

View coverage report:
```bash
npm run test:coverage
# Report generated in coverage/ directory
# Open coverage/index.html in browser
```

## Writing Tests

### Test Template

```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Component/Function Name', () => {
  let mockData

  beforeEach(() => {
    // Setup before each test
    mockData = { /* ... */ }
  })

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const input = mockData

      // Act
      const result = performAction(input)

      // Assert
      expect(result).toBe(expectedValue)
    })
  })
})
```

### Best Practices

1. **Test behavior, not implementation**
   ```javascript
   // ✅ Good - tests the behavior
   it('should disable save button when form is invalid', () => {
     // ...
   })

   // ❌ Bad - tests internal state
   it('should set isValid to false', () => {
     // ...
   })
   ```

2. **Use descriptive test names**
   ```javascript
   // ✅ Good
   it('should add reaction to reflection when user clicks like button', () => {})

   // ❌ Bad
   it('should work', () => {})
   ```

3. **Follow AAA pattern (Arrange, Act, Assert)**
   ```javascript
   it('should create user reflection', () => {
     // Arrange
     const userData = { verse: 'John 3:16', thought: 'Test' }

     // Act
     const result = createUserReflection(userId, userData)

     // Assert
     expect(result).toBeDefined()
   })
   ```

4. **Mock external dependencies**
   ```javascript
   // Firebase is mocked in setup.js
   // Use vi.mock() for additional mocks
   vi.mock('./api', () => ({
     fetchBible: vi.fn()
   }))
   ```

5. **Test error cases**
   ```javascript
   it('should handle database errors gracefully', async () => {
     // Arrange
     vi.mocked(db).rejects(new Error('Connection failed'))

     // Act
     const result = await getUserData(userId)

     // Assert
     expect(result).toBeUndefined() // or appropriate error handling
   })
   ```

## Mocking

### Firebase Mocks

All Firebase operations are mocked in `src/__tests__/setup.js`:

```javascript
// Mock already configured for:
- Authentication (getAuth, onAuthStateChanged, signIn, signOut)
- Firestore (collection, query, setDoc, updateDoc, deleteDoc)
- Analytics (getAnalytics, logEvent)
- Realtime Database (if used)
```

### Creating Additional Mocks

```javascript
import { vi } from 'vitest'

// Mock a module
vi.mock('./services/bibleApi', () => ({
  searchBible: vi.fn(() => Promise.resolve([]))
}))

// Mock a function
const mockFetch = vi.fn(() => Promise.resolve({
  json: () => Promise.resolve({ data: [] })
}))
```

## Debugging Tests

### View Tests in UI

```bash
npm run test:ui
# Opens browser-based test dashboard at http://localhost:51204/__vitest__/
```

### Debug Single Test

```bash
npm test -- path/to/test.js
```

### Add Debug Output

```javascript
import { debug } from '@testing-library/react'

it('should work', () => {
  const { container } = render(<Component />)
  debug(container) // Prints DOM to console
})
```

### Use Debugger

```javascript
it('should work', () => {
  debugger // Breakpoint for node --inspect
  // ...
})

# Then run:
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

## CI/CD Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

### Run Before Commit

Use Husky to run tests:

```bash
# Install Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:run"
```

## Common Issues

### Tests Timeout

If tests timeout:
```javascript
// Increase timeout for specific test
it('should fetch data', async () => {
  // ...
}, 20000) // 20 second timeout

// Or in vitest.config.js
test: {
  testTimeout: 20000
}
```

### Firebase Mock Issues

If Firebase isn't mocking properly:
1. Ensure `src/__tests__/setup.js` is in setupFiles
2. Check vitest.config.js includes setup file
3. Verify mock syntax matches Firebase API

### Component Not Rendering

```javascript
// Make sure to wrap state updates in act()
act(() => {
  fireEvent.click(button)
})

// Use waitFor for async updates
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

## Performance

### Test Speed

- Average: 50-100ms per test
- Total suite: ~5-10 seconds
- Vitest is much faster than Jest (5-10x)

### Optimize Slow Tests

1. Reduce setup complexity
2. Use shallow renders for component testing
3. Mock expensive operations (network, timers)
4. Use `beforeAll` for shared expensive setup

## Expanding Test Coverage

### High Priority (ROI)

1. **API endpoints** - test bible-chapter.js, bible-search.js
2. **ControlBar component** - navigation logic
3. **CommunityFeed component** - reflection display and interactions
4. **User authentication flow** - sign in/out lifecycle

### Medium Priority

1. **Devotional loading** - file parsing and display
2. **Search functionality** - filtering and sorting
3. **Error boundaries** - crash handling

### Future Enhancements

- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarks
- [ ] Integration tests with real Firebase (staging)

---

## Support

For testing help:
1. Check Vitest docs: https://vitest.dev/
2. Check Testing Library: https://testing-library.com/react
3. Review existing test files for patterns
4. Ask team for pair programming on complex tests
