# AI Off-Track Risk Detection Guide

## Quick Reference: Red Flags to Watch For

### 🔍 Risk 1: Subtle Misinterpretation (5% likelihood)
**What happens:** AI correctly quotes the code but misunderstands the intent.

**Red flags to spot:**
```javascript
// ❌ AI adds validation logic when specs just say "handle"
handleUserInput(input) {
  if (!this.validateInput(input)) return; // <- Assumed this was needed
  eventBus.emit('INPUT_RECEIVED', input);
}

// ✅ What was actually wanted
handleUserInput(input) {
  eventBus.emit('INPUT_RECEIVED', input);
}
```

**Review questions:**
- Did AI add steps not in the tests?
- Are there assumptions beyond the quoted evidence?
- Does the implementation do MORE than required?

**Quick check:** Compare test expectations to implementation - any extra logic?

---

### 🏗️ Risk 2: Over-Engineering Within Constraints (5% likelihood)
**What happens:** AI follows all rules but creates unnecessarily complex solutions.

**Red flags to spot:**
```javascript
// ❌ Technically event-driven but overengineered
class TileSelector {
  constructor() {
    eventBus.on('PRE_SELECT_TILE', this.validateSelection);
    eventBus.on('CONFIRM_SELECTION', this.processSelection);
    eventBus.on('POST_SELECT_TILE', this.updateUI);
  }
}

// ✅ Simpler and still correct
eventBus.on('TILE_CLICKED', (data) => {
  if (isValidTile(data)) {
    eventBus.emit('TILE_SELECTED', data);
  }
});
```

**Review questions:**
- Could this be done with fewer events?
- Are there intermediate steps that add no value?
- Would a junior dev understand this immediately?

**Quick check:** Count the events/methods - is it proportional to the feature complexity?

---

### 🕳️ Risk 3: Edge Case Blindness (3% likelihood)
**What happens:** AI implements happy path perfectly but misses edge cases.

**Red flags to spot:**
```javascript
// ❌ Doesn't handle null/undefined
processScore(scoreData) {
  const multiplier = scoreData.combo * scoreData.bonus;
  return baseScore * multiplier;
}

// ✅ Defensive programming
processScore(scoreData) {
  if (!scoreData) return baseScore;
  const multiplier = (scoreData.combo || 1) * (scoreData.bonus || 1);
  return baseScore * multiplier;
}
```

**Common missed edge cases:**
- Null/undefined values
- Empty arrays/objects
- Race conditions (event A arrives before B)
- Performance with large data sets
- Memory leaks from event listeners

**Quick check:** Look for defensive programming - any assumptions about data shape?

---

### 📦 Risk 4: Context Window Limitations (2% likelihood)
**What happens:** AI forgets patterns/conventions from earlier in the codebase.

**Red flags to spot:**
```javascript
// ❌ File A established this pattern:
EventTypes.GRID_UPDATED = 'grid:updated';

// But in File Z, AI does:
eventBus.emit('GRID_UPDATED', data); // Wrong - should be 'grid:updated'
```

**Review questions:**
- Does this match naming conventions from other files?
- Are the same patterns used consistently?
- Did AI reference the event constants file?

**Quick check:** Grep for similar features - does this match their patterns?

---

## 🚨 Universal Warning Signs

### 1. **The "Just In Case" Pattern**
```javascript
// 🚩 Red flag comments:
"// Just in case we need this later"
"// Might be useful for future features"
"// Adding this for flexibility"
```

### 2. **The "I Think This Is What They Want" Pattern**
- Implementation has features not in tests
- Adds "helpful" extras not requested
- Makes assumptions about user needs

### 3. **The "Kitchen Sink" Pattern**
- Every possible event is handled
- Every edge case has special handling
- Code tries to be "future-proof"

---

## ✅ Quick Review Checklist

Before approving any AI-generated code:

1. **Evidence Check**
   - [ ] All required quotes posted?
   - [ ] Ice cubes test output shown?
   - [ ] Event audit table filled?

2. **Complexity Check**
   - [ ] Solution complexity matches problem complexity?
   - [ ] Could a simpler approach work?
   - [ ] Any "clever" code that's hard to follow?

3. **Assumption Check**
   - [ ] Any logic beyond test requirements?
   - [ ] Any "helpful" additions?
   - [ ] Any defensive programming for unspecified cases?

4. **Pattern Check**
   - [ ] Matches existing codebase patterns?
   - [ ] Uses defined event constants?
   - [ ] Follows naming conventions?

5. **The Gut Check**
   - [ ] Does this feel right?
   - [ ] Would you write it this way?
   - [ ] Easy to understand and modify?

---

## 🎯 Pro Tips for Catching Issues Early

1. **Read the tests first** - They define the actual requirements
2. **Check the simplest solution** - Would that work? Why is this more complex?
3. **Look for code comments** - They often reveal uncertainty
4. **Count the concepts** - More concepts = more complexity = more risk
5. **Trust your instincts** - If it feels overengineered, it probably is

---

## 🔧 When You Spot an Issue

1. **Don't fix it yourself** - Send it back with specific feedback
2. **Reference this guide** - "This looks like Risk #2: Over-engineering"
3. **Suggest the simpler approach** - Show what you expected
4. **Require new evidence** - Make AI re-prove understanding

Remember: The goal isn't perfection, it's catching issues before they compound. Your kanban rules make these issues visible early when they're cheap to fix!