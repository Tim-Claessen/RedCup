# Coding Standards & Best Practices

Reference guide for Red Cup codebase standards.

## Comments

**Rule: Explain WHY, not WHAT.**

### ❌ Remove (Obvious Comments)
```typescript
// Set the value
setValue(x);

// Loop through items
items.forEach(...);

// Get the cup
const cup = cups.find(...);
```

### ✅ Keep (Helpful Comments)
```typescript
// Victory: last cup OR bounce on second-to-last (game rule)
// Teams can only sink opponent's cups (business logic)
// Uses soft-delete to preserve analytics history (design decision)
// Polyfill required for React Native (workaround)
```

**Keep comments that explain:**
- Business rules
- Design decisions
- Workarounds
- Complex algorithms
- Non-obvious behavior

## TypeScript

- **No `any` types** - Use proper types or `unknown` with type guards
- **Explicit return types** - Add where TypeScript can't infer (complex functions)
- **No type assertions (`as`)** - Use type guards or fix type definitions

## Imports

Group in this order:
1. External packages (React, React Native, third-party)
2. Services (firebase, firestoreService)
3. Types (game, navigation)
4. Components
5. Constants/Theme

## Components

- **Pick ONE pattern**: `React.FC<Props>` OR regular functions → apply consistently
- **Props interfaces**: Always `ComponentNameProps`
- **Event handlers**: Prefix with `handle` (e.g., `handleCupPress`)

## File Structure

Within each file, organize in this order:
1. Imports
2. Types/interfaces
3. Constants
4. Component/hook
5. Helper functions
6. Styles (if component)
7. Export

## Function Order (within components/hooks)

1. State/hook declarations
2. useEffect hooks
3. Event handlers
4. Helper functions
5. Render/return

## Naming Conventions

### Variables/Functions (camelCase)
- **Booleans**: `isVisible`, `hasPlayers`, `canStartGame`, `shouldUpdate`
- **Arrays**: plural nouns → `players`, `cups`, `events` (not `playerList`)
- **Functions**: verb phrases → `getCupPositions`, `handleSinkCup`, `updatePlayer`

### Types/Interfaces (PascalCase)
- Props interfaces: `ComponentNameProps`
- Types: `GameEvent`, `Cup`, `Player`
- Use `type` for unions/aliases, `interface` for object shapes

### Constants
- `UPPER_SNAKE_CASE` for true constants (never change)
- `camelCase` for config objects

## React Best Practices

- **Memoization**: Add `React.memo`/`useCallback`/`useMemo` where beneficial
- **useEffect**: Fix dependency arrays, add cleanup functions when needed
- **Error handling**: Wrap async operations in try-catch
- **Remove debug code**: Delete `console.log` (keep `console.error`/`console.warn`)

## Code Quality

- **DRY**: Extract repeated logic
- **Early returns**: Reduce nesting
- **Guard clauses**: `if (!value) return` instead of nested ifs
- **Remove**: Commented-out code, unused imports, trailing blank lines

