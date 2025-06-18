- [ ] **ENGINE-01d**: Selection & Effects Implementation 🟡
**Description:** Add selection highlighting and visual effects
**Context:** Make the game interactive with visual feedback

**📊 Visual Progress at localhost:8080:**
- Game grid still visible from 01c
- Tiles now highlight when selected
- Explosion animations when tiles removed
- Destabilization effects (wobble/shake)
- Smooth, polished interactions

**Prerequisites:** Complete ENGINE-01a, 01b, and 01c first

**📖 Required Reading (COMPLETE, NO SKIMMING)**
• `style-guide.md` - Selection State (lines 183-213)
• `style-guide.md` - Destabilization States (lines 215-280)
• `style-guide.md` - Explosion Effect (lines 342-376)

**🛡️ Guard Rail Checklist (BEFORE CODING):**
• [ ] Previous tasks all working
• [ ] Understand selection data structure
• [ ] Understand destabilization surge levels
• [ ] Plan particle effect approach

**🔗 Integration Strategy**
**Emits:** None
**Listens:** Responds to SELECTION_CHANGED, TILES_REMOVED, TILE_DESTABILIZED
**Dependencies:** Existing from previous tasks

**Acceptance Criteria:**
• [ ] renderSelection() highlights selected tiles
• [ ] Clear previous selection before new one
• [ ] Scale and stroke effects on selection
• [ ] animateExplosions() with staggered timing
• [ ] createExplosionParticles() helper
• [ ] renderDestabilization() with 3 surge levels
• [ ] Tint and alpha changes per surge level
• [ ] Wobble animation for surge 2
• [ ] Shake animation for surge 3
• [ ] Total file ~225-250 lines

**Implementation Notes:**
- Use Phaser tweens for animations
- Cyan color for selection highlights
- Stagger explosions by 50ms each
- Progressive red tints for destabilization
- Simple rectangle particles for explosions

**Key Files:** src/engine/GameScene.js
**Effort:** M | **Risk:** Low