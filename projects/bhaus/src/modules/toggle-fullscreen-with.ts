export function toggleFullscreenWith(targetEl: Element, switchEl: Element) {
  if (!document.fullscreenEnabled) {
    console.warn('fullscreen is not enabled.');
    return;
  }

  let handling = false;
  const handler = async () => {
    if (handling) return;

    handling = true;

    try {
      await (document.fullscreenElement ? document.exitFullscreen() : targetEl.requestFullscreen());
    } catch {}

    handling = false;
  }

  switchEl.addEventListener('click', handler);

  return () => switchEl.removeEventListener('cilck', handler);
}
