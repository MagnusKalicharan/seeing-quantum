import React, { useMemo } from 'react';
import katex from 'katex';
import { LEGACY_KET_REGEX } from './quantumNotation';

/**
 * Renders |symbol⟩ with optional subscript (Dirac ket), e.g. |0⟩₀
 */
export function Ket({ value, sub, className = '' }) {
  return (
    <span className={`quantum-ket inline-flex items-baseline whitespace-nowrap font-serif ${className}`}>
      <span>|{value}⟩</span>
      {sub != null && sub !== '' && (
        <sub className="font-sans text-[0.68em] leading-none ml-[0.05em] relative top-[0.2em] tabular-nums">
          {sub}
        </sub>
      )}
    </span>
  );
}

export function BasisKet({ bits, className }) {
  return <Ket value={bits} className={className} />;
}

export function QubitKet({ qubitIndex, className }) {
  return <Ket value="0" sub={qubitIndex} className={className} />;
}

/** Inline LaTeX via KaTeX (pass content without outer $ delimiters). */
export function MathInline({ children, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(String(children), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return String(children);
    }
  }, [children]);

  return (
    <span
      className={`quantum-math-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Display-mode LaTeX block. */
export function MathBlock({ children, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(String(children), {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return String(children);
    }
  }, [children]);

  return (
    <div
      className={`quantum-math-block text-center overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Parses plain text containing legacy |…⟩ tokens into React nodes with proper kets.
 */
export function QuantumText({ children, className = '', as: Tag = 'span' }) {
  if (children == null) return null;
  if (typeof children !== 'string') {
    return <Tag className={className}>{children}</Tag>;
  }

  const parts = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(LEGACY_KET_REGEX.source, 'g');

  while ((match = re.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }
    const sub = match[2] ?? match[3];
    parts.push(
      <Ket key={`${match.index}-${match[1]}`} value={match[1]} sub={sub} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <Tag className={className}>{parts[0]}</Tag>;
  }

  return <Tag className={className}>{parts}</Tag>;
}

/** Split text on **bold** markers and render kets inside each segment. */
export function QuantumRichText({ text, className = '' }) {
  if (!text) return null;
  return (
    <span className={className}>
      {text.split('**').map((segment, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-[#B75D29] font-medium">
            <QuantumText>{segment}</QuantumText>
          </strong>
        ) : (
          <QuantumText key={i}>{segment}</QuantumText>
        )
      )}
    </span>
  );
}
