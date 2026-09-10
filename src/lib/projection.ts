import * as THREE from "three";

/**
 * DOM pixels to world units.
 *
 * This is the hinge of the whole architecture. The DOM owns layout; the 3D
 * scene asks the DOM where things are and converts. Nothing in the scene
 * decides its own position, so the two can never drift.
 */

/** World units covered by one CSS pixel at a given depth. */
export function worldUnitsPerPixel(
  camera: THREE.PerspectiveCamera,
  z: number,
  viewportHeightPx: number,
): number {
  if (viewportHeightPx <= 0) return 0;
  const distance = Math.abs(camera.position.z - z);
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * distance;
  return visibleHeight / viewportHeightPx;
}

/**
 * Map a viewport-space Y (CSS px from the top of the window) to a world Y that
 * lands on exactly that line, given the box the camera is rendering into.
 */
export function viewportYToWorldY(
  viewportY: number,
  box: { top: number; height: number },
  unitsPerPixel: number,
): number {
  const boxCentre = box.top + box.height * 0.5;
  return -(viewportY - boxCentre) * unitsPerPixel;
}

/** Feature test, same shape as the original's `detectWebGL`. */
export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    return gl instanceof WebGLRenderingContext;
  } catch {
    return false;
  }
}
