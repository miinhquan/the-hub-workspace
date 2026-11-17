import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Effects } from "../config";
import { amplitude, type OrbState } from "../engine/machine";
const vertex = `
uniform float uTime, uDistortion, uAmplitude;
varying vec3 vNormal, vPosition, vView;
float wave(vec3 p) { return sin(p.x*3.2+uTime*.7)*cos(p.y*4.1-uTime*.5)*sin(p.z*3.8+uTime*.4); }
void main(){
 vec3 p=position;
 float displacement=wave(p)*uDistortion*.075+sin(p.y*7.+uTime*3.)*uAmplitude*.035;
 p+=normal*displacement;
 vPosition=p; vNormal=normalize(normalMatrix*normal);
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
 float fresnel=pow(1.-max(dot(n,view),0.),2.6);
 float flow=field(p*(1.+uNoise*.65));
 float ribbon=sin(p.y*5.5+p.x*2.3+flow*(2.7+uNoise*2.)+uTime*.2);
 float ridge=pow(abs(sin(flow*3.+p.y*2.-uTime*.15)),8.);
 float light=max(dot(n,normalize(vec3(-.7,1.,1.7))),0.);
 vec3 deep=uPrimary*.38;
 vec3 color=mix(deep,uPrimary,smoothstep(-1.,.3,ribbon));
 color=mix(color,uSecondary,smoothstep(.05,1.,ribbon)*.85);
 color+=uSecondary*ridge*.17;
 color*=.58+light*.5;
 float spec=pow(max(dot(reflect(-normalize(vec3(-.5,1.,2.)),n),view),0.),65.);
 color+=vec3(1.)*spec*.85;
 float stripe=pow(max(0.,1.-abs(ribbon-.45)*2.4),16.);
 color+=vec3(.45,.7,.9)*stripe*.16;
 color=mix(color,vec3(.87,.96,1.),fresnel*(.45+uGlow*.35));
 color+=uSecondary*uAmplitude*.1;
 color+=vec3(.05,.12,.2)*sin(flow*12.-uTime)*uThinking;
 gl_FragColor=vec4(color,uOpacity*(.97-fresnel*.12));
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
      <div className="orb-canvas" ref={host} />
      {fallback && (
        <div className="orb-fallback">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <radialGradient id="orb-fallback">
                <stop stopColor={props.config.secondary} />
                <stop offset="1" stopColor={props.config.primary} />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="85" fill="url(#orb-fallback)" />
            <path
              d="M22 100Q100 15 178 100Q100 185 22 100M40 50Q170 85 65 175"
              fill="none"
              stroke="white"
              opacity=".3"
              strokeWidth="8"
            />
          </svg>
          <small>Simplified graphics</small>
        </div>
      )}
    </div>
  );
}
