import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


export function loadGLTFAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void) {
  const loader = new GLTFLoader();

  return new Promise<GLTF>((resolve, reject) => loader.load(url, resolve, onProgress, reject));
}
