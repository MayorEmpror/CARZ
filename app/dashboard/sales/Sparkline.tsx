"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Props = {
  data: number[];
  color: string;
  width?: number;
  height?: number;
};

export default function Sparkline({ data, color, width = 90, height = 36 }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const padding = 4;
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([padding, width - padding]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(data) as number, d3.max(data) as number])
      .range([height - padding, padding]);

    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round");
  }, [data, color, width, height]);

  return <svg ref={ref} width={width} height={height} />;
}