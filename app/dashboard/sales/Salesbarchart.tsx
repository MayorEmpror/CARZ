"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { MonthlyTotal } from "./Salesaggregations";

type Props = {
  data: MonthlyTotal[];
};

const PURPLE = "#7C7CF0";
const ORANGE = "#F0876B";

export default function SalesBarChart({ data }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = 320;
    const margin = { top: 10, right: 10, bottom: 24, left: 36 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.month))
      .range([margin.left, width - margin.right])
      .paddingInner(0.4);

    const x1 = d3
      .scaleBand()
      .domain(["completed", "pending"])
      .range([0, x0.bandwidth()])
      .padding(0.25);

    const maxVal = d3.max(data, (d) => Math.max(d.completed, d.pending)) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15 || 1])
      .range([height - margin.bottom, margin.top]);

    // gridlines
    svg
      .append("g")
      .attr("stroke", "#2a2a2e")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d));

    // y axis labels
    svg
      .append("g")
      .selectAll("text")
      .data(y.ticks(5))
      .join("text")
      .attr("x", margin.left - 10)
      .attr("y", (d) => y(d))
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", "#7a7a80")
      .attr("font-size", 11)
      .text((d) => (d >= 1000 ? `${d / 1000}k` : `${d}`));

    // x axis labels
    svg
      .append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", (d) => (x0(d.month) ?? 0) + x0.bandwidth() / 2)
      .attr("y", height - 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#7a7a80")
      .attr("font-size", 11)
      .text((d) => d.month);

    const groups = svg
      .append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", (d) => `translate(${x0(d.month)},0)`);

    groups
      .append("rect")
      .attr("x", x1("completed") ?? 0)
      .attr("width", x1.bandwidth())
      .attr("y", (d) => y(d.completed))
      .attr("height", (d) => y(0) - y(d.completed))
      .attr("rx", 3)
      .attr("fill", PURPLE);

    groups
      .append("rect")
      .attr("x", x1("pending") ?? 0)
      .attr("width", x1.bandwidth())
      .attr("y", (d) => y(d.pending))
      .attr("height", (d) => y(0) - y(d.pending))
      .attr("rx", 3)
      .attr("fill", ORANGE);
  }, [data]);

  return (
    <div ref={wrapperRef} className="w-full">
      <svg ref={ref} />
    </div>
  );
}