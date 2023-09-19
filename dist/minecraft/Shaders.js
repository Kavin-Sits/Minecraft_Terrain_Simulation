export const blankCubeVSText = `
    precision mediump float;

    uniform vec4 uLightPos;    
    uniform float uPerlinNoise;
    uniform float uAnimate;
    uniform mat4 uView;
    uniform mat4 uProj;
    
    attribute vec4 aNorm;
    attribute vec4 aVertPos;
    attribute vec4 aOffset;
    attribute vec2 aUV;

    attribute vec2 aBlockPos;
    attribute float aTerrain;
    
    varying vec4 normal;
    varying vec4 wsPos;
    varying vec2 uv;

    varying vec2 vBlockPos;
    varying float vTerrain;

    void main () {
        
        gl_Position = uProj * uView * (aVertPos + aOffset);
        wsPos = aVertPos + aOffset;
        normal = normalize(aNorm);
        uv = aUV;

        vBlockPos = aBlockPos;
        vTerrain = aTerrain;
    }
`;
export const blankCubeFSText = `
    precision mediump float;

    uniform vec4 uLightPos;
    uniform float uPerlinNoise;
    uniform float uAnimate;
    
    varying vec4 normal;
    varying vec4 wsPos;
    varying vec2 uv;

    varying vec2 vBlockPos;
    varying float vTerrain;
    
    float random (in vec2 pt, in float seed) {
        return fract(sin( (seed + dot(pt.xy, vec2(12.9898,78.233))))*43758.5453123);
    }
    
    vec2 unit_vec(in vec2 xy, in float seed) {
        float theta = 6.28318530718 * random(xy, seed);
        return vec2(cos(theta), sin(theta));
    }
    
    float smoothmix(float a0, float a1, float w) {
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }
    
    float perlin(float seed, vec2 uv, float grid_spacing) {
        vec2 cell = floor(uv * grid_spacing);
        vec2 local_uv = fract(uv * grid_spacing);
        float blend_u = smoothmix(0.0, 1.0, local_uv.x);
        float blend_v = smoothmix(0.0, 1.0, local_uv.y);
        float total = 0.0;
    
        for (int j = 0; j <= 1; j++) {
            for (int i = 0; i <= 1; i++) {
                vec2 offset = vec2(float(i), float(j));
                vec2 cell_uv = cell + offset;
                vec2 local_offset = offset - local_uv;
                float dist = dot(local_offset, local_offset);
                vec2 rand_vec = unit_vec(cell_uv, seed);
                float contribution = dot(rand_vec, local_offset);
                float weight = (i == 0 ? (1.0 - blend_u) : blend_u) * (j == 0 ? (1.0 - blend_v) : blend_v);
                total += weight * contribution;
            }
        }
    
        return (total + 1.0) / 2.0;
    }

    float getColor(vec2 uv, float seed, int terrain) {
        float perlin1 = perlin(seed, uv, 5.0);
        float perlin2 = perlin(seed, uv, 10.0);
        float perlin3 = perlin(seed, uv, 20.0);
        float combinedPerlin = perlin1 * 0.5 + perlin2 * 0.25 + perlin3 * 0.25;

        if (terrain == 0) {
            return combinedPerlin;
        } else if (terrain == 1) {
            return combinedPerlin * 0.75;
        } else {
            return combinedPerlin * 0.5;
        }
    }
    
    void main() {
        vec3 kd = vec3(1.0, 1.0, 1.0);
        vec3 ka = vec3(0.1, 0.1, 0.1);

        int uTerrain = int(vTerrain);

        if (uTerrain == 0) {
            kd = vec3(1.2, 1.2, 1.2);
        } else if (uTerrain == 1) {
            kd = vec3(0.2, 0.8, 0.2);
        } else if (uTerrain == 2) {
            kd = vec3(0.378, 0.347, 0.807);
        }

        /* Compute light fall off */
        vec4 lightDirection = uLightPos - wsPos;
        float dot_nl = dot(normalize(lightDirection), normalize(normal));
	    dot_nl = clamp(dot_nl, 0.0, 1.0);
	
        float seed = random(vBlockPos, 42.0);

        if (uTerrain == 1 && uAnimate == 1.0) {
            seed += uPerlinNoise;
        }
        float perlin_noise = getColor(uv, seed, uTerrain);
        
        gl_FragColor = vec4(clamp(ka + dot_nl * kd * perlin_noise, 0.0, 1.0), 1.0);
    }
`;
//# sourceMappingURL=Shaders.js.map