# Testing Documentation

Testing setup and guidelines for the RedCup application.

## Quick Start

```bash
npm test    # Run all tests
```

## Test Structure

```
__tests__/
└── unit/          # Unit tests
    ├── hooks/     # Hook tests (useCupManagement, etc.)
    ├── types/     # Data structure tests (GameEvent, etc.)
    └── utils/     # Utility function tests (cupAdjacency, etc.)
```

## Configuration

- `jest.config.js` - Jest configuration with TypeScript support
- `jest.setup.js` - Test environment setup

## Test Environment

Tests run in a Node.js environment using Jest with TypeScript support via `ts-jest`. The configuration supports both `.js` and `.ts` test files.

## Test Naming Convention

Test files follow the naming pattern from `TEST_REGISTRY.md`:
- Format: `AUTO-{STAGE}-{TYPE}-{NUM}.test.ts`
- Examples:
  - `AUTO-GAME-UT-01.test.ts` - Bounce shot grouping
  - `AUTO-GAME-UT-02.test.ts` - Grenade shot adjacency detection
  - `AUTO-DATA-UT-05.test.ts` - Bounce group ID linking

## Writing Tests

Create test files in the appropriate directory under `__tests__/unit/` matching the source structure:
- `hooks/` for testing React hooks
- `types/` for testing data structures and type logic
- `utils/` for testing utility functions

Test files should be TypeScript (`.test.ts`) and import actual source code:

```typescript
import { getTouchingCups } from '../../../src/utils/cupAdjacency';

describe('Feature Name', () => {
  it('should perform expected behavior', () => {
    expect(actualValue).toBe(expectedValue);
  });
});
```

## Test Coverage

See `TEST_REGISTRY.md` for a detailed registry of all tests in the codebase, including test IDs, criticality, and status.

## Running Tests

- Run all tests: `npm test`
- Run in watch mode: `npm test -- --watch`
- Run with coverage: `npm test -- --coverage`
- Run with verbose output: `npm test -- --verbose`
