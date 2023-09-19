import { Debugger } from "../lib/webglutils/Debugging.js";
import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
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
import { ChunkManager } from "./ChunkManager.js"; 

const GRAVITY = 9.8;

export class MinecraftAnimation extends CanvasAnimation {
  private gui: GUI;
  
  public chunk : Chunk;
  public chunkManager: ChunkManager;
  
  /*  Cube Rendering */
  private cubeGeometry: Cube;
  private blankCubeRenderPass: RenderPass;

  /* Global Rendering Info */
  private lightPosition: Vec4;
  private backgroundColor: Vec4;

  private canvas2d: HTMLCanvasElement;
  
  // Player's head position in world coordinate.
  // Player should extend two units down from this location, and 0.4 units radially.
  private playerPosition: Vec3;

  private verticalVelocity: number;
  private perlinNoise: number;
  private animation: boolean;
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
  
    this.ctx = Debugger.makeDebugContext(this.ctx);
    let gl = this.ctx;
        
    this.gui = new GUI(this.canvas2d, this);
    this.playerPosition = this.gui.getCamera().pos();
    
    // Generate initial landscape
    this.chunk = new Chunk(0.0, 0.0, 64);

    this.chunkManager = new ChunkManager(3, 64);
    this.chunkManager.updateChunks(0, 0);
    
    this.blankCubeRenderPass = new RenderPass(gl, blankCubeVSText, blankCubeFSText);
    this.cubeGeometry = new Cube();
    this.initBlankCube();
     
    this.lightPosition = new Vec4([-1000, 1000, -1000, 1]);
    this.backgroundColor = new Vec4([0.0, 0.37254903, 0.37254903, 1.0]);
    
    this.verticalVelocity = 0;
    this.perlinNoise = 0.0;

    this.animation = false;
  }

  /**
   * Setup the simulation. This can be called again to reset the program.
   */
  public reset(): void {    
      this.gui.reset();
      this.verticalVelocity = 0;
      
      this.playerPosition = this.gui.getCamera().pos();
      
  }
  
  
  /**
   * Sets up the blank cube drawing
   */
  private initBlankCube(): void {
    this.blankCubeRenderPass.setIndexBufferData(this.cubeGeometry.indicesFlat());
    this.blankCubeRenderPass.addAttribute("aVertPos",
      4,
      this.ctx.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      this.cubeGeometry.positionsFlat()
    );
    
    this.blankCubeRenderPass.addAttribute("aNorm",
      4,
      this.ctx.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      this.cubeGeometry.normalsFlat()
    );
    
    this.blankCubeRenderPass.addAttribute("aUV",
      2,
      this.ctx.FLOAT,
      false,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      this.cubeGeometry.uvFlat()
    );
    
    this.blankCubeRenderPass.addInstancedAttribute("aOffset",
      4,
      this.ctx.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      new Float32Array(0)
    );

    const blockPositions = this.chunk.cubePositions();
    this.blankCubeRenderPass.addInstancedAttribute("aBlockPos",
      2,
      this.ctx.FLOAT,
      false,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      blockPositions
    );

    this.blankCubeRenderPass.addUniform("uLightPos",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform4fv(loc, this.lightPosition.xyzw);
    });
    this.blankCubeRenderPass.addUniform("uProj",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
    });
    this.blankCubeRenderPass.addUniform("uView",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
    });
    
    this.blankCubeRenderPass.addUniform("uAnimate",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform1f(loc, this.animation ? 1.0 : 0.0);
    });

    this.blankCubeRenderPass.addUniform("uPerlinNoise",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform1f(loc, this.perlinNoise);;
    });

    this.blankCubeRenderPass.addAttribute("aTerrain",
      1,
      this.ctx.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      new Float32Array(0)
    );
    
    this.blankCubeRenderPass.setDrawData(this.ctx.TRIANGLES, this.cubeGeometry.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
    this.blankCubeRenderPass.setup();    
  }


  /**
   * Draws a single frame
   *
   */
  public draw(): void {
    //TODO: Logic for a rudimentary walking simulator. Check for collisions and reject attempts to walk into a cube. Handle gravity, jumping, and loading of new chunks when necessary.
    const deltaTime = 0.016667;
    const gl: WebGLRenderingContext = this.ctx;

    this.perlinNoise += deltaTime;

    // Calculate new player height based on current height and vertical velocity
    this.verticalVelocity -= GRAVITY * deltaTime;
    this.playerPosition.y += this.verticalVelocity * deltaTime;

    // Check if player is colliding with any blocks and adjust position and velocity accordingly
    var maxHeightForPlayer = this.gui.getMaxHeightForPlayer(
      this.chunkManager,
      this.playerPosition
    );

    if (this.playerPosition.y < maxHeightForPlayer) {
      this.playerPosition.y = maxHeightForPlayer;
      this.verticalVelocity = 0;
    } else if (this.playerPosition.y === maxHeightForPlayer) {
      this.verticalVelocity = 0;
    }

    // Calculate new player position based on current position and movement direction
    const newPosition = this.playerPosition.copy().add(this.gui.walkDir());

    // Check if new position is colliding with any blocks
    if (newPosition.y >= this.gui.getMaxHeightForPlayer(this.chunkManager, newPosition)) {
      this.playerPosition = newPosition;
    }

    var maxHeightForPlayer = this.gui.getMaxHeightForPlayer(
      this.chunkManager,
      this.playerPosition
    );

    if (this.playerPosition.y < maxHeightForPlayer) {
      this.playerPosition.y = maxHeightForPlayer;
      this.verticalVelocity = 0;
    } else if (this.playerPosition.y === maxHeightForPlayer) {
      this.verticalVelocity = 0;
    }

    // Set player position in camera
    this.gui.getCamera().setPos(this.playerPosition);

    // Update visible chunks around player position
    const playerChunkX = Math.floor(this.playerPosition.x / this.chunkManager.chunkSize) * this.chunkManager.chunkSize;
    const playerChunkY = Math.floor(this.playerPosition.z / this.chunkManager.chunkSize) * this.chunkManager.chunkSize;
    this.chunkManager.updateChunks(playerChunkX, playerChunkY);
    
    // Drawing
    const bg: Vec4 = this.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
    this.drawScene(0, 0, 1280, 960);        
  }

  private drawScene(x: number, y: number, width: number, height: number): void {
    const gl: WebGLRenderingContext = this.ctx;
    gl.viewport(x, y, width, height);

    //TODO: Render multiple chunks around the player, using Perlin noise shaders
    for (const chunk of this.chunkManager.getChunks()) {
      this.blankCubeRenderPass.updateAttributeBuffer("aOffset", chunk.cubePositions());
      
      // Create a Float32Array with the terrain value for each instance
      const terrainArray = new Float32Array(chunk.numCubes());
      terrainArray.fill(chunk.get_terrain());
      this.blankCubeRenderPass.updateAttributeBuffer("aTerrain", terrainArray);
      
      if (this.perlinNoise > 0.5 && this.animation) {
        this.blankCubeRenderPass.updateUniform("uPerlinNoise", (gl, loc) => {
          gl.uniform1f(loc, this.perlinNoise);
        });
      }

      this.blankCubeRenderPass.drawInstanced(chunk.numCubes());
    }
    

  }

  public getGUI(): GUI {
    return this.gui;
  }   
  
  
  public jump() {
    if (this.verticalVelocity == 0) {
      this.verticalVelocity = 15;
    }
  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: MinecraftAnimation = new MinecraftAnimation(canvas);
  canvasAnimation.start();  
}
