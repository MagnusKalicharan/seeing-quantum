import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { basisKetPlain } from '../quantumNotation';

/**
 * Signed real-amplitude bars (phase visible) + optional mean line for diffuser step.
 */
export default function GroverAmplitudeChart({
  amplitudes,
  targetState,
  meanAmplitude = null,
  animate = true,
}) {
  const svgRef = useRef(null);

  const signature = useMemo(
    () =>
      amplitudes
        .map((a) => `${a.state}:${a.re.toFixed(6)}:${a.im.toFixed(6)}`)
        .join('|'),
    [amplitudes]
  );

  useEffect(() => {
    if (!amplitudes?.length) return;
    const svgEl = svgRef.current;
    const margin = { top: 24, right: 16, bottom: 48, left: 48 };
    const width = Math.max(320, amplitudes.length * 36);
    const height = 220;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const maxAbs = Math.max(
      0.05,
      ...amplitudes.map((a) => Math.abs(a.re))
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(amplitudes.map((d) => d.state))
      .range([0, innerW])
      .padding(0.25);

    const y = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([innerH, 0]);

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', '#E4E4E7')
      .attr('stroke-width', 1);

    if (meanAmplitude != null) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', y(meanAmplitude))
        .attr('y2', y(meanAmplitude))
        .attr('stroke', '#B75D29')
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.8);
    }

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#71717A');

    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2f')));

    const bars = g
      .selectAll('.amp-bar')
      .data(amplitudes)
      .enter()
      .append('rect')
      .attr('class', 'amp-bar')
      .attr('x', (d) => x(d.state))
      .attr('width', x.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d) => {
        if (d.state === targetState) return d.re < 0 ? '#DC2626' : '#B75D29';
        return d.re < 0 ? '#93C5FD' : '#D4D4D8';
      })
      .attr('stroke', (d) => (d.state === targetState ? '#9A4C20' : 'none'))
      .attr('stroke-width', (d) => (d.state === targetState ? 2 : 0));

    if (animate) {
      bars
        .attr('y', y(0))
        .attr('height', 0)
        .transition()
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr('y', (d) => (d.re >= 0 ? y(d.re) : y(0)))
        .attr('height', (d) => Math.abs(y(d.re) - y(0)));
    } else {
      bars
        .attr('y', (d) => (d.re >= 0 ? y(d.re) : y(0)))
        .attr('height', (d) => Math.abs(y(d.re) - y(0)));
    }

    g.selectAll('.amp-label')
      .data(amplitudes)
      .enter()
      .append('text')
      .attr('class', 'amp-label')
      .attr('x', (d) => x(d.state) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.re) + (d.re >= 0 ? -6 : 14))
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#2A2A2A')
      .text((d) => (Math.abs(d.re) > 0.001 ? d.re.toFixed(2) : ''));

    return () => {
      if (svgEl) d3.select(svgEl).selectAll('*').interrupt();
    };
  }, [signature, targetState, meanAmplitude, animate, amplitudes]);

  return (
    <div className="w-full overflow-x-auto">
      <p className="text-[11px] text-[#71717A] mb-2 text-center">
        Real part of amplitude (sign = phase). Labels {basisKetPlain('…')} in Qiskit order.
      </p>
      <svg ref={svgRef} className="min-w-full" />
    </div>
  );
}
