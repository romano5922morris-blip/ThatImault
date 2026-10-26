import { useEffect } from 'react';

const SEL = '.section h2, .section .lede, .page-head .wrap > *, .card, .steps li, .service, .review, .service-list a, .stat, .state, .panel, .rating-summary, .form > *';

/** Apparition progressive des blocs au défilement. Désactivée avec prefers-reduced-motion. */
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    const scan = () => document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
      if (el.classList.contains('reveal')) return;
      const idx = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
      el.style.setProperty('--d', `${Math.min(idx, 6) * 70}ms`);
      el.classList.add('reveal'); io.observe(el);
    });
    scan();
    const main = document.getElementById('main');
    const mo = new MutationObserver(scan);
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}
