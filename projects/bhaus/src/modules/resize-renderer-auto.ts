import { WebGLRenderer } from 'three';


/** resize renderer to actual canvas size */
export function resizeRendererAuto(renderer: WebGLRenderer) {
  const { width, height, clientWidth, clientHeight } = renderer.domElement;

  const shouldResize = width !== clientWidth || height !== clientHeight;

  if (shouldResize) {
    renderer.setSize(clientWidth, clientHeight, false);
  }

  return shouldResize;
}
