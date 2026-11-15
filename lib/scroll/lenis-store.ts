import type Lenis from 'lenis';

// Module-level handle so GSAP scenes can sync with Lenis without prop drilling.
let instance: Lenis | null = null;
export const getLenis = () => instance;
export const setLenis = (l: Lenis | null) => {
  instance = l;
};
