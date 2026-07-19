"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { StatusSlice } from "./Salesaggregations";

type Props = {
  data: StatusSlice[];
};

const COLORS = ["#7C7CF0", "#F0876B", "#F0C86B", "#6BC7F0", "#B26BF0"];

export default function SalesDonutChart({ data }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const size = 220;
    const thickness = 26;
    const radius = size / 2;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size).attr("viewBox", `0 0 ${size} ${size}`);

    const g = svg.append("g").attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<StatusSlice>()
      .value((d) => d.count)
      .padAngle(0.03)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<StatusSlice>>()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .cornerRadius(6);

    g.selectAll("path")
      .data(pie(data))
      .join("path")
      .attr("d", arc)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#141416")
      .attr("stroke-width", 2);
  }, [data]);

  return <svg ref={ref} />;
}