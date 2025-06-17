# Kanban Rules - Event-Driven Architecture Edition

## Part 1: Universal Rules (All Projects)

### 🚧 Core Architecture Principles

**The Golden Rule:** If it works correctly but doesn't feel good to use, it's not done.

**Integration Philosophy:** Build incrementally, integrate continuously. "Big bang" integration hides contract mismatches until it's expensive to fix.

**Forbidden Patterns** (Instant Rollback):
- ❌ Files ending in: `*Manager.js`, `*Controller.js`, `*Coordinator.js`, `*Integration.js`
- ❌ Classes that orchestrate multiple systems
- ❌ Direct coupling between systems
- ❌ Side effects in pure functions

**Required Patterns**:
- ✅ **Event-driven** - All systems communicate via EventBus only
- ✅ **Pure functions** - Return new state, no mutations
- ✅ **Single responsibility** - Each module does ONE thing
- ✅ **Resilient systems** - Work in any initialization order

### 🧠 Mental Model

**Ask This:** "What events make this system work?"  
**Not This:** "How do I connect X to Y?"

**Red Flag Thoughts:**
- "I'll create a small example..." → Write a test instead
- "This helper manages..." → Use events only
- "Just temporary scaffolding..." → No exceptions
- "I get the gist..." → Post quotes to prove it
- "The fix is obvious..." → Follow the process anyway

**Guard Rail:** Can't explain current behavior in detail? You haven't read enough.

### 📋 Card Format Standard

**Task ID Format:** `[AREA]-[NUMBER]`: [Title] **[Category]** [emoji]

**Card file name:** `[EXECUTION-ORDER]-[AREA]-[NUMBER].md`

**Standard Areas:**
- **FOUNDATION** - Infrastructure, build system, tooling
- **CORE** - Business logic, domain models, algorithms
- **ENGINE** - Core processing systems, runtime
- **SYSTEMS** - Data management, integrations, services
- **UI** - User interface, presentation layer
- **FEATURES** - User-facing functionality
- **TESTING** - Quality assurance, validation
- **POLISH** - Performance, accessibility, UX
- **DEPLOYMENT** - Release, distribution, operations

**Categories & Colors:**
- 🟣 **Infrastructure** - Foundation systems
- 🔵 **Core Logic** - Business/domain logic  
- 🟢 **Processing** - Core engines/runtime
- 🟡 **Interface** - UI/API layer
- 🟠 **Feature** - User functionality
- 🔴 **Bug** - Fixes and issues
- ⚪ **Polish** - Optimization/UX
- 🟤 **Deployment** - Production/ops

**Card Template:**
```markdown
- [ ] **[AREA]-[NUM]**: Title **[Category]** 🔴<br/>**Description:** Clear goal in 1-2 sentences<br/>**Context:** Why needed, what it replaces<br/><br/>**📖 Required Reading (COMPLETE, NO SKIMMING)**<br/>• `tests/feature.test.js` - intended behavior<br/>• `src/System.js` - current implementation<br/>• `event-types.js` - exact event names<br/><br/>**🛡️ Guard Rail Checklist (BEFORE CODING):**<br/>• [ ] Posted 3 quotes from each file<br/>• [ ] Listed all methods/events found<br/>• [ ] Ran ice cubes test and posted output<br/>• [ ] Written behavior summary<br/><br/>**🔗 Integration Strategy**<br/>**Emits:** EventTypes.SPECIFIC_EVENT when [condition]<br/>**Listens:** EventTypes.OTHER_EVENT to [action]<br/>**Dependencies:** [pure modules only]<br/><br/>**Acceptance Criteria:**<br/>• [ ] Core functionality works<br/>• [ ] No coordinator patterns<br/>• [ ] Events documented/tested<br/>• [ ] Feels good to use<br/><br/>**Key Files:** src/example.js<br/>**Effort:** S/M/L | **Risk:** Low/Med/High
```

### 🎯 Scope Control & YAGNI Enforcement

**Card Description Must Include:**
1. **What TO build** - Explicit features/behaviors
2. **What NOT to build** - Explicit exclusions
3. **Reference implementation** - Point to existing patterns
4. **Complexity target** - "As simple as GridLogic" or specific LOC target

**Example:**
```markdown
**Description:** Create Tile visual class for displaying letters
**Build:** Rectangle background, letter text, type-based colors
**DON'T Build:** Animations, state management, health bars, particle effects
**Reference:** See GridLogic for simplicity target (~50 LOC)
**Complexity:** Maximum 100 LOC including comments
```

**YAGNI Violations (Instant Rollback):**
- Adding features "for later"
- Building abstractions without current need
- Implementing unused event handlers
- Creating configuration for non-existent features

### 📏 Definition of Done Requirements

**Every card MUST specify:**
1. **Functional requirements** - What works when done
2. **Non-functional requirements** - Performance, size, quality
3. **Integration verification** - How to test it works with system
4. **Excluded scope** - What is explicitly NOT part of this card

**Template Addition:**
```markdown
**Definition of Done:**<br/>• [ ] [Specific behavior 1]<br/>• [ ] [Specific behavior 2]<br/>• [ ] No more than X lines of code<br/>• [ ] Integrates via these specific events<br/>• [ ] Does NOT include [excluded feature]
```

### 🚫 Vagueness Prevention

**Banned Phrases in Cards:**
- "with effects" (specify WHICH effects)
- "handle states" (specify WHICH states and HOW)
- "proper [anything]" (define "proper")
- "support for" (list EXACT features)
- "various", "multiple", "different" (be SPECIFIC)

**Required Specificity:**
- Effects → "red tint on damage, scale 1.1 on select"
- States → "changes color: normal=#2a2a2a, selected=#0066ff"
- Support → "accepts type property with values: normal, bomb, ice"

### 🔍 Complexity Guidelines

**Visual/UI Components:**
- Default to MINIMAL implementation
- Start with basic shapes and text
- Add effects ONLY if card explicitly requires
- Reference TDD examples for complexity level

**Complexity Levels:**
1. **Minimal (default)**: <50 LOC, basic functionality only
2. **Simple**: <100 LOC, core features only  
3. **Standard**: <200 LOC, includes required polish
4. **Complex**: >200 LOC, needs justification

**Red Flags:**
- Tile class > 100 LOC
- Scene > 300 LOC  
- Any visual component with state machine
- Visual layer with business logic

⚠️ **Remember:** This entire card must be ONE LINE in your .md file!

### 🔌 Integration Process

**INVESTIGATE BEFORE INTEGRATE:**

1. **Event Audit** - Post this table:
   ```markdown
   | Event Name | Emitted By | Data Shape | Consumed By |
   |------------|------------|------------|-------------|
   | SCORE_CHANGED | ScoreSystem | {value: number} | UIManager |
   ```

2. **Data Contract Validation** - Run and post output:
   ```javascript
   // integration-test.html (MUST CREATE)
   system1.init();
   eventBus.on('*', (event, data) => {
     console.log(`EVENT: ${event}`);
     console.log(`DATA:`, JSON.stringify(data, null, 2));
   });
   system1.triggerAction();
   // PASTE ACTUAL CONSOLE OUTPUT BELOW:
   // [output goes here]
   ```

3. **Mismatch Report** - Before ANY code:
   ```
   EXPECTED: {score: 100, delta: 10}
   ACTUAL: {value: 100, change: 10}
   MISMATCH: Different property names
   FIX LOCATION: ScoreSystem (not adapter!)
   ```

⚠️ **The "Ice Cubes vs Water" Problem:**
- Event names match ✓ 
- Data shapes mismatch ✗
- Solution: Fix at source, no adapters!

### 📸 Evidence Requirements by Card Type

**Bug Fix Cards - Must Post:**
```markdown
## Reading Evidence
- Test expectation: "expect(grid.tiles).toEqual([])"  
- Current implementation: "this.tiles = null; // clearing"
- Event flow: "LEVEL_COMPLETE → clearTiles() → sets null"

## Root Cause
"Test expects empty array, code returns null"
```

**Integration Cards - Must Post:**
```markdown
## System A Output (from ice cubes test)
EVENT: USER_SCORED
DATA: {"points": 100, "timestamp": 1234}

## System B Expectation (from reading listener)
Expects: {"score": 100, "time": 1234}

## Mismatch Found
Property names don't match (points vs score)
```

**Feature Cards - Must Post:**
```markdown
## Spec Summary (your words)
"Combo multiplier shows current combo and pulses on increase"

## Similar Feature Analysis  
"ScoreDisplay listens to SCORE_CHANGED and updates DOM"

## Event Design
Will listen to: COMBO_CHANGED {value: number, delta: number}
Will emit: none (display only)
```

**No Evidence = No Code. Period.**

⚠️ **For Kanban Cards:** Convert all line breaks to `<br/>` tags!

**Integration Checklist:**
```markdown
| Step | System | Action | Emits | Data Contract | Verified |
|------|--------|--------|-------|---------------|----------|
| 1    | Game   | start  | START | {level: num} | [ ]      |
| 2    | Grid   | init   | READY | {tiles: [][]}| [ ]      |
```

**Data Contract Validation Code:**
```javascript
// ALWAYS test data shapes before full integration
eventBus.on('GRID_READY', (data) => {
  assert(Array.isArray(data.tiles), 'tiles must be array');
  assert(data.tiles[0][0].hasOwnProperty('value'), 'missing value');
});
```

**NEVER GUESS:**
- ✅ `grep` for event names
- ✅ Read actual modules (not skim!)
- ✅ Test assumptions
- ❌ "Probably exists"
- ❌ "Should work like..."
- ❌ "Usually these systems..."

### 📏 Card Guidelines

**Card Sizing:**
- **S (Small):** 1-4 hours focused work
- **M (Medium):** 4-8 hours (preferred maximum)
- **L (Large):** 1-2 days (consider breaking down)
- Group related trivial tasks into meaningful units
- Aim for 10-20 cards per feature area

**Work in Progress (WIP) Limits:** 
- Maximum 2 cards per person in "In Progress"
- Complete cards before starting new ones
- Daily review to identify blockers

**Definition of Done:**
- [ ] Feature works as specified
- [ ] No console errors
- [ ] No coordinator patterns introduced
- [ ] Tested on required devices
- [ ] Performance targets met
- [ ] Feels good to use
- [ ] Merged to main branch

### 🚨 Guard Rail Enforcement

**If evidence not posted:**
1. **Card auto-rejected** - Moves back to TODO
2. **Code review fails** - "Where's your ice cubes test output?"
3. **Integration breaks** - Because you didn't catch mismatches

**Common AI Escape Attempts (ALL BLOCKED):**
- ❌ "I read the files" → Show quotes or it didn't happen
- ❌ "The test is obvious" → Post the output anyway
- ❌ "This is a simple fix" → Follow the process
- ❌ "I'll document after" → Evidence first, code second

**The Formula:** No evidence = No code = No merge

### 🏗️ Integration Strategy: Always Incremental

**Why Incremental Beats Big Bang:**
- **Incremental**: Build → Test Contract → Build Next
  - Early mismatch discovery (cheap fixes)
  - Natural pressure against coordinators
  - Easier debugging (fewer variables)
- **Big Bang**: Build All → Integrate → Debug Everything
  - Late discoveries (expensive fixes)
  - Coordinator temptation ("just add glue")
  - Cascade failures multiply

**The Math:** Setup cost < Debugging cost

**Risk Mitigation:**
- Version events during development
- Stub realistic data/load
- Test contracts continuously

### 🐛 Bug-Solving Protocol

> **Critical:** Most coordination anti-patterns come from fixing symptoms instead of root causes. This protocol prevents that.

**Phase 1: Root Cause Analysis (MANDATORY)**
1. **Post 3 quotes from test file** - Show what you read
2. **List all methods in module** - Prove you read it
3. **Document ACTUAL vs EXPECTED** - Be specific:
   ```
   EXPECTED: grid.tiles = []
   ACTUAL: grid.tiles = null
   ROOT CAUSE: clearTiles() sets null, test expects array
   ```
4. **Run ice cubes test** - Post console output
5. **Write root cause statement** - One paragraph

⚠️ **STOP HERE** - Manager must approve root cause before coding!

**Anti-Skip Mechanism:** Card moves back to "TODO" if no evidence posted

⚠️ **STOP HERE** - No coding until root cause is documented!

**Phase 2: Solution Design**
- Will the fix require coordination? → Redesign
- Can existing events handle it? → Use them
- Need new events? → Document contract first

**Phase 3: Implementation**
- Write test for root cause first
- Fix with minimal change
- Verify no new anti-patterns

**Common Patterns & Fixes:**
- **Silent failure** → Add event logging
- **Race condition** → Make order-independent  
- **State corruption** → Check mutations
- **Performance drop** → Batch/throttle events
- **"Needs coordinator"** → Wrong! Fix event contracts

**Fix Requirements:**
- [ ] Root cause documented
- [ ] Solution doesn't add coordination
- [ ] Test prevents regression
- [ ] Performance maintained

### 🧪 Testing Strategy

**Three Layers:**
1. **Unit** - Pure functions in isolation
2. **Integration** - Event flows between systems
3. **E2E** - User experience validation

**Event Testing Pattern:**
```javascript
// Test systems via events, not direct calls
eventBus.emit('USER_INPUT', { key: 'A' });
expect(eventBus.emit).toHaveBeenCalledWith('LETTER_SELECTED', { letter: 'A' });
```

**Device Testing Requirements:**
- **Primary:** Define based on user base
- **Secondary:** Extended device support
- **Performance:** Meet defined targets
- **Validation:** All input methods work correctly

### 📏 Card Guidelines

**Card Sizing:**
- Group related trivial tasks into meaningful units
- Aim for 10-20 cards per feature area
- Each card delivers recognizable value

**WIP Limits:** Max 2 cards "In Progress" per person

**Daily Checks:**
- [ ] No new coordinator files created
- [ ] All connections use events
- [ ] Performance targets met

## Part 2: Project-Specific Rules

Create a simple document answering these questions:

### 📝 What to Document

1. **Event/API Contracts** - Exact names and data shapes
   ```javascript
   // Example: EVENT_NAME = 'eventName'
   // Data: { field: type }
   ```

2. **System Architecture** - Who owns what
   ```
   System A → emits → EVENT_X
   System B → listens → EVENT_X
   ```

3. **Performance Targets** - Your specific requirements
   - Response time: ___
   - Frame rate: ___
   - Memory limit: ___

4. **Learned Anti-Patterns** - What went wrong before
   - "Don't do X because Y happened"

**That's it.** One page max. Update as you learn.

---

## Kanban Viewer Formatting Rules

**Your kanban file structure (.md files):**
```
---
kanban-plugin: board
---

## Cards
- [ ] Card content here

%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false]}
```
%%
```

**Card Formatting Requirements:**
1. **Each card = single `- [ ]` item** (entire card on one line)
2. **Use `<br/>` for line breaks** inside cards (NOT real line breaks)
3. **NO headers (`##`) inside cards** - use `**Bold Text:**` instead
4. **NO code blocks** with triple backticks inside cards
5. **NO multiple list items** per card

**Example Conversion:**

In this rules document (readable):
```markdown
**Description:** Fix grid clearing bug
**Context:** Grid shows ghost tiles

**Guard Rail Checklist:**
- [ ] Posted quotes from test file
- [ ] Listed all Grid methods
```

In .md files (single line):
```markdown
- [ ] **BUG-042**: Fix grid clearing **Bug** 🔴<br/>**Description:** Fix grid clearing bug<br/>**Context:** Grid shows ghost tiles<br/><br/>**Guard Rail Checklist:**<br/>• [ ] Posted quotes from test file<br/>• [ ] Listed all Grid methods
```

---

## Quick Reference

**Kanban Card Formatting:**
- One card = one `- [ ]` line (no matter how long!)
- Line breaks = `<br/>` tags only
- Bold text instead of headers
- No code blocks inside cards

**Before Writing Any Code - Evidence Required:**
1. Post 3 quotes from each required file
2. List all methods/events found
3. Post ice cubes test output
4. Write current behavior summary

**Guard Rail Checklist:**
- [ ] Reading evidence posted
- [ ] Event audit table filled
- [ ] Ice cubes output included
- [ ] Root cause documented
- [ ] Mismatch report (if any)

**If Tempted to Skip:**
- Remember: No evidence = Card rejected
- Time saved skipping < Time wasted debugging
- Your "obvious" fix probably isn't

**When Stuck:**
- Check posted evidence (did you miss something?)
- Re-run ice cubes test with more logging
- Read one more related file
- Test in isolation first