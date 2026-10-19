// Camera colour filters. Each filter is a list of CSS filter operations: the live preview uses the
// CSS string on the <video>, and captured photos get the same operations applied pixel by pixel
// (canvas `ctx.filter` is missing on older iOS, so we don't rely on it).

type Op = ['grayscale' | 'sepia' | 'saturate' | 'brightness' | 'contrast' | 'hue-rotate', number];

export interface CamFilter {
  id: string;
  name: string;
  ops: Op[];
}

export const FILTERS: CamFilter[] = [
  { id: 'none', name: 'Normal', ops: [] },
  { id: 'bw', name: 'S/W', ops: [['grayscale', 1], ['contrast', 1.1]] },
  { id: 'vintage', name: 'Vintage', ops: [['sepia', 0.55], ['contrast', 1.05], ['brightness', 1.05], ['saturate', 0.9]] },
  { id: 'warm', name: 'Warm', ops: [['sepia', 0.3], ['saturate', 1.25], ['brightness', 1.03]] },
  { id: 'cool', name: 'Kühl', ops: [['hue-rotate', -15], ['saturate', 1.1], ['brightness', 1.02]] },
  { id: 'vivid', name: 'Kräftig', ops: [['saturate', 1.7], ['contrast', 1.12]] },
  { id: 'dreamy', name: 'Verträumt', ops: [['brightness', 1.12], ['contrast', 0.88], ['saturate', 1.15]] },
  { id: 'noir', name: 'Noir', ops: [['grayscale', 1], ['contrast', 1.45], ['brightness', 0.95]] },
  { id: 'rose', name: 'Rosé', ops: [['sepia', 0.35], ['hue-rotate', -30], ['saturate', 1.4]] },
];

export const cssFilter = (f: CamFilter) =>
  f.ops.map(([op, v]) => (op === 'hue-rotate' ? `hue-rotate(${v}deg)` : `${op}(${v})`)).join(' ') || 'none';

// 3×3 colour matrix + offset, following the Filter Effects spec definitions.
type M = { m: number[]; o: number };

function matrixFor([op, v]: Op): M {
  if (op === 'brightness') return { m: [v, 0, 0, 0, v, 0, 0, 0, v], o: 0 };
  if (op === 'contrast') return { m: [v, 0, 0, 0, v, 0, 0, 0, v], o: (0.5 - 0.5 * v) * 255 };
  if (op === 'grayscale') {
    const s = 1 - Math.min(1, v);
    return {
      m: [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s],
      o: 0,
    };
  }
  if (op === 'sepia') {
    const s = 1 - Math.min(1, v);
    return {
      m: [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s],
      o: 0,
    };
  }
  if (op === 'saturate') {
    const s = v;
    return {
      m: [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
      o: 0,
    };
  }
  // hue-rotate
  const a = (v * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return {
    m: [
      0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
    ],
    o: 0,
  };
}

/** Applies the filter to a canvas in place. */
export function applyFilter(canvas: HTMLCanvasElement, f: CamFilter) {
  if (!f.ops.length) return;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const ms = f.ops.map(matrixFor);
  const clamp = (x: number) => (x < 0 ? 0 : x > 255 ? 255 : x);
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    for (const { m, o } of ms) {
      const nr = clamp(m[0] * r + m[1] * g + m[2] * b + o);
      const ng = clamp(m[3] * r + m[4] * g + m[5] * b + o);
      const nb = clamp(m[6] * r + m[7] * g + m[8] * b + o);
      r = nr; g = ng; b = nb;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}
