/* Veilo shared page effects. No browser-extension APIs or network access. */
(() => {
  'use strict';
  function capture(element) {
    const values = {};
    for (const property of ['filter', 'visibility']) values[property] = {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property)
    };
    return {values, overlay: null};
  }
  function restore(element, record) {
    for (const [property, original] of Object.entries(record.values)) {
      if (original.value) element.style.setProperty(property, original.value, original.priority);
      else element.style.removeProperty(property);
    }
    record.overlay?.remove();
    record.overlay = null;
  }
  function apply(element, record, {mode = 'blur', strength = 12, paused = false, createOverlay}) {
    restore(element, record);
    if (paused) return;
    if (mode === 'cover') {
      element.style.setProperty('visibility', 'hidden', 'important');
      record.overlay = createOverlay(element);
    } else {
      element.style.setProperty('filter', `blur(${Math.max(4, Math.min(24, Number(strength) || 12))}px)`, 'important');
    }
  }
  globalThis.VeiloMaskEffects = Object.freeze({capture, restore, apply});
})();
