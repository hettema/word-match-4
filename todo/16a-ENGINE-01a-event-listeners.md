- [ ] **ENGINE-01a**: GameScene Event Listener Setup 🟢
**Description:** Create basic GameScene.js structure with event listeners only
**Context:** First step of breaking down ENGINE-01 into manageable pieces

**📊 Visual Progress at localhost:8080:**
- Still shows visual stub scene
- Console logs confirm GameScene loaded
- Console logs show event listeners registered
- NO visual game yet

**📖 Required Reading (COMPLETE, NO SKIMMING)**
• `tdd-word-match.md` - GameScene.js section (lines 723-772)
• `style-guide.md` - Core Visual Setup section (lines 6-52)

**🛡️ Guard Rail Checklist (BEFORE CODING):**
• [ ] Posted 3 quotes from each file
• [ ] Listed all required event listeners
• [ ] Written behavior summary
• [ ] Confirmed EventTypes has SELECTION_CHANGED

**🔗 Integration Strategy**
**Emits:** None (GameScene never emits)
**Listens:** EventTypes.GRID_UPDATED, SELECTION_CHANGED, TILES_REMOVED, TILE_DESTABILIZED, ANIMATION_STARTED, ANIMATION_COMPLETE
**Dependencies:** EventBus.js, EventTypes.js, Phaser

**Acceptance Criteria:**
• [ ] Basic Phaser.Scene class structure
• [ ] create() method gets eventBus from registry
• [ ] setupRenderListeners() creates all 6 listeners
• [ ] Each listener has empty handler method that logs
• [ ] Scene loads without errors
• [ ] All event registrations visible in console
• [ ] File is ~50 lines

**Implementation Notes:**
```javascript
// Each handler should just log for now:
renderGrid(data) {
    console.log('renderGrid called with:', data);
}
```

**Key Files:** src/engine/GameScene.js
**Effort:** S | **Risk:** Low