#ifndef WINZU_SKY_COLOR_GLSL
#define WINZU_SKY_COLOR_GLSL

uniform vec3 uSunDir;
uniform vec3 uSkyNearSun;
uniform vec3 uSkyTopLeft;
uniform vec3 uSkyTopRight;
uniform vec3 uHorizonLeft;
uniform vec3 uHorizonRight;
uniform float uSunHdr;
uniform float uSunGlow;
uniform vec3 uSunCoreColor;
uniform vec3 uSunCoreGold;

/** Warm orange left → cool blue right. No HDR disc (safe for fog). */
vec3 skyAtmosphere(vec3 dir) {
  vec3 d = normalize(dir);
  vec3 sun = normalize(uSunDir);
  float elev = d.y;

  // Explicit L→R across the dome (camera looks −Z: −X left / +X right)
  vec2 hz = normalize(d.xz);
  float lr = smoothstep(-0.95, 0.95, hz.x); // 0 = orange left, 1 = blue right

  // Soft sun wash still lifts the peach near the disc
  float sunWash = pow(max(0.0, dot(d, sun)), 2.0);
  float sunCore = pow(max(0.0, dot(d, sun)), 6.5);
  float lowBand = 1.0 - smoothstep(-0.02, 0.22, elev);
  float midBand = smoothstep(-0.05, 0.12, elev) * (1.0 - smoothstep(0.18, 0.42, elev));

  vec3 horizon = mix(uHorizonLeft, uHorizonRight, lr);
  horizon = mix(horizon, uSkyNearSun, sunWash * 0.55 * lowBand + sunCore * 0.28 * lowBand);

  vec3 top = mix(uSkyTopLeft, uSkyTopRight, lr);
  float elev01 = clamp(elev * 0.5 + 0.5, 0.0, 1.0);

  vec3 col = mix(horizon, top, smoothstep(-0.04, 0.28, elev));
  col = mix(col, top, smoothstep(0.15, 0.65, elev01) * 0.7);
  // Soft luminous peach in the mid-left wedge only
  col = mix(col, uSkyNearSun, (sunCore * 0.18 * lowBand + sunWash * 0.1 * midBand) * (1.0 - lr * 0.65));
  return col;
}

/**
 * Hard plate sun like the reference plates: crisp circular disc,
 * pale yellow cream body, tiny warm rim. Sky peach wash stays in skyAtmosphere.
 */
vec3 sunDisc(vec3 dir) {
  vec3 d = normalize(dir);
  vec3 sun = normalize(uSunDir);
  float ang = 1.0 - max(0.0, dot(d, sun));

  // Angular half-size (~2.4°) — hard plate with 1px-ish AA only
  float r = 0.00092;
  float aa = r * 0.035;
  float discMask = 1.0 - smoothstep(r - aa, r + aa * 0.25, ang);

  // Flat pale-yellow core → slight peach at the rim (plate, not soft orb)
  vec3 cream = uSunCoreGold;
  vec3 warm = uSunCoreColor;
  float radial = clamp(ang / max(r, 1e-5), 0.0, 1.0);
  vec3 coreCol = mix(cream, mix(cream, warm, 0.22), pow(radial, 1.6));

  // Warm nest hugging the rim — orange sky contact, not cream bloom
  float contact = exp(-ang * ang * 11000.0) * (1.0 - discMask);
  float nest = exp(-ang * ang * 3200.0) * (1.0 - discMask);
  vec3 glow = warm * (contact * 0.85 + nest * 0.35) * uSunGlow;

  return coreCol * discMask * uSunHdr + glow;
}

vec3 skyColor(vec3 dir) {
  return skyAtmosphere(dir) + sunDisc(dir);
}

/** Horizon-locked fog color — never pulls zenith grey onto the waterline. */
vec3 fogHorizonColor(vec3 viewDir) {
  vec3 d = normalize(viewDir);
  d.y = clamp(d.y, -0.02, 0.06);
  return skyAtmosphere(d);
}

/**
 * Squared FogExp2 factor with optional height haze.
 * heightScale ~0.08: low ground hazes more; elevated mid-rocks stay readable.
 */
float fogFactorExp2(float dist, float density, float worldY, float heightScale) {
  float fogFactor = 1.0 - exp(-density * density * dist * dist);
  float heightTerm = exp(-max(worldY, 0.0) * heightScale);
  return clamp(fogFactor * mix(0.55, 1.0, heightTerm), 0.0, 0.95);
}

#endif
