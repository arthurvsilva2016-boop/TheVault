// Simple deterministic noise
export function hash(n: number) {
  n = Math.sin(n) * 43758.5453123;
  return n - Math.floor(n);
}

export function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

export function noise2D(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = xf * xf * (3.0 - 2.0 * xf);
  const v = yf * yf * (3.0 - 2.0 * yf);

  const a = hash(xi + yi * 57);
  const b = hash(xi + 1 + yi * 57);
  const c = hash(xi + (yi + 1) * 57);
  const d = hash(xi + 1 + (yi + 1) * 57);

  const x1 = lerp(a, b, u);
  const x2 = lerp(c, d, u);

  return lerp(x1, x2, v);
}

export function fbm(x: number, y: number, octaves = 4) {
  let v = 0;
  let a = 0.5;
  let shift = 100.0;
  for (let i = 0; i < octaves; i++) {
    v += a * noise2D(x, y);
    x = x * 2.0 + shift;
    y = y * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}
