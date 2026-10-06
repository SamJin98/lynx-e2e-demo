// Web-only accessibility and mouse/wheel adapters for the touch-driven Lynx carousel.
const observedRoots = new WeakSet();
const syncAccessibility = (root) => {
  root.querySelectorAll('[accessibility-label]').forEach((node) => {
    node.setAttribute('aria-label', node.getAttribute('accessibility-label'));
    node.setAttribute(
      'role',
      node.getAttribute('accessibility-trait') === 'button'
        ? 'button'
        : node.classList.contains('drag-zone')
          ? 'img'
          : 'group',
    );
  });
  const panel = root.querySelector('.panel');
  const content = root.querySelector('#product-scroll');
  if (content) {
    content.inert = Boolean(panel);
    content.setAttribute('aria-hidden', String(Boolean(panel)));
  }
  if (panel) {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute(
      'aria-label',
      panel.querySelector('.panel-title')?.textContent || 'Panel',
    );
  }
  root.querySelectorAll('*').forEach((node) => {
    if (node.shadowRoot) watchRoot(node.shadowRoot);
  });
};
const watchRoot = (root) => {
  if (observedRoots.has(root)) {
    syncAccessibility(root);
    return;
  }
  observedRoots.add(root);
  new MutationObserver(() => syncAccessibility(root)).observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['accessibility-label', 'accessibility-trait'],
  });
  syncAccessibility(root);
};
watchRoot(document);
let lastWheel = 0;
let mouseDrag = null;
const photoOf = (event) =>
  event.composedPath().find((node) => node.classList?.contains('photo'));
const sendTouch = (track, type, x, y) => {
  const touch = new Touch({
    identifier: 1,
    target: track,
    clientX: x,
    clientY: y,
  });
  track.dispatchEvent(
    new TouchEvent(type, {
      bubbles: true,
      composed: true,
      touches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
    }),
  );
};
const endMouseDrag = () => {
  if (!mouseDrag) return;
  const drag = mouseDrag;
  mouseDrag = null;
  sendTouch(drag.track, 'touchend', drag.x, drag.y);
  drag.photo.style.cursor = 'grab';
  if (drag.photo.hasPointerCapture(drag.id))
    drag.photo.releasePointerCapture(drag.id);
};
document.addEventListener(
  'pointerdown',
  (event) => {
    const photo = photoOf(event);
    if (event.pointerType !== 'mouse' || event.button !== 0 || !photo) return;
    event.preventDefault();
    mouseDrag = {
      photo,
      track: photo.querySelector('.photo-track'),
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    photo.setPointerCapture(event.pointerId);
    photo.style.cursor = 'grabbing';
    sendTouch(mouseDrag.track, 'touchstart', event.clientX, event.clientY);
  },
  true,
);
document.addEventListener(
  'pointermove',
  (event) => {
    if (!mouseDrag || event.pointerId !== mouseDrag.id) return;
    event.preventDefault();
    mouseDrag.x = event.clientX;
    mouseDrag.y = event.clientY;
    sendTouch(mouseDrag.track, 'touchmove', event.clientX, event.clientY);
  },
  true,
);
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
  document.addEventListener(
    type,
    (event) => {
      if (mouseDrag && event.pointerId === mouseDrag.id) endMouseDrag();
    },
    true,
  );
window.addEventListener('blur', endMouseDrag);
document.addEventListener('dragstart', (event) => {
  if (photoOf(event)) event.preventDefault();
});
document.addEventListener(
  'wheel',
  (event) => {
    const photo = photoOf(event);
    if (mouseDrag || !photo || Math.abs(event.deltaX) <= Math.abs(event.deltaY))
      return;
    event.preventDefault();
    if (Date.now() - lastWheel < 400) return;
    lastWheel = Date.now();
    const track = photo.querySelector('.photo-track');
    const rect = photo.getBoundingClientRect();
    const x = rect.left + rect.width / 2,
      y = rect.top + rect.height / 2;
    const send = (type, dx) => {
      const touch = new Touch({
        identifier: 1,
        target: track,
        clientX: x + dx,
        clientY: y,
      });
      track.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          composed: true,
          touches: type === 'touchend' ? [] : [touch],
          changedTouches: [touch],
        }),
      );
    };
    send('touchstart', 0);
    send('touchmove', Math.sign(event.deltaX) * rect.width);
    send('touchend', Math.sign(event.deltaX) * rect.width);
  },
  { passive: false },
);
