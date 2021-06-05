import './styles.scss';

import {
  Box3,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { toggleFullscreenWith } from './modules/toggle-fullscreen-with';


(() => {
  init();
  toggleFullscreenWith(document.querySelector('.main')!, document.querySelector('#fullscreenSwitch')!);

  async function init() {
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
  
    if (!canvas) {
      throw new Error('cannot find canvas element');
    }

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  
    const
    origin = new Vector3(0, 0, 0),
    camera = new PerspectiveCamera(45, 2, 0.1, 100),
    controls = new OrbitControls(camera, canvas);

    controls.autoRotate = true;
    controls.autoRotateSpeed = -1;
    controls.enableDamping = true;
    controls.enablePan = false;
  
    const scene = new Scene();
  
    // sky light
    {
      const light = new HemisphereLight(0xefefef, 0x3e3e3e, 1);
  
      scene.add(light);
    }
  
    let sunLight: DirectionalLight;
    // sun light
    {
      const light = new DirectionalLight(0xcccccc, 1);
  
      light.position.set(0, 3, 0);
  
      scene.add(light, light.target);
      sunLight = light;
    }

    {
      const resources = new Map([
        [ 'green',  'assets/GLTF/Bhaus_Green.gltf' ],
        [ 'ivory', 'assets/GLTF/Bhaus_Ivory.gltf' ],
        [ 'yellow', 'assets/GLTF/Bhaus_Yellow.gltf' ]
      ]);

      let prevRootObject: Object3D|null = null;
      let prevKey: string|null = null;
      let loading = false;

      const setObjectFrom = async (el: HTMLElement) => {
        const key = el.dataset.color;

        if (!key || key === prevKey || loading) return;

        const url = resources.get(key);

        if (!url) return;

        loading = true;

        let root: GLTF;
        try {
          root = await loadGLTFAsync(url);
        } catch {
          return;
        } finally {
          loading = false;
        }

        if (prevRootObject) scene.remove(prevRootObject);

        prevKey = key;
        prevRootObject = root.scene;
        scene.add(root.scene);

        const box = new Box3().setFromObject(root.scene);

        frameBox(box, camera, 2);
        camera.position.x += 0.08;
        camera.position.y += 0.12;

        const boxSize = box.getSize(origin).length();

        controls.maxDistance = boxSize * 2;
        controls.minDistance = boxSize;
        controls.target.copy(box.getCenter(origin));
        controls.update();
      }

      const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-color]');

      for (const el of buttons) {
        el.addEventListener('click', () => setObjectFrom(el));
      }

      await setObjectFrom(buttons[1]);
    }

    function render() {
      if (resizeRendererAuto(renderer)) {
        const { clientWidth: w, clientHeight: h } = renderer.domElement;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      sunLight.position.copy(camera.getWorldPosition(origin));
      controls.update();
      renderer.render(scene, camera);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  function frameBox(box: Box3, camera: PerspectiveCamera, frameScale = 1.2) {
    const origin = new Vector3();

    const
    boxSize = box.getSize(origin).length(),
    screenHalf = boxSize * frameScale / 2,
    boxCenter = box.getCenter(origin);

    const
    distance = screenHalf / Math.tan(MathUtils.degToRad(camera.fov) / 2),
    direction = new Vector3().subVectors(camera.position, boxCenter)
                             .multiply(new Vector3(1, 0, 1)) // to forward
                             .normalize();

    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();
    camera.lookAt(...boxCenter.toArray());
  }

  function resizeRendererAuto(renderer: WebGLRenderer) {
    const { width, height, clientWidth, clientHeight } = renderer.domElement;

    const shouldResize = width !== clientWidth || height !== clientHeight;

    if (shouldResize) {
      renderer.setSize(clientWidth, clientHeight, false);
    }

    return shouldResize;
  }

  function loadGLTFAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void) {
    const loader = new GLTFLoader();

    return new Promise<GLTF>((resolve, reject) => loader.load(url, resolve, onProgress, reject));
  }
})();
