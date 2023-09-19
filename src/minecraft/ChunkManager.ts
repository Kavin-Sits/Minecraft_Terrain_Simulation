import { GUI } from "./Gui.js";
import {

  blankCubeFSText,
  blankCubeVSText
} from "./Shaders.js";
import { Mat4, Vec4, Vec3 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Camera } from "../lib/webglutils/Camera.js";
import { Cube } from "./Cube.js";
import { Chunk } from "./Chunk.js";

export class ChunkManager {
    private chunks: Map<string, Chunk>;
    private gridSize: number;
    chunkSize: number;
  
    constructor(gridSize: number, chunkSize: number) {
      this.chunks = new Map();
      this.gridSize = gridSize;
      this.chunkSize = chunkSize;
    }
  
    private chunkKey(x: number, y: number): string {
      return `${x}_${y}`;
    }
  
    public getChunk(x: number, y: number): Chunk | undefined {
      return this.chunks.get(this.chunkKey(x, y));
    }
  
    public createChunk(x: number, y: number): Chunk {
      const chunk = new Chunk(x, y, this.chunkSize);
      this.chunks.set(this.chunkKey(x, y), chunk);
      return chunk;
    }
  
    public updateChunks(centerX: number, centerY: number): void {
      const newChunks = new Map<string, Chunk>();
      const buffer = 0;
    
      const minX = Math.round(centerX - (this.chunkSize * (1.0 + buffer/64.0)));
      const maxX = Math.round(centerX + (this.chunkSize * (1.0 + buffer/64.0)));
      const minY = Math.round(centerY - (this.chunkSize * (1.0 + buffer/64.0)));
      const maxY = Math.round(centerY + (this.chunkSize * (1.0 + buffer/64.0)));
    
      for (let i = -1.0 - buffer/64.0; i <= 1.0 + buffer/64.0; i++) {
        for (let j = -1.0 - buffer/64.0; j <= 1.0 + buffer/64.0; j++) {
          const x = Math.round(centerX + i * this.chunkSize);
          const y = Math.round(centerY + j * this.chunkSize);
          const key = this.chunkKey(x, y);
    
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            let chunk = this.chunks.get(key);
            if (!chunk) {
              chunk = this.createChunk(x, y);
            } else {
              this.chunks.delete(key);
            }
    
            newChunks.set(key, chunk);
          }
        }
      }
    
      for (const key of this.chunks.keys()) {
        if (!newChunks.has(key)) {
          this.chunks.delete(key);
        }
      }
    
      this.chunks = newChunks;
    }
    
  
    public getChunks(): IterableIterator<Chunk> {
      return this.chunks.values();
    }
    
    public getPlayerChunk(playerXpos: number, playerYpos: number): Chunk {
      const chunkX = Math.floor(playerXpos / this.chunkSize);
      const chunkY = Math.floor(playerYpos / this.chunkSize);
    
      const chunkKey = `${chunkX},${chunkY}`;
    
      let chunk = this.chunks.get(chunkKey);
    
      if (!chunk) {
        // Check neighboring chunks
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const x = chunkX + i;
            const y = chunkY + j;
            const key = `${x},${y}`;
    
            const potentialChunk = this.chunks.get(key);
    
            if (potentialChunk) {
              chunk = potentialChunk;
              break;
            }
          }
    
          if (chunk) {
            break;
          }
        }
    
        // Create a new chunk if none exists
        if (!chunk) {
          chunk = new Chunk(chunkX * this.chunkSize + this.chunkSize / 2, chunkY * this.chunkSize + this.chunkSize / 2, this.chunkSize);
          this.chunks.set(chunkKey, chunk);
        }
      }
    
      return chunk;
    }
    
  

}