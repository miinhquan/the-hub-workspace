import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Effects } from "../config";
import { amplitude, type OrbState } from "../engine/machine";
const vertex = `
uniform float uTime, uDistortion, uAmplitude;
varying vec3 vNormal, vPosition, vView;
void main(){
 vec3 phase=position*vec3(3.2,4.1,3.8)+uTime*vec3(.7,-.5,.4);
 vec3 s=sin(phase), c=cos(phase);
 float strength=uDistortion*.055;
 float pulse=position.y*7.+uTime*3.;
 float displacement=strength*s.x*c.y*s.z+.035*uAmplitude*sin(pulse);
 vec3 p=position+normal*displacement;
 // Differentiate the displacement along the sphere so reflections follow its surface.
 vec3 slope=strength*vec3(3.2*c.x*c.y*s.z,-4.1*s.x*s.y*s.z,3.8*s.x*c.y*c.z);
 slope.y+=.245*uAmplitude*cos(pulse);
 vec3 tangentSlope=slope-normal*dot(normal,slope);
 vPosition=p; vNormal=normalize(normalMatrix*(normal-tangentSlope/(1.+displacement)));
 vec4 view=modelViewMatrix*vec4(p,1.); vView=-view.xyz;
 gl_Position=projectionMatrix*view;
}`;
const fragment = `
precision highp float;
uniform float uTime, uNoise, uGlow, uAmplitude, uOpacity, uThinking;
uniform vec3 uPrimary, uSecondary;
varying vec3 vNormal, vPosition, vView;
float field(vec3 p){
 float n=sin(p.x*2.7+sin(p.y*3.4+uTime*.35))*cos(p.z*3.5-p.y*1.7+uTime*.22);
 n+=.45*sin(p.x*5.4-p.z*4.+sin(p.y*4.1-uTime*.4));
 n+=.18*cos(p.y*12.+p.x*5.+uTime*.25);
 return n;
}
void main(){
 vec3 n=normalize(vNormal), view=normalize(vView), p=vPosition;
 float flow=field(p*(1.+uNoise*.65));
 float ribbon=sin(p.y*5.5+p.x*2.3+flow*(2.7+uNoise*2.)+uTime*.2);
 float ridge=pow(abs(sin(flow*3.+p.y*2.-uTime*.15)),8.);
 vec3 pigment=mix(uPrimary*.65,uSecondary,smoothstep(-.75,.95,ribbon)*.83);
 pigment+=uSecondary*ridge*.065;
 float daylight=max(0.,dot(n,normalize(vec3(-.68,.85,.95))));
 vec3 color=pigment*(.28+.84*daylight);
 // A broad window reflection and weaker floor bounce sit above the moving pigment.
 vec3 reflected=reflect(-view,n);
 vec3 windowDirection=normalize(vec3(-.58,.8,.76));
 vec3 windowRight=normalize(cross(vec3(0.,1.,0.),windowDirection));
 vec3 windowUp=cross(windowDirection,windowRight);
 vec2 windowUV=vec2(dot(reflected,windowRight),dot(reflected,windowUp));
 vec2 windowDistance=windowUV*vec2(2.9,5.);
 float windowMask=smoothstep(.55,.95,dot(reflected,windowDirection));
 float windowLight=exp(-dot(windowDistance,windowDistance))*windowMask;
 float glint=(1.-smoothstep(.35,.9,length(windowUV*vec2(5.,9.))))*windowMask;
 float bounce=smoothstep(.5,1.,dot(reflected,normalize(vec3(.65,-.85,.28))));
 float fresnel=.035+.965*pow(1.-clamp(dot(n,view),0.,1.),5.);
 vec3 sky=mix(vec3(.17,.26,.39),vec3(.78,.91,1.),smoothstep(-.8,.65,reflected.y));
 color=mix(color,sky,fresnel*(.60+.30*uGlow));
 color+=vec3(.96,.985,1.)*(windowLight*.44+glint*.4)+vec3(.07,.12,.16)*bounce*.4;
 color+=uSecondary*uAmplitude*.1;
 color+=vec3(.05,.12,.2)*sin(flow*12.-uTime)*uThinking;
 gl_FragColor=vec4(max(color,vec3(0.)),uOpacity);
 #include <colorspace_fragment>
}`;
type Props = {
  config: Effects["orb"];
  state: OrbState;
  reduced: boolean;
  speed: number;
  muted?: boolean;
};
export default function Orb(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0, 0);
    renderer.setSize(500, 500, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 4.1;
    const uniforms = {
      uTime: { value: 0 },
      uDistortion: { value: 0.38 },
      uAmplitude: { value: 0 },
      uNoise: { value: 0.48 },
      uGlow: { value: 0.55 },
      uOpacity: { value: 1 },
      uThinking: { value: 0 },
      uPrimary: { value: new THREE.Color("#0546ac") },
      uSecondary: { value: new THREE.Color("#7bdcff") },
    };
    const geometry = new THREE.SphereGeometry(
      1,
      window.innerWidth < 600 ? 56 : 96,
      64,
    );
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    let frame = 0,
      visible = true,
      last = 0,
      time = 0,
      slowFrames = 0,
      samples = 0,
      lost = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    const resize = new ResizeObserver(() => {
      const size = element.clientWidth;
      if (size > 0) renderer.setSize(size, size, false);
    });
    resize.observe(element);
    const lose = (e: Event) => {
      e.preventDefault();
      lost = true;
      setFallback(true);
    };
    const restore = () => {
      lost = false;
      setFallback(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", lose);
    renderer.domElement.addEventListener("webglcontextrestored", restore);
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const delta = Math.min((now - last) / 1000, 0.1);
      const p = latest.current;
      if (now - last < (p.reduced ? 100 : 1000 / 60)) return;
      last = now;
      if (!visible || document.hidden || lost) return;
      if (!p.reduced) time += delta * p.speed * p.config.speed;
      const active =
        p.state === "LISTENING"
          ? p.config.listening
          : p.state === "SPEAKING"
            ? p.config.speaking
            : p.state === "THINKING"
              ? p.config.thinking
              : true;
      const amp =
        active && !p.reduced && !p.muted
          ? amplitude(time * 2, p.state) * p.config.sensitivity
          : 0;
      uniforms.uTime.value = time;
      uniforms.uAmplitude.value = THREE.MathUtils.lerp(
        uniforms.uAmplitude.value,
        amp,
        0.14,
      );
      uniforms.uDistortion.value = active ? p.config.distortion : 0;
      uniforms.uNoise.value = p.config.noise;
      uniforms.uGlow.value = p.config.glow;
      uniforms.uOpacity.value = p.config.opacity;
      uniforms.uThinking.value = p.state === "THINKING" && active ? 1 : 0;
      uniforms.uPrimary.value.set(p.config.primary);
      uniforms.uSecondary.value.set(p.config.secondary);
      const scale =
        1 +
        (p.reduced ? 0 : Math.sin(time * 1.8) * 0.015) +
        amp * p.config.pulse * 0.065;
      mesh.scale.setScalar(scale);
      mesh.rotation.y = time * p.config.rotation;
      mesh.rotation.z = 0.12 + Math.sin(time * 0.2) * 0.05;
      renderer.render(scene, camera);
      samples++;
      if (delta > 0.026) slowFrames++;
      if (samples === 120 && slowFrames > 40) renderer.setPixelRatio(1);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lose);
      renderer.domElement.removeEventListener("webglcontextrestored", restore);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className="orb-renderer"
      role="img"
      aria-label={`The Hub 3D agent orb: ${props.state.toLowerCase()}`}
      style={{ filter: `blur(${props.config.blur}px)` }}
    >
      <div
        className="orb-halo"
        style={{
          opacity: props.config.glow,
          background: `radial-gradient(ellipse,${props.config.secondary}65,transparent 66%)`,
        }}
      />
      <div className="orb-shadow" style={{ opacity: props.config.opacity }} />
      <div className="orb-canvas" ref={host} />
      {fallback && (
        <div
          className="orb-fallback"
          style={{
            backgroundColor: props.config.primary,
            backgroundImage: `radial-gradient(ellipse at 31% 19%, #ffffffe0, transparent 17%), radial-gradient(ellipse at 35% 28%, ${props.config.secondary} 4%, transparent 62%), linear-gradient(155deg, transparent 50%, #05173388 86%, ${props.config.secondary})`,
            opacity: props.config.opacity,
          }}
        />
      )}
    </div>
  );
}
