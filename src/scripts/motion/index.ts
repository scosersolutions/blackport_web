/**
 * Sistema de movimiento de BLACKPORT.
 * - Base (siempre): revelados CSS, horario, contadores, botones magnéticos, controles de galería.
 * - Coreografía completa (sin reduced-motion): intro «corte», titulares partidos,
 *   escenas ligadas al scroll y galería fijada. Escritorio y móvil tienen variantes.
 * - Reduced-motion: solo fundidos; nada se desplaza ni se fija.
 * gsap.matchMedia revierte cada contexto al dejar de cumplirse (resize, cambio de preferencia).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { setupReveal, setupMagnetic, setupStatus, setupCount } from './basics';
import { setupText, setupTextReduced } from './text';
import { playIntro } from './intro';
import { setupGalleryControls, galleryPinScene } from './gallery';
import {
  heroScene,
  aboutScene,
  servicesScene,
  bookingScene,
  reviewsScene,
  visitScene,
  footerScene,
  navProgress,
  reducedScene,
} from './scenes';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

setupReveal();
setupMagnetic();
setupStatus();
setupCount();
setupGalleryControls();

const root = document.documentElement;

const start = (): void => {
  const mm = gsap.matchMedia();
  mm.add(
    {
      full: '(prefers-reduced-motion: no-preference)',
      reduced: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 900px)',
    },
    (ctx) => {
      const { full, reduced, desktop } = ctx.conditions as Record<'full' | 'reduced' | 'desktop', boolean>;
      if (reduced) {
        setupTextReduced();
        reducedScene();
        return;
      }
      if (!full) return;
      root.classList.add('motion-full');
      // En orden de página: los pines de arriba desplazan a los de abajo.
      heroScene(desktop);
      setupText();
      aboutScene(desktop);
      servicesScene();
      const undoGallery = desktop ? galleryPinScene() : undefined;
      bookingScene(desktop);
      reviewsScene();
      visitScene();
      footerScene();
      navProgress();
      return () => {
        undoGallery?.();
        root.classList.remove('motion-full');
      };
    },
  );
};

playIntro();
// Las medidas de los titulares dependen de la fuente: se espera a que cargue (máx. 1 s).
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1000))]).then(() => {
  start();
  ScrollTrigger.refresh();
});
window.addEventListener('load', () => ScrollTrigger.refresh());
