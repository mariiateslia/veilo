'use strict';
(() => {
  const hero = document.querySelector('.hero');
  const actions = document.getElementById('quick-actions');
  if (!hero || !actions || !('IntersectionObserver' in window)) return;

  // A non-intersecting hero may also be below the viewport. Only reveal after passing it.
  const observer = new IntersectionObserver(([entry]) => {
    const visible = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
    actions.classList.toggle('is-visible', visible);
    actions.inert = !visible;
    actions.setAttribute('aria-hidden', String(!visible));
  }, { threshold: 0 });

  actions.hidden = false;
  observer.observe(hero);
})();
