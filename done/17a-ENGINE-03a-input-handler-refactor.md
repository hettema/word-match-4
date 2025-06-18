- [ ] **ENGINE-03a**: InputHandler Refactor 🟡
**Description:** Refactor InputHandler to remove word building logic (moved to SelectionAdapter)
**Context:** Architectural improvement to separate concerns - InputHandler should only track selection

**Prerequisites:** 
- SelectionAdapter complete and working (SYSTEMS-06)
- Word validation confirmed working with real letters

**🛡️ Guard Rail Checklist (BEFORE CODING):**
• [ ] Verify SelectionAdapter is handling word submission
• [ ] Check all components listening to WORD_SUBMITTED
• [ ] Review InputHandler tests that need updating
• [ ] Confirm this won't break word validation

**🔗 Integration Strategy**
**Emits:** EventTypes.SELECTION_COMPLETE (instead of WORD_SUBMITTED)
**Listens:** EventTypes.TILE_PRESSED, EventTypes.TILE_ENTERED, EventTypes.INPUT_RELEASED
**Dependencies:** EventBus.js, EventTypes.js

**Acceptance Criteria:**
• [ ] Remove submitWord method entirely
• [ ] Change to emit SELECTION_COMPLETE with positions only
• [ ] Keep all selection tracking logic
• [ ] Keep adjacency validation
• [ ] Update all tests to expect new behavior
• [ ] Ensure SelectionAdapter still receives needed events
• [ ] Document the architectural change

**Implementation Notes:**
- This is a breaking change but SelectionAdapter handles it
- SELECTION_COMPLETE should include: { positions: [...], timestamp }
- Keep SELECTION_CHANGED events for visual feedback
- Consider if SELECTION_COMPLETE needs to be added to EventTypes

**Key Files:** src/engine/InputHandler.js, tests/input-handler.test.html
**Effort:** S | **Risk:** Medium (breaking change, but mitigated by SelectionAdapter)