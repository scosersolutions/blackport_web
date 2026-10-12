/**
 * Astro aplica los estilos con ámbito del componente padre mediante un atributo
 * `data-astro-cid-*`. Para que una clase pasada a un componente hijo (p. ej.
 * `<LavaEdge class="hero-drip" />`) reciba esos estilos, el hijo debe reenviar
 * ese atributo a su elemento raíz.
 */
export function scopeAttrs(props: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(props)
      .filter(([k]) => k.startsWith('data-astro-cid'))
      .map(([k, v]) => [k, String(v ?? '')]),
  );
}
