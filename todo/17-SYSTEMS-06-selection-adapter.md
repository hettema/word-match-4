- [ ] **SYSTEMS-06**: SelectionAdapter Implementation 🟢
**Description:** Create SelectionAdapter to bridge input selection and word submission with real letters
**Context:** Critical adapter to fix word validation by accessing grid data for actual letters

**Prerequisites:** 
- InputHandler complete (ENGINE-03)
- GridAdapter complete (SYSTEMS-01)
- All adapters integrated (SYSTEMS-05)

**🛡️ Guard Rail Checklist (BEFORE CODING):**
• [ ] Review InputHandler current implementation
• [ ] Check GridLogic getTile method
• [ ] Verify event flow will work
• [ ] Plan dependency injection

**🔗 Integration Strategy**
**Emits:** EventTypes.WORD_SUBMITTED (with real letters!)
**Listens:** EventTypes.SELECTION_CHANGED, EventTypes.SELECTION_COMPLETE (future)
**Dependencies:** EventBus.js, GridLogic.js

**Acceptance Criteria:**
• [ ] Listens to SELECTION_CHANGED events from InputHandler
• [ ] Gets actual letters from GridLogic for each selected tile
• [ ] Builds word from real letters (not placeholders)
• [ ] Emits WORD_SUBMITTED when selection has 2+ tiles
• [ ] Handles edge cases (invalid positions, missing tiles)
• [ ] No more than 100 lines of code
• [ ] Comprehensive tests

**Implementation Notes:**
- For now, listen to INPUT_RELEASED to know when to submit
- Gets tile data using gridLogic.getTile(x, y)
- Only submit words with 2 or more tiles
- Must validate positions are valid before getting tiles

**Key Files:** src/adapters/SelectionAdapter.js
**Effort:** S | **Risk:** Low (additive, doesn't break existing)