import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { basisKetPlain } from './quantumNotation';

export default function Visualization({ data }) {
  const svgRef = useRef(null);

  const chartSignature = useMemo(() => {
    if (!data?.probabilities) return '';
    return data.probabilities
      .map(p => `${p.state}:${Number(p.probability).toFixed(8)}`)
      .join('|');
  }, [data]);

  useEffect(() => {
    if (!data || !data.probabilities) return;

    const probabilities = data.probabilities;
    const svgEl = svgRef.current;
    const ketLabel = d => basisKetPlain(d.state);
    
    // Set up dimensions suitable for a narrow column
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const width = 350 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    svg
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("max-height", "400px"); // Ensure it doesn't get ridiculously tall

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scaleBand()
      .range([0, width])
      .domain(probabilities.map(ketLabel))
      .padding(0.4);

    // Y Scale
    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 1]); // Probability is always between 0 and 1

    // Add X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-family", "var(--font-mono)")
      .style("font-size", "14px")
      .style("fill", "var(--color-seeing-text)");

    // Clean up axes styling
    g.selectAll(".domain").attr("stroke", "var(--color-seeing-border)");
    g.selectAll(".tick line").attr("stroke", "var(--color-seeing-border)");

    // Add Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
      .selectAll("text")
      .style("font-family", "var(--font-sans)")
      .style("fill", "var(--color-seeing-subtext)");

    // Add bars
    g.selectAll(".bar")
      .data(probabilities)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(ketLabel(d)))
      .attr("width", x.bandwidth())
      .attr("y", height) // start from bottom for animation
      .attr("height", 0)
      .attr("fill", "var(--color-seeing-accent)")
      .attr("rx", 4) // rounded corners
      .attr("opacity", 0.8)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.probability))
      .attr("height", d => height - y(d.probability));

    // Add tooltips / hover effects
    g.selectAll(".bar")
      .on("mouseover", function() {
        d3.select(this)
          .transition().duration(200)
          .attr("opacity", 1)
          .attr("fill", "var(--color-seeing-pink)");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition().duration(200)
          .attr("opacity", 0.8)
          .attr("fill", "var(--color-seeing-accent)");
      });

    // Add text labels on top of bars
    g.selectAll(".label")
      .data(probabilities)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(ketLabel(d)) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-family", "var(--font-sans)")
      .style("font-size", "12px")
      .style("fill", "var(--color-seeing-text)")
      .style("opacity", 0)
      .transition()
      .duration(800)
      .delay(200)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.probability) - 8)
      .style("opacity", d => d.probability > 0.01 ? 1 : 0)
      .text(d => d3.format(".1%")(d.probability));

    return () => {
      if (svgEl) {
        d3.select(svgEl).selectAll('*').interrupt();
      }
    };
  }, [chartSignature, data]);

  return (
    <div className="flex justify-center p-8 bg-white seeing-shadow rounded-2xl border border-seeing-border/50">
      <svg ref={svgRef}></svg>
    </div>
  );
}
