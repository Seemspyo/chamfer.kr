import './styles.scss';

import {
  Box3,
  DirectionalLight,
  HemisphereLight,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { toggleFullscreenWith } from './modules/toggle-fullscreen-with';
import { boxIntoView } from './modules/box-into-view';
import { resizeRendererAuto } from './modules/resize-renderer-auto';
import { loadGLTFAsync } from './modules/load-gltf';


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


      let
      toggleProgress: (state: boolean) => void,
      onProgress: (event: ProgressEvent) => void;

      {
        const
        progressContainer = document.querySelector<HTMLElement>('.loading'),
        progressEl = document.querySelector<HTMLElement>('.loading-progress-state');
  
        if (progressContainer && progressEl) {
          toggleProgress = state => progressContainer.classList[state ? 'add' : 'remove']('loading-visible');
          onProgress = ({ loaded, total }) => progressEl.style.setProperty('width', `${ loaded / total * 100 }%`);
        } else {
          toggleProgress =
          onProgress = () => void 0;
        }
      }

      const setObjectFrom = async (el: HTMLElement) => {
        const key = el.dataset.color;

        if (!key || key === prevKey || loading) return;

        const url = resources.get(key);

        if (!url) return;

        loading = true;
        toggleProgress(true);

        let root: GLTF;
        try {
          root = await loadGLTFAsync(url, onProgress);
        } catch {
          return;
        } finally {
          loading = false;
          toggleProgress(false);
        }

        if (prevRootObject) scene.remove(prevRootObject);

        prevKey = key;
        prevRootObject = root.scene;
        scene.add(root.scene);

        const box = new Box3().setFromObject(root.scene);

        boxIntoView(box, camera, 2);
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
})();
