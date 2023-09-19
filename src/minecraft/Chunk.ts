import { Mat3, Mat4, Vec2, Vec3, Vec4 } from "../lib/TSM.js";
import Rand from "../lib/rand-seed/Rand.js"

const PLAYER_RADIUS = 0.4;
const PLAYER_HEIGHT = 2.0;

export class Chunk {
    private cubes: number; // Number of cubes that should be *drawn* each frame
    private cubePositionsF32: Float32Array; // (4 x cubes) array of cube translations, in homogeneous coordinates
    public x: number; // Center of the chunk
    public y: number;
    private size: number; // Number of cubes along each side of the chunk
    public terrain: number;
    private blockData: number[][][];

    constructor(centerX: number, centerY: number, size: number) {
        this.x = centerX;
        this.y = centerY;
        this.size = size;
        this.cubes = size * size;
        this.generateCubes();
    }

    public getHeightAt(x: number, z: number): number {
        const topleftx = this.x - this.size / 2;
        const toplefty = this.y - this.size / 2;
    
        // Calculate the index for the cubePositionsF32 array
        const i = Math.floor(x - topleftx);
        const j = Math.floor(z - toplefty);
        const idx = 6 * 4 * (i + j * this.size);
    
        // Iterate over the four cubes at the given x,z index to find the maximum y-coordinate
        let max_height = this.cubePositionsF32[idx + 1];
    
        return max_height + 4;
    }
     
    private worldToLocal(x: number, z: number): Vec2 {
        const localX = Math.floor(x - (this.x - this.size / 2));
        const localZ = Math.floor(z - (this.y - this.size / 2));
        return new Vec2([localX, localZ]);
    }

    public get_terrain(): number {
        return this.terrain;
    }

    private generateCubes() {
        const topleftx = this.x - this.size / 2;
        const toplefty = this.y - this.size / 2;
    
        const seed = this.x + " " + this.y;
        let rng = new Rand(seed);
    
        let heights = this.generateTerrain(seed, this.size + 1, this.size + 1);
    
        // Calculate the total number of cubes considering the extra blocks
        this.cubes = this.size * this.size * 6; // 4 cubes for each position (1 + 3 extra)
    
        this.cubePositionsF32 = new Float32Array(6 * this.cubes);
    
        let cubeIdx = 0;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const height = Math.floor(2.0 * rng.next());
                
                const heightBlend = (heights[i][j] + heights[i + 1][j] + heights[i][j + 1] + heights[i + 1][j + 1]) / 4;
                const blendedHeight = Math.round(heightBlend);

                // Set the positions for the main block and the 3 extra blocks below it
                for (let k = 0; k < 6; k++) {
                    this.cubePositionsF32[4 * cubeIdx + 0] = topleftx + j;
                    this.cubePositionsF32[4 * cubeIdx + 1] = blendedHeight - k;
                    this.cubePositionsF32[4 * cubeIdx + 2] = toplefty + i;
                    this.cubePositionsF32[4 * cubeIdx + 3] = 0;
    
                    cubeIdx++;
                }
            }
        }
    
        this.terrain = Math.floor(rng.next() * 3);
    }

    //Function to produce random noise values from a seed generation
    private createWhiteNoise(width: number, length: number, rng: Rand): number[][] {
        return Array.from({ length: width }, () =>
            Array.from({ length }, () => rng.next())
        );
    }

    private bilinear_iterpolation(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }
    
    private interpolateNoise(noise: number[][], x: number, y: number): number {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1 < noise.length ? x0 + 1 : x0;
        const y1 = y0 + 1 < noise[0].length ? y0 + 1 : y0;
    
        const horizontal1 = this.bilinear_iterpolation(noise[x0][y0], noise[x0][y1], y - y0);
        const horizontal2 = this.bilinear_iterpolation(noise[x1][y0], noise[x1][y1], y - y0);
    
        return this.bilinear_iterpolation(horizontal1, horizontal2, x - x0);
    }
    
    private scaleNoise(noise: number[][], length: number, width: number): number[][] {
        return Array.from({ length: width }, (_, x) =>
            Array.from({ length }, (_, y) => {
                const scaledX = x / (width - 1) * (noise.length - 1);
                const scaledY = y / (length - 1) * (noise[0].length - 1);
    
                return this.interpolateNoise(noise, scaledX, scaledY);
            })
        );
    }
    
    private generateTerrain(seed: string, length: number = 64, width: number = 64): number[][] {
        const rng = new Rand(seed);
    
        const initialNoise = this.createWhiteNoise(8, 8, rng);
        const baseNoise = this.seamlessNoise(initialNoise);
    
        const octave1 = this.scaleNoise(baseNoise, length, width);
        const octave2 = this.scaleNoise(this.scaleNoise(baseNoise, 16, 16), length, width);
        const octave3 = this.scaleNoise(this.scaleNoise(this.scaleNoise(baseNoise, 4, 4), 16, 16), length, width);
    
        return Array.from({ length: width }, (_, x) =>
            Array.from({ length }, (_, y) => {
                const blendedValue = 12 * octave1[x][y] + 6 * octave2[x][y] + 3 * octave3[x][y];
                return Math.max(0, Math.min(100, Math.round(blendedValue)));
            })
        );
    }

    private seamlessNoise(noise: number[][]): number[][] {
        
        let nextX = this.x + this.size;
        let prevX = this.x - this.size;
        let nextY = this.y + this.size;
        let prevY = this.y - this.size;

        let abvChunkNoise = this.createWhiteNoise(8, 8, new Rand(this.x + " " + nextY));
        let belowChunkNoise = this.createWhiteNoise(8, 8, new Rand(this.x + " " + prevY));
        let rightChunkNoise = this.createWhiteNoise(8, 8, new Rand(nextX + " " + this.y));
        let leftChunkNoise = this.createWhiteNoise(8, 8, new Rand(prevX + " " + this.y));

        for(let i=1; i<7; i++){
            noise[0][i] = (noise[0][i] + belowChunkNoise[7][i])/2;
            noise[7][i] = (noise[7][i] + abvChunkNoise[0][i])/2;
            noise[i][0] = (noise[i][0] + leftChunkNoise[i][7])/2;
            noise[i][7] = (noise[i][7] + rightChunkNoise[i][0])/2;
        }
        noise[0][0] = (noise[0][0] + belowChunkNoise[7][0] + leftChunkNoise[0][7])/3;
        noise[0][7] = (noise[0][7] + belowChunkNoise[7][7] + rightChunkNoise[0][0])/3;
        noise[7][0] = (noise[7][0] + abvChunkNoise[0][0] + leftChunkNoise[7][7])/3;
        noise[7][7] = (noise[7][7] + abvChunkNoise[0][7] + rightChunkNoise[7][0])/3;

        return noise;
    }

    public cubePositions(): Float32Array {
        return this.cubePositionsF32;
    }


    public numCubes(): number {
        return this.cubes;
    }
}

