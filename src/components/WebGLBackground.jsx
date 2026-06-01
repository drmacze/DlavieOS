import { useEffect, useRef } from 'react';

const vertex = `attribute vec2 position; void main(){ gl_Position=vec4(position,0.0,1.0); }`;
const fragment = `precision highp float; uniform vec2 u_resolution; uniform float u_time; void main(){ vec2 uv=gl_FragCoord.xy/u_resolution.xy; vec2 p=(uv-.5)*2.; p.x*=u_resolution.x/u_resolution.y; float a=sin(p.x*2.4+u_time*.18)+cos(p.y*2.1-u_time*.22); float b=sin(length(p-vec2(sin(u_time*.08),cos(u_time*.07)))*4.2-u_time*.35); vec3 c=mix(vec3(.05,.03,.16),vec3(.38,.12,.95),smoothstep(-1.2,1.2,a)); c=mix(c,vec3(.02,.86,1.),smoothstep(.15,1.1,b)*.45); c+=vec3(.65,.34,1.)*(.16/length(p+vec2(.55,.25))); gl_FragColor=vec4(c,1.); }`;

export default function WebGLBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return undefined;
    const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1, -1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const res = gl.getUniformLocation(program, 'u_resolution'); const time = gl.getUniformLocation(program, 'u_time');
    let raf;
    const render = (t) => { const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(res, canvas.width, canvas.height); gl.uniform1f(time, t / 1000); gl.drawArrays(gl.TRIANGLES, 0, 6); raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="webgl-bg" aria-hidden="true" />;
}
