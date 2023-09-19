## Minecraft: Milestone I
#### Names: Arun Eswara and Kavin Sitsabeshon
---

## Milestone Completion:
*Terrain Synthesis - Value Noise Patch - 20pts*\
*Terrain Synthesis - Seamless Chunk Boundaries - 20pts*\
*Terrain Synthesis - Lazy Chunk Loading - 10pts*\
*Procedural Textures - Perlin Noise Implementation - 20pts*\
*Procedural Textures - Perlin Noise Textures - 10pts*\
*Procedural Textures - Textured Blocks - 10pts*\
*FPS Controls - Gravity - 5pts*\
*FPS Controls - Jumping - 5pts*

## Incomplete Sections:
*Terrain Synthesis - Instanced Cube Rendering - 10pts*
> Instanced cube rendering is not fully integrated. For partial credit, we update the aOffset attribute with the heights of the blocks and collectively pass in the chunk to accelerate rendering. However, full instanced rendering has not been implemented. This results in a slight performance delay, although we found that the project still runs at a comarable speed to the reference solution.

*Terrain Synthesis - Collision Detection - 20pts*
> Collision detection is mostly implemented - draw() contains code to prevent the player from falling through objects or walking through them. However, the simulation itself experiences errors including getting stuck while trying to move forward (although the player does not typically experience gravity issues like falling through blocks). We have implemented all of the code here for partial credit and have the collision detection almost working, but it is still buggy, leading to issues when moving. On the other hand, jump and gravity are fully implemented and working.

## Extra Credit:
*Time-varying Perlin Noise - 10pts*
> In the MinecraftAnimation class, set this.animation to true in the constructor. If you do so, the perlin noise used to shade the cubes varies by time and there is a corresponding animation effect. For visual appeal, the animation only occurs in the green biome.

*Hysteresis - 5pts*
> Edit the 'buffer' variable in updateChunks() in ChunkManager.ts to enable hysteresis - we recommend a value of 16 to experience the difference.
