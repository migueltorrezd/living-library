import * as THREE from 'three';
import {assetUrl} from './library-config';
import substrates from './book-substrates.json';

/**
 * Two Blender-authored surface layers added to the glTF materials at load time.
 *
 * Substrate relief: seamless height tiles baked from procedural nodes
 * (scripts/blender/substrate_bake.py) become tangent-space normal maps repeated
 * on the physically scaled TEXCOORD_0 ("Physical UV", one unit ≈ 120 mm on every
 * model), so grain has the same physical size on every book. Mipmapped averaging
 * shortens the tilt with distance; the clearcoat keeps its smooth geometric normal.
 *
 * Contact occlusion: closed-book Cycles AO baked per vertex
 * (scripts/blender/ao_bake.py) arrives as the custom `_OCCLUSION` attribute. It
 * darkens indirect light like three's aoMap, and a small share of direct diffuse
 * so the joint groove and the recess under the boards keep their depth under
 * the key light.
 */
type Spec = {family: string; strength: number};
const BOOKS = substrates.books as Record<string, Spec>;
const FAMILIES = substrates.families as Record<string, {map: string; repeat: number}>;
const OCCLUSION = substrates.occlusion as {power: number; direct: number};
const SUBSTRATE_TARGET = /(_Registered_Print|case material|verified reverse artwork)/;

const textures = new Map<string, THREE.Texture>();
function substrateTexture(map: string) {
  let texture = textures.get(map);
  if (!texture) {
    texture = new THREE.TextureLoader().load(assetUrl(`/models/substrates/${map}`));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.NoColorSpace;
    texture.anisotropy = 8;
    textures.set(map, texture);
  }
  return texture;
}

const SUBSTRATE_PARS = `
varying vec2 vSubstrateUv;
uniform sampler2D substrateMap;
uniform float substrateStrength;
mat3 substrateFrame(vec3 eyePos, vec3 n, vec2 st) {
  vec3 q0 = dFdx(eyePos), q1 = dFdy(eyePos);
  vec2 st0 = dFdx(st), st1 = dFdy(st);
  vec3 q1perp = cross(q1, n), q0perp = cross(n, q0);
  vec3 T = q1perp * st0.x + q0perp * st1.x;
  vec3 B = q1perp * st0.y + q0perp * st1.y;
  float det = max(dot(T, T), dot(B, B));
  float s = det == 0.0 ? 0.0 : inversesqrt(det);
  return mat3(T * s, B * s, n);
}`;
const SUBSTRATE_NORMAL = `
{
  // Unnormalised: mip averaging shortens the tilt, so distant grain settles flat.
  vec2 relief = (texture2D(substrateMap, vSubstrateUv).xy * 2.0 - 1.0) * substrateStrength;
  mat3 frame = substrateFrame(-vViewPosition, normal, vSubstrateUv);
  normal = normalize(normal + frame[0] * relief.x + frame[1] * relief.y);
}`;
const OCCLUSION_PARS = `
varying float vBookOcclusion;
uniform float bookOcclusionPower;
uniform float bookOcclusionDirect;`;
const OCCLUSION_APPLY = `
{
  float bookAo = pow(clamp(vBookOcclusion, 0.0, 1.0), bookOcclusionPower);
  reflectedLight.indirectDiffuse *= bookAo;
  reflectedLight.directDiffuse *= mix(1.0, bookAo, bookOcclusionDirect);
  #if defined( USE_CLEARCOAT )
    clearcoatSpecularIndirect *= bookAo;
  #endif
  #if defined( USE_SHEEN )
    sheenSpecularIndirect *= bookAo;
  #endif
  #if defined( USE_ENVMAP ) && defined( STANDARD )
    float bookNV = saturate(dot(geometryNormal, geometryViewDir));
    reflectedLight.indirectSpecular *= computeSpecularOcclusion(bookNV, bookAo, material.roughness);
  #endif
}`;

export function substrateFor(slug: string) {
  return BOOKS[slug];
}

/**
 * Adds the edition's substrate relief (outer case materials) and baked contact
 * occlusion (meshes carrying `_occlusion`). Call once per mesh-owned material clone.
 */
export function applyBookSurface(material: THREE.Material, slug: string, occlusion: boolean) {
  if (!(material instanceof THREE.MeshStandardMaterial) || material.userData.bookSurface) return;
  const spec = BOOKS[slug];
  const substrate = !!spec && SUBSTRATE_TARGET.test(material.name);
  if (!substrate && !occlusion) return;
  const uniforms: Record<string, THREE.IUniform> = {};
  if (substrate) {
    const family = FAMILIES[spec.family];
    Object.assign(uniforms, {
      substrateMap: {value: substrateTexture(family.map)},
      substrateRepeat: {value: family.repeat},
      substrateStrength: {value: spec.strength},
    });
    material.userData.substrate = spec.family;
  }
  if (occlusion) {
    Object.assign(uniforms, {
      bookOcclusionPower: {value: OCCLUSION.power},
      bookOcclusionDirect: {value: OCCLUSION.direct},
    });
  }
  material.userData.bookSurface = true;
  material.userData.surfaceUniforms = uniforms;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    let vertex = shader.vertexShader, fragment = shader.fragmentShader;
    if (substrate) {
      vertex = vertex
        .replace('#include <common>', '#include <common>\nvarying vec2 vSubstrateUv;\nuniform float substrateRepeat;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvSubstrateUv = uv * substrateRepeat;');
      fragment = fragment
        .replace('#include <common>', '#include <common>' + SUBSTRATE_PARS)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + SUBSTRATE_NORMAL);
    }
    if (occlusion) {
      vertex = vertex
        .replace('#include <common>', '#include <common>\nattribute float _occlusion;\nvarying float vBookOcclusion;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBookOcclusion = _occlusion;');
      fragment = fragment
        .replace('#include <common>', '#include <common>' + OCCLUSION_PARS)
        .replace('#include <aomap_fragment>', '#include <aomap_fragment>' + OCCLUSION_APPLY);
    }
    shader.vertexShader = vertex;
    shader.fragmentShader = fragment;
  };
  const key = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => `${key()}|book:${substrate ? 's' : ''}${occlusion ? 'o' : ''}`;
  material.needsUpdate = true;
}
