export class Heightmap {
    constructor(generateTerrain) {
        this.generateTerrain = generateTerrain;
        this.cache = new Map();
    }
    getHeightmap(chunkX, chunkY, width, height) {
        const key = `${chunkX},${chunkY}`;
        if (!this.cache.has(key)) {
            const seed = chunkX + " " + chunkY;
            this.cache.set(key, this.generateTerrain(seed, width, height));
        }
        return this.cache.get(key);
    }
}
//# sourceMappingURL=Heightmap.js.map