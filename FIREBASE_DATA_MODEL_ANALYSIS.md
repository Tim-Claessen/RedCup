# Firebase Data Model Analysis & Recommendations

## Current Implementation vs. Desired Model

### ❌ Issues with Current Implementation

1. **Events stored as subcollection** - Makes analytics queries harder
2. **No user_id linking** - Using playerHandle (string) instead of user_id
3. **Missing Match_Participants structure** - Can't easily query "all games for a user"
4. **Full gameState snapshots** - Stored with every event (storage bloat)
5. **Event document ID** - Using auto-generated ID instead of eventId (harder to query)

### ✅ Your Desired Model (from README)

```
Users: user_id, handle
Matches: match_id, tournament_id, rules_config, started_at, ended_at, winning_side
Match_Participants: match_id, user_id, side, is_captain
Made_Shots: shot_id, match_id, user_id, cup_index, timestamp, is_redemption
```

## 🎯 Recommended Structure for Analytics

### Option 1: Flat Structure (Best for Analytics Queries)

```
matches/{matchId}
  - matchId
  - tournamentId (nullable)
  - rulesConfig: { cupCount: 6|10 }
  - startedAt: Timestamp
  - endedAt: Timestamp (nullable)
  - winningSide: 0|1 (or 'team1'|'team2')
  - participants: [
      { userId: string, side: 0|1, isCaptain: boolean }
    ]

made_shots/{shotId}  // Top-level collection (NOT subcollection!)
  - shotId (use eventId as document ID)
  - matchId
  - userId (not playerHandle!)
  - cupIndex (cupId)
  - timestamp
  - isBounce: boolean
  - isGrenade: boolean
  - isRedemption: boolean
  - isUndone: boolean
  - bounceGroupId (optional)
```

**Why flat?**
- ✅ Easy to query: "All shots by user X"
- ✅ Easy to query: "All shots in match Y"
- ✅ Easy to query: "All redemption shots"
- ✅ Better for analytics aggregations
- ✅ Can create composite indexes for common queries

### Option 2: Hybrid (Current + Optimizations)

Keep subcollection but add top-level indexes:

```
matches/{matchId}
  └── events/{eventId}  (current structure)

made_shots/{eventId}  // NEW: Denormalized for analytics
  - Same data as events, but top-level for easy querying
```

**Pros:** Maintains current structure, adds analytics layer
**Cons:** Data duplication, need to keep in sync

## 🔍 Analytics Query Examples

### What You'll Need to Query:

1. **Player Career Stats:**
   ```typescript
   // All shots by a user
   query(madeShotsRef, 
     where('userId', '==', userId),
     where('isUndone', '==', false)
   )
   ```

2. **Cup Isolation (Heatmaps):**
   ```typescript
   // All shots on cup 5 by user
   query(madeShotsRef,
     where('userId', '==', userId),
     where('cupIndex', '==', 5),
     where('isUndone', '==', false)
   )
   ```

3. **Efficiency (Speed):**
   ```typescript
   // Get match duration from matches collection
   // Calculate shots per minute from made_shots
   ```

4. **Clutch Factor:**
   ```typescript
   // Redemption shots
   query(madeShotsRef,
     where('userId', '==', userId),
     where('isRedemption', '==', true)
   )
   ```

5. **Bounce Shot Stats:**
   ```typescript
   query(madeShotsRef,
     where('userId', '==', userId),
     where('isBounce', '==', true)
   )
   ```

## 🚨 Critical Issues to Fix

### 1. Use `eventId` as Document ID
**Current:** Auto-generated document ID, eventId stored as field
**Better:** Use eventId as document ID

```typescript
// Instead of:
await addDoc(eventsRef, event);

// Do:
const eventRef = doc(eventsRef, event.eventId);
await setDoc(eventRef, event);
```

**Benefits:**
- Direct lookup: `doc(db, 'made_shots', eventId)`
- No query needed for updates
- Prevents duplicates

### 2. Store `userId` not `playerHandle`
**Current:** `playerHandle: string`
**Better:** `userId: string` (with handle lookup from Users collection)

**Why:**
- User can change handle, but userId stays constant
- Enables proper user-based analytics
- Links to Users collection

### 3. Add Match_Participants Structure
**Current:** Players stored as array in match document
**Better:** Separate participants subcollection or array with userId

```typescript
match_participants/{participantId}
  - matchId
  - userId
  - side: 0|1
  - isCaptain: boolean
```

**Or as array in match:**
```typescript
participants: [
  { userId: 'user123', side: 0, isCaptain: true },
  { userId: 'user456', side: 1, isCaptain: false }
]
```

### 4. Remove Full gameState from Events
**Current:** Every event stores full cup arrays
**Better:** Store only what's needed, calculate state from events

**Storage savings:** ~90% reduction per event
**Trade-off:** Need to replay events to reconstruct state (but you have all events anyway)

### 5. Use Top-Level Collection for Analytics
**Current:** `matches/{matchId}/events/{eventId}`
**Better:** `made_shots/{eventId}` (top-level)

**Why:**
- Firestore can't efficiently query across subcollections
- Analytics queries need to scan all shots, not just one match's shots
- Composite indexes work better on top-level collections

## 📊 Recommended Implementation

### Structure:

```
matches/{matchId}
  - matchId
  - tournamentId (nullable)
  - rulesConfig: { cupCount: 6|10, gameType: '1v1'|'2v2' }
  - participants: [
      { userId: string, side: 0|1, handle: string, isCaptain: boolean }
    ]
  - startedAt: Timestamp
  - endedAt: Timestamp (nullable)
  - winningSide: 0|1
  - completed: boolean

made_shots/{eventId}  // Top-level!
  - shotId (same as eventId, document ID)
  - matchId
  - userId
  - cupIndex (cupId)
  - timestamp
  - isBounce: boolean
  - isGrenade: boolean
  - isRedemption: boolean
  - isUndone: boolean
  - bounceGroupId (optional)
  - team1CupsRemaining: number
  - team2CupsRemaining: number
  // NO gameState - too large, can be reconstructed

users/{userId}
  - userId
  - handle
  - createdAt: Timestamp
```

## 🔥 Firestore Indexes Needed

For efficient analytics queries, create these composite indexes:

1. **User shots (for career stats):**
   - Collection: `made_shots`
   - Fields: `userId` (Ascending), `timestamp` (Descending), `isUndone` (Ascending)

2. **User cup isolation:**
   - Collection: `made_shots`
   - Fields: `userId` (Ascending), `cupIndex` (Ascending), `isUndone` (Ascending)

3. **Match shots:**
   - Collection: `made_shots`
   - Fields: `matchId` (Ascending), `timestamp` (Ascending)

4. **Redemption shots:**
   - Collection: `made_shots`
   - Fields: `userId` (Ascending), `isRedemption` (Ascending), `isUndone` (Ascending)

## 💡 Migration Strategy

1. **Phase 1:** Keep current structure, add top-level `made_shots` collection
2. **Phase 2:** Write to both (dual-write)
3. **Phase 3:** Update queries to use `made_shots`
4. **Phase 4:** Remove events subcollection (or keep for replay)

## 🎯 Next Steps

1. Refactor to use `eventId` as document ID
2. Create top-level `made_shots` collection
3. Add `userId` field (requires user auth first)
4. Remove `gameState` from events (or make optional)
5. Add `isRedemption` field (currently missing)
6. Create Firestore composite indexes
7. Update match structure to match desired model
