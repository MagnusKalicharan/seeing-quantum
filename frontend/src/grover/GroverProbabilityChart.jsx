import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

export default function GroverProbabilityChart({
  probabilities,
  targetState,
  animate = true,
}) {
  const svgRef = useRef(null);

  const signature = useMemo(
    () =>
      probabilities
        .map((p) => `${p.state}:${Number(p.probability).toFixed(8)}`)
        .join('|'),
    [probabilities]
  );

  useEffect(() => {
    if (!probabilities?.length) return;
    const svgEl = svgRef.current;
    const margin = { top: 24, right: 16, bottom: 48, left: 44 };
    const width = Math.max(320, probabilities.length * 36);
    const height = 220;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

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
      .domain(probabilities.map((d) => d.state))
      .range([0, innerW])
      .padding(0.25);

    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#71717A');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%')))
      .selectAll('text')
      .style('fill', '#71717A');

    const bars = g
      .selectAll('.prob-bar')
      .data(probabilities)
      .enter()
      .append('rect')
      .attr('class', 'prob-bar')
      .attr('x', (d) => x(d.state))
      .attr('width', x.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d) =>
        d.state === targetState ? '#B75D29' : 'rgba(183, 93, 41, 0.35)'
      )
      .attr('opacity', 0.9);

    if (animate) {
      bars
        .attr('y', innerH)
        .attr('height', 0)
        .transition()
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr('y', (d) => y(d.probability))
        .attr('height', (d) => innerH - y(d.probability));
    } else {
      bars
        .attr('y', (d) => y(d.probability))
        .attr('height', (d) => innerH - y(d.probability));
    }

    g.selectAll('.prob-label')
      .data(probabilities)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.state) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.probability) - 6)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#2A2A2A')
      .text((d) => (d.probability > 0.008 ? d3.format('.1%')(d.probability) : ''));

    return () => {
      if (svgEl) d3.select(svgEl).selectAll('*').interrupt();
    };
  }, [signature, targetState, animate, probabilities]);

  return (
    <div className="w-full overflow-x-auto">
      <p className="text-[11px] text-[#71717A] mb-2 text-center">
        Probability P = |α|² (always non-negative).
      </p>
      <svg ref={svgRef} className="min-w-full" />
    </div>
  );
}
