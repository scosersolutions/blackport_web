/**
 * Magma: un único fragment shader WebGL (sin dependencias) con dos materiales.
 *
 * - `rift`: obsidiana con brillo especular que sigue al puntero (la luz) y una grieta
 *   de lava que se abre. El interior de la grieta es transparente: deja ver la foto
 *   (un <picture> del DOM, nítida y accesible) con la luz de la lava en los bordes.
 * - `lake`: lago de lava enfriándose: placas de costra (Voronoi) que derivan muy despacio
 *   con costuras incandescentes; el calor sube con el scroll y cerca del puntero.
 *
 * Coste: se renderiza a resolución reducida (adaptativa), solo con el lienzo en pantalla
 * y la pestaña visible. Si WebGL no existe o se pierde el contexto, el lienzo se retira
 * y queda el fallback CSS de cada escena.
 */

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uMode, uWidth, uCenter, uVertical, uDraw, uIgnite, uVeins, uHeat;
uniform vec2 uPointer;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}

// Temperatura -> color. 0.5 cae en el rojo de marca (#cc2731); el naranja solo en el núcleo.
vec3 ramp(float t){t=clamp(t,0.,1.);
  vec3 c=mix(vec3(.02,.005,.005),vec3(.43,.047,.07),smoothstep(0.,.3,t));
  c=mix(c,vec3(.8,.153,.192),smoothstep(.25,.55,t));
  c=mix(c,vec3(1.,.353,.118),smoothstep(.6,.88,t));
  return mix(c,vec3(1.,.76,.52),smoothstep(.9,1.,t));}

vec3 obsidian(vec2 p){
  float e=.004;float h=fbm(p*3.2);
  float hx=fbm((p+vec2(e,0.))*3.2);float hy=fbm((p+vec2(0.,e))*3.2);
  vec3 n=normalize(vec3((h-hx)*3./e*.01,(h-hy)*3./e*.01,1.));
  vec3 l=normalize(vec3(uPointer-p,.55));
  float spec=pow(max(dot(n,normalize(l+vec3(0.,0.,1.))),0.),42.);
  float sheen=pow(max(dot(n,normalize(vec3(-.4,.6,1.))),0.),12.);
  return vec3(.027,.026,.028)+h*vec3(.028,.027,.03)+spec*.16+sheen*.02;}

vec2 voronoi(vec2 x){vec2 n=floor(x),f=fract(x);float f1=8.,f2=8.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j));
    vec2 o=vec2(hash(n+g),hash(n+g+19.19));o=.5+.42*sin(uTime*.12+6.2831*o);
    vec2 r=g+o-f;float d=dot(r,r);
    if(d<f1){f2=f1;f1=d;}else if(d<f2){f2=d;}}
  return vec2(sqrt(f1),sqrt(f2));}

vec4 rift(vec2 p){
  float along=mix(p.x,p.y,uVertical);
  float across=mix(p.y,p.x,uVertical)-uCenter;
  float c=.04*(fbm(vec2(along*2.3+3.1,.37))-.5)+.012*(noise(vec2(along*13.,7.))-.5);
  float w=uWidth*(.8+.4*noise(vec2(along*3.1,1.3)));
  float dist=abs(across-c)-w;
  // Trazo inicial de la grieta: de arriba abajo (vertical) o de izquierda a derecha.
  float span=mix(uRes.x/uRes.y,1.,uVertical);
  float pos=mix(along+span*.5,.5-along,uVertical)/span;
  float drawn=smoothstep(pos-.08,pos,uDraw*1.08)*uIgnite;

  float open=smoothstep(0.,.06,uWidth);
  float rimW=mix(.004,.03,open);
  float flow=fbm(vec2(along*5.-uTime*.16,across*14.+uTime*.05));
  float molten=(1.-smoothstep(0.,rimW,abs(dist)))*drawn;
  float temp=molten*(.5+.6*flow)+molten*(1.-open)*.25;

  vec3 col=obsidian(p);
  float glow=exp(-max(dist,0.)*15.)*(.55+.2*sin(uTime*.8+along*5.))*drawn*(.35+.65*open);
  // uVeins: calor que se irradia a la roca (halo ancho, sin trazos finos tipo rayo).
  float halo=exp(-max(dist,0.)*5.)*uVeins*drawn*(.6+.4*flow);
  col+=ramp(.52)*glow*.42+ramp(.4)*halo*.18;
  col=mix(col,ramp(temp),smoothstep(0.,.9,molten));

  if(dist<-rimW){
    // Interior: transparente (foto del DOM) con la luz de la lava en el borde.
    float inner=exp((dist+rimW)*28.)*open;
    return vec4(ramp(.62)*inner*.55,inner*.5);
  }
  return vec4(col,1.);}

vec4 lake(vec2 p){
  vec2 q=p*2.6;
  q+=.32*vec2(fbm(q*.7+uTime*.025),fbm(q*.7+5.2-uTime*.02));
  vec2 v=voronoi(q);
  float seam=v.y-v.x;
  float heat=uHeat+.35*exp(-length(p-uPointer)*4.5);
  float glowSeam=smoothstep(.05*heat+.015,0.,seam);
  float halo=smoothstep(.28,0.,seam);
  float pool=smoothstep(.66-.1*heat,.82,fbm(p*1.25+vec2(uTime*.018,-uTime*.012)));
  float flow=fbm(q*3.+uTime*.08);
  float temp=max(glowSeam*(.42+.45*flow)*min(1.,heat+.2),pool*(.55+.3*flow));
  vec3 crust=vec3(.04,.034,.033)*(.65+.7*fbm(q*4.))+ramp(.32)*halo*.22*heat;
  return vec4(mix(crust,ramp(temp),smoothstep(.04,.55,temp)),1.);}

void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec4 c=uMode<.5?rift(p):lake(p);
  gl_FragColor=vec4(c.rgb*(uMode<.5?1.:c.a),c.a);}
`;

export interface MagmaState {
  /** Medio ancho de la grieta, en alturas de lienzo (0 = cerrada). */
  width: number;
  /** Posición del eje de la grieta, en px CSS desde el borde izquierdo (vertical) o superior (horizontal). */
  centerPx: number;
  vertical: boolean;
  /** Trazado de la grieta inicial (0–1) e intensidad del encendido (0–1). */
  draw: number;
  ignite: number;
  /** Vetas incandescentes en la roca cercana. */
  veins: number;
  /** Calor del lago (0–1). */
  heat: number;
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl'));
  } catch {
    return false;
  }
}

const UNIFORMS = ['uRes', 'uTime', 'uMode', 'uWidth', 'uCenter', 'uVertical', 'uDraw', 'uIgnite', 'uVeins', 'uHeat', 'uPointer'] as const;

export class Magma {
  readonly state: MagmaState = { width: 0, centerPx: 0, vertical: true, draw: 1, ignite: 1, veins: 0.6, heat: 0.5 };
  private gl: WebGLRenderingContext;
  private loc = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  private raf = 0;
  private visible = false;
  private running = false;
  private quality: number;
  private cssW = 0;
  private cssH = 0;
  private slow = 0;
  private lastFrame = 0;
  private t0 = performance.now();
  private pointer = { x: 0.3, y: 0.25, tx: 0.3, ty: 0.25 };
  private cleanups: Array<() => void> = [];

  constructor(
    private canvas: HTMLCanvasElement,
    mode: 'rift' | 'lake',
    private animate = true,
  ) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: 'default' });
    if (!gl) throw new Error('WebGL no disponible');
    this.gl = gl;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.quality = coarse ? 0.5 : 0.7;

    const prog = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const u of UNIFORMS) this.loc[u] = gl.getUniformLocation(prog, u);
    gl.uniform1f(this.loc.uMode, mode === 'rift' ? 0 : 1);

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.kick();
    });
    io.observe(canvas);
    const onVis = (): void => this.kick();
    document.addEventListener('visibilitychange', onVis);
    const onLost = (e: Event): void => {
      e.preventDefault();
      this.destroy();
      canvas.dispatchEvent(new CustomEvent('magma:lost', { bubbles: true }));
    };
    canvas.addEventListener('webglcontextlost', onLost);
    this.cleanups.push(
      () => ro.disconnect(),
      () => io.disconnect(),
      () => document.removeEventListener('visibilitychange', onVis),
      () => canvas.removeEventListener('webglcontextlost', onLost),
    );
    if (animate && !coarse) {
      const onMove = (e: PointerEvent): void => {
        const r = canvas.getBoundingClientRect();
        if (!r.height) return;
        this.pointer.tx = (e.clientX - r.left - r.width / 2) / r.height;
        this.pointer.ty = (r.height / 2 - (e.clientY - r.top)) / r.height;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      this.cleanups.push(() => window.removeEventListener('pointermove', onMove));
    }
    this.resize();
  }

  private resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.cssW = r.width;
    this.cssH = r.height;
    const w = Math.max(1, Math.round(r.width * this.quality));
    const h = Math.max(1, Math.round(r.height * this.quality));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    this.frame(performance.now());
  }

  /** Arranca o detiene el bucle según visibilidad. Sin animación, dibuja un fotograma. */
  kick(): void {
    const should = this.animate && this.visible && document.visibilityState === 'visible';
    if (should && !this.running) {
      this.running = true;
      this.lastFrame = 0;
      this.raf = requestAnimationFrame(this.loop);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
    if (!this.animate) this.frame(performance.now());
  }

  /** Redibujo puntual (p. ej. tras cambiar el estado con reduced-motion). */
  render(): void {
    if (!this.running) this.frame(performance.now());
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    // Calidad adaptativa: si los fotogramas tardan, se reduce la resolución interna.
    if (this.lastFrame) {
      const dt = now - this.lastFrame;
      this.slow = dt > 24 ? this.slow + 1 : Math.max(0, this.slow - 1);
      if (this.slow > 40 && this.quality > 0.35) {
        this.quality *= 0.8;
        this.slow = 0;
        this.resize();
      }
    }
    this.lastFrame = now;
    this.frame(now);
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(now: number): void {
    const { gl, loc, state: s, pointer: pt } = this;
    if (!this.cssH) return;
    pt.x += (pt.tx - pt.x) * 0.06;
    pt.y += (pt.ty - pt.y) * 0.06;
    const t = this.animate ? (now - this.t0) / 1000 : 12;
    const center = s.vertical ? (s.centerPx - this.cssW / 2) / this.cssH : (this.cssH / 2 - s.centerPx) / this.cssH;
    gl.uniform2f(loc.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(loc.uTime, t);
    gl.uniform1f(loc.uWidth, s.width);
    gl.uniform1f(loc.uCenter, center);
    gl.uniform1f(loc.uVertical, s.vertical ? 1 : 0);
    gl.uniform1f(loc.uDraw, s.draw);
    gl.uniform1f(loc.uIgnite, s.ignite);
    gl.uniform1f(loc.uVeins, s.veins);
    gl.uniform1f(loc.uHeat, s.heat);
    gl.uniform2f(loc.uPointer, pt.x, pt.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach((c) => c());
    this.cleanups = [];
  }
}
