/**
 * Sistema de movimiento de BLACKPORT: obsidiana, ceniza y lava.
 * - Base (siempre): revelados CSS, horario, contadores, botones magnéticos, controles
 *   y calor de la galería.
 * - Coreografía completa (sin reduced-motion): apertura con grieta de magma (WebGL),
 *   lava viva entre escenas, titulares partidos, escenas ligadas al scroll, galería
 *   fijada con profundidad y frente de lava en la reserva. Escritorio y móvil tienen variantes.
 * - Reduced-motion: fotogramas estáticos del magma y fundidos; nada se desplaza ni se fija.
 * gsap.matchMedia revierte cada contexto al dejar de cumplirse (resize, cambio de preferencia).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { setupReveal, setupMagnetic, setupStatus, setupCount } from './basics';
import { setupText, setupTextReduced } from './text';
import { setupGalleryControls, galleryPinScene } from './gallery';
import { setupLavaFlow } from './lavaflow';
import { heroScene } from './hero';
import { aboutScene, galleryEnter, servicesScene, bookingScene, reviewsScene, visitScene, footerScene, navProgress, reducedScene } from './scenes';

gsap.registerPlugin(ScrollTrigger, SplitText);

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
        const undo = [heroScene(desktop, false), setupLavaFlow(false), reducedScene()];
        setupTextReduced();
        return () => undo.forEach((u) => u());
      }
      if (!full) return;
      root.classList.add('motion-full');
      // En orden de página: los pines de arriba desplazan a los de abajo.
      const undo = [heroScene(desktop, true), setupLavaFlow(true)];
      setupText();
      undo.push(aboutScene(desktop));
      galleryEnter();
      if (desktop) undo.push(galleryPinScene());
      undo.push(servicesScene(), bookingScene(desktop, true));
      reviewsScene();
      visitScene();
      footerScene();
      navProgress();
      return () => {
        undo.forEach((u) => u());
        root.classList.remove('motion-full');
      };
    },
  );
};

// Las medidas de los titulares dependen de la fuente: se espera a que cargue (máx. 1 s).
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1000))]).then(() => {
  start();
  ScrollTrigger.refresh();
});
window.addEventListener('load', () => ScrollTrigger.refresh());
