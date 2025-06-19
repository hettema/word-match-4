// src/core/GridLogic.js - PURE FUNCTIONS ONLY
// This module manages grid state without side effects or events

export class GridLogic {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = this.createEmptyGrid();
    }
    
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }
    
    // Get tile at position
    getTile(x, y) {
        if (!this.isValidPosition(x, y)) return null;
        return this.tiles[y][x];
    }
    
    // Set tile at position - returns new grid state
    setTile(x, y, tile) {
        if (!this.isValidPosition(x, y)) {
            return { changed: false, grid: this.tiles };
        }
        
        const newGrid = this.cloneGrid();
        newGrid[y][x] = tile;
        
        return {
            changed: true,
            grid: newGrid,
            previousTile: this.tiles[y][x]
        };
    }
    
    // Remove tile at position - returns new grid state
    removeTile(x, y) {
        return this.setTile(x, y, null);
    }
    
    // Pure function - returns neighbors, no side effects
    getNeighbors(x, y, radius = 1) {
        const neighbors = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny)) {
                    neighbors.push({
                        x: nx, 
                        y: ny, 
                        tile: this.tiles[ny][nx]
                    });
                }
            }
        }
        return neighbors;
    }
    
    // Pure function - returns new grid state after gravity
    applyGravity() {
        const newGrid = this.cloneGrid();
        const tilesDropped = [];
        
        // Process from bottom to top, left to right
        for (let x = 0; x < this.width; x++) {
            let writePos = this.height - 1;
            
            // Scan from bottom up
            for (let y = this.height - 1; y >= 0; y--) {
                const tile = newGrid[y][x];
                if (tile !== null) {
                    if (y !== writePos) {
                        // Tile needs to drop
                        newGrid[writePos][x] = tile;
                        newGrid[y][x] = null;
                        tilesDropped.push({
                            from: { x, y },
                            to: { x, y: writePos },
                            tile: tile
                        });
                    }
                    writePos--;
                }
            }
        }
        
        return {
            grid: newGrid,
            tilesDropped: tilesDropped,
            changed: tilesDropped.length > 0
        };
    }
    
    // Fill empty spaces with new tiles
    fillEmptySpaces(tileGenerator) {
        const newGrid = this.cloneGrid();
        const newTiles = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (newGrid[y][x] === null) {
                    const newTile = tileGenerator(x, y);
                    newGrid[y][x] = newTile;
                    newTiles.push({ x, y, tile: newTile });
                }
            }
        }
        
        return {
            grid: newGrid,
            newTiles: newTiles,
            changed: newTiles.length > 0
        };
    }
    
    // Get all positions matching a condition
    findTiles(predicate) {
        const matches = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (predicate(tile, x, y)) {
                    matches.push({ x, y, tile });
                }
            }
        }
        return matches;
    }
    
    // Check if all tiles have settled (no nulls below non-nulls)
    isStable() {
        for (let x = 0; x < this.width; x++) {
            let foundNull = false;
            for (let y = this.height - 1; y >= 0; y--) {
                if (this.tiles[y][x] === null) {
                    foundNull = true;
                } else if (foundNull) {
                    // Found a tile above a null - not stable
                    return false;
                }
            }
        }
        return true;
    }
    
    // Update internal grid state (for after operations)
    updateGrid(newGrid) {
        if (newGrid.length !== this.height || newGrid[0].length !== this.width) {
            throw new Error('Grid dimensions mismatch');
        }
        this.tiles = newGrid;
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    cloneGrid() {
        return this.tiles.map(row => [...row]);
    }
    
    // Get grid as simple array for debugging
    toArray() {
        return this.cloneGrid();
    }
    
    // Count non-null tiles
    getTileCount() {
        let count = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] !== null) count++;
            }
        }
        return count;
    }
    
    // Calculate ripple effects from epicenters
    calculateRipples(epicenters, spreadPercentage) {
        const affectedTiles = [];
        const visited = new Set();
        
        epicenters.forEach(epicenter => {
            const neighbors = this.getNeighbors(epicenter.x, epicenter.y);
            const eligibleNeighbors = neighbors.filter(n => {
                const key = `${n.x},${n.y}`;
                const tile = this.tiles[n.y][n.x];
                return tile && tile.type === 'normal' && !visited.has(key);
            });
            
            // Select percentage of neighbors randomly
            const numToSelect = Math.ceil(eligibleNeighbors.length * spreadPercentage);
            const selected = this.selectRandom(eligibleNeighbors, numToSelect);
            
            selected.forEach(neighbor => {
                const key = `${neighbor.x},${neighbor.y}`;
                visited.add(key);
                affectedTiles.push({ x: neighbor.x, y: neighbor.y });
            });
        });
        
        return affectedTiles;
    }
    
    // Select random items from array
    selectRandom(items, count) {
        if (count >= items.length) return [...items];
        
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled.slice(0, count);
    }
}