/** Shared Dirac / ket–bra notation helpers (LaTeX + plain text for canvas/SVG). */

const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉';

export function toSubscript(value) {
  if (value == null || value === '') return '';
  return String(value)
    .split('')
    .map(ch => (ch >= '0' && ch <= '9' ? SUBSCRIPT_DIGITS[ch.charCodeAt(0) - 48] : ch))
    .join('');
}

/** LaTeX: |symbol⟩ or |symbol⟩_{sub} */
export function ketLatex(symbol, sub) {
  const body = String(symbol).replace(/\\/g, '\\\\');
  if (sub != null && sub !== '') {
    return `|${body}\\rangle_{${sub}}`;
  }
  return `|${body}\\rangle`;
}

/** LaTeX for computational basis |00⟩, |101⟩, etc. */
export function basisKetLatex(bits) {
  return ketLatex(bits);
}

/** Plain text / canvas: |0⟩₀ */
export function ketPlain(symbol, sub) {
  const subPart = sub != null && sub !== '' ? toSubscript(sub) : '';
  return `|${symbol}⟩${subPart}`;
}

export function basisKetPlain(bits) {
  return ketPlain(bits);
}

export function psiKetLatex(sub) {
  if (sub != null && sub !== '') {
    return `|\\psi_{${sub}}\\rangle`;
  }
  return '|\\psi\\rangle';
}

export function psiKetPlain(sub) {
  if (sub != null && sub !== '') {
    return `|ψ${toSubscript(sub)}⟩`;
  }
  return '|ψ⟩';
}

/** Parse legacy strings like |00⟩ or |0⟩_0 into { symbol, sub }. */
export function parseLegacyKetString(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^\|([^|⟩]+)⟩(?:_\{([^}]+)\}|_(\d+))?$/);
  if (!m) return null;
  return { symbol: m[1], sub: m[2] ?? m[3] ?? null };
}

/** Build LaTeX superposition string from amplitude map, e.g. 0.5|00⟩ + 0.5|11⟩ */
export function superpositionLatex(terms) {
  return terms
    .filter(t => Math.abs(t.amplitude) > 1e-6)
    .map(t => {
      const amp =
        typeof t.amplitude === 'number'
          ? (Math.abs(t.amplitude - 1) < 1e-6 ? '' : `${formatAmp(t.amplitude)}`)
          : t.amplitude;
      const sign = t.amplitude < 0 ? '-' : '+';
      const ket = basisKetLatex(t.bits ?? t.state);
      if (!amp) return ket;
      return `${sign === '-' ? '- ' : '+ '}${amp}${ket}`;
    })
    .join(' ')
    .replace(/^\+\s/, '');
}

function formatAmp(a) {
  const invSqrt2 = 1 / Math.sqrt(2);
  if (Math.abs(a - invSqrt2) < 0.01) return '\\tfrac{1}{\\sqrt{2}}';
  if (Math.abs(a - 0.5) < 0.01) return '\\tfrac{1}{2}';
  return a.toFixed(3);
}

/** Regex for |x⟩ optional _{sub} or _digit */
export const LEGACY_KET_REGEX = /\|([^|⟩]+)⟩(?:_\{([^}]+)\}|_(\d+))?/g;
