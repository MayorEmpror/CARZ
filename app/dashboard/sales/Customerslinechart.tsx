"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CustomerTrendPoint } from "./Salesaggregations";

type Props = {
  data: CustomerTrendPoint[];
};

const PURPLE = "#7C7CF0";
const ORANGE = "#F0876B";

export default function CustomersLineChart({ data }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = 260;
    const margin = { top: 10, right: 10, bottom: 24, left: 32 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.month))
      .range([margin.left, width - margin.right]);

    const maxVal = d3.max(data, (d) => Math.max(d.newCustomers, d.returningCustomers)) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.2 || 1])
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("stroke", "#2a2a2e")
      .selectAll("line")
      .data(y.ticks(4))
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d));

    svg
      .append("g")
      .selectAll("text")
      .data(y.ticks(4))
      .join("text")
      .attr("x", margin.left - 8)
      .attr("y", (d) => y(d))
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", "#7a7a80")
      .attr("font-size", 11)
      .text((d) => (d >= 1000 ? `${d / 1000}k` : `${d}`));

    svg
      .append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", (d) => x(d.month) ?? 0)
      .attr("y", height - 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#7a7a80")
      .attr("font-size", 11)
      .text((d) => d.month);

    const makeLine = (key: "returningCustomers" | "newCustomers") =>
      d3
        .line<CustomerTrendPoint>()
        .x((d) => x(d.month) ?? 0)
        .y((d) => y(d[key]))
        .curve(d3.curveBasis);

    svg
      .append("path")
      .datum(data)
      .attr("d", makeLine("returningCustomers"))
      .attr("fill", "none")
      .attr("stroke", PURPLE)
      .attr("stroke-width", 2.5);

    svg
      .append("path")
      .datum(data)
      .attr("d", makeLine("newCustomers"))
      .attr("fill", "none")
      .attr("stroke", ORANGE)
      .attr("stroke-width", 2.5);
  }, [data]);

  return (
    <div ref={wrapperRef} className="w-full">
      <svg ref={ref} />
    </div>
  );
}