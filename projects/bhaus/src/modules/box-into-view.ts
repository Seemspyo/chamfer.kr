import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';


/** puts box into the camera's view */
export function boxIntoView(box: Box3, camera: PerspectiveCamera, frameScale = 1.2) {
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
