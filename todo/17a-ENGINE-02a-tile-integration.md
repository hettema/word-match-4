- [ ] **ENGINE-02a**: Tile.js Integration into GameScene 🔴
**Description:** Refactor GameScene to use Tile.js instances instead of inline sprite management
**Context:** Critical architectural integration to ensure proper separation of concerns

**Prerequisites:** 
- ENGINE-02 (Tile.js) complete
- ENGINE-01e (GameScene) complete

**🛡️ Guard Rail Checklist (BEFORE CODING):**
• [ ] Backup current working GameScene.js
• [ ] Verify game works at localhost:8080 before changes
• [ ] Understand current sprite management approach
• [ ] Plan migration strategy

**🔗 Integration Strategy**
**Emits:** None (maintains same event interface)
**Listens:** Same as current GameScene
**Dependencies:** Tile.js

**Acceptance Criteria:**
• [ ] Replace tileSprites array with tiles array of Tile instances
• [ ] Update createGrid() to prepare for Tile instances
• [ ] Update renderGrid() to create/update/destroy Tile instances
• [ ] Update renderSelection() to use Tile.setSelected()
• [ ] Update animateExplosions() to work with Tile instances
• [ ] Update renderDestabilization() to use Tile methods
• [ ] Maintain getTileAt() functionality
• [ ] Remove getTileColor() and getTileDisplayText() (now in Tile)
• [ ] All visual effects working as before
• [ ] Game fully functional at localhost:8080

**Testing Strategy:**
1. Visual test at localhost:8080 - grid should appear
2. Check all special tiles render correctly
3. Verify future effects (selection, explosion, destabilization) ready
4. Run existing GameScene tests

**Implementation Notes:**
- Tile instances manage their own sprites/text
- GameScene coordinates Tile instances via grid position
- Preserve all event handling logic

**Key Files:** src/engine/GameScene.js
**Effort:** M | **Risk:** High (core functionality refactor)