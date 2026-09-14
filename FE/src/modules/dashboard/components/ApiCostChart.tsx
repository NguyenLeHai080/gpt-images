import React, { useState } from 'react';
import type { ChartPoint } from '../types';
import { CHART_DIMS, getChartX, getChartY, generateSmoothPath } from './chartUtils';

interface ApiCostChartProps {
  data: ChartPoint[];
}

export const ApiCostChart: React.FC<ApiCostChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | 'year'>('7d');

  const { width, height, paddingLeft, paddingRight, paddingTop, paddingBottom } = CHART_DIMS;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  // 1. Tính toán giá trị max động từ dữ liệu thật
  const rawMaxCost = Math.max(...data.map((d) => d.cost || 0), 100);
  const roundUpMax = (num: number) => {
    if (num <= 100) return 100;
    if (num <= 500) return 500;
    if (num <= 1000) return 1000;
    if (num <= 2000) return 2000;
    if (num <= 5000) return 5000;
    if (num <= 10000) return 10000;
    const factor = Math.pow(10, Math.floor(Math.log10(num)));
    return Math.ceil(num / factor) * factor;
  };
  const maxCost = roundUpMax(rawMaxCost);

  const rawMaxReq = Math.max(...data.map((d) => d.requests || 0), 5);
  const maxReq = Math.ceil(rawMaxReq / 5) * 5 || 10;

  // 2. Tọa độ đường Chi phí (VND)
  const costPoints = data.map((d, i) => ({
    x: getChartX(i, data.length),
    y: getChartY(d.cost, maxCost),
  }));
  const costLinePath = generateSmoothPath(costPoints);
  const costAreaPath = costPoints.length > 0
    ? `${costLinePath} L ${costPoints[costPoints.length - 1].x} ${paddingTop + chartHeight} L ${costPoints[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // 3. Tọa độ đường Requests
  const reqPoints = data.map((d, i) => ({
    x: getChartX(i, data.length),
    y: getChartY(d.requests, maxReq),
  }));
  const reqLinePath = generateSmoothPath(reqPoints);

  // 4. Mốc Y-Axis (4 vạch)
  const yTicks = [
    maxCost,
    Math.round(maxCost * 0.75),
    Math.round(maxCost * 0.5),
    Math.round(maxCost * 0.25),
    0,
  ];

  const formatCostLabel = (val: number) => {
    if (val === 0) return '0đ';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M đ`;
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k đ`;
    return `${val}đ`;
  };

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Biểu Đồ Chi Phí & Lưu Lượng API
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Thời gian thực
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thống kê chi phí tiêu hao (VNĐ) và tần suất gọi model gpt-image-2
          </p>
        </div>

        {/* Range Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveRange('7d')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeRange === '7d'
                ? 'bg-white text-brand-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => setActiveRange('30d')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeRange === '30d'
                ? 'bg-white text-brand-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 ngày
          </button>
          <button
            type="button"
            onClick={() => setActiveRange('year')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeRange === 'year'
                ? 'bg-white text-brand-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Năm 2026
          </button>
        </div>
      </div>

      {/* Legend Stats Bar */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 flex-wrap text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-500" />
            <span className="font-semibold text-slate-700">Chi phí tiêu thụ (VNĐ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500" />
            <span className="font-semibold text-slate-700">Lưu lượng Request (lượt)</span>
          </div>
        </div>

        {hoveredData && (
          <div className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-2">
            <span>📅 {hoveredData.day}:</span>
            <span className="text-brand-600">{hoveredData.cost.toLocaleString()} đ</span>
            <span className="text-slate-300">•</span>
            <span className="text-sky-600">{hoveredData.requests} reqs</span>
          </div>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full pt-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="costGradientNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="reqGradientNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-Axis Labels */}
          {yTicks.map((val, idx) => {
            const y = getChartY(val, maxCost);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px] font-semibold"
                >
                  {formatCostLabel(val)}
                </text>
              </g>
            );
          })}

          {/* Cost Area Fill */}
          <path d={costAreaPath} fill="url(#costGradientNew)" />

          {/* Cost Line (Brand Orange) */}
          <path
            d={costLinePath}
            fill="none"
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Request Line (Sky Blue) */}
          <path
            d={reqLinePath}
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeLinecap="round"
          />

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const x = getChartX(i, data.length);
            const isHovered = hoveredIndex === i;
            return (
              <g key={d.day}>
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-bold transition-all ${
                    isHovered ? 'fill-brand-600 font-extrabold' : 'fill-slate-500 font-medium'
                  }`}
                >
                  {d.day}
                </text>
              </g>
            );
          })}

          {/* Interactive Hover Dots & Vertical Guide */}
          {data.map((d, i) => {
            const cx = getChartX(i, data.length);
            const cyCost = getChartY(d.cost, maxCost);
            const cyReq = getChartY(d.requests, maxReq);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Transparent hit area */}
                <rect
                  x={cx - chartWidth / (data.length * 2)}
                  y={paddingTop}
                  width={chartWidth / data.length}
                  height={chartHeight}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={cx}
                    y1={paddingTop}
                    x2={cx}
                    y2={paddingTop + chartHeight}
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Dot for Cost */}
                <circle
                  cx={cx}
                  cy={cyCost}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />

                {/* Dot for Requests */}
                <circle
                  cx={cx}
                  cy={cyReq}
                  r={isHovered ? 4.5 : 3}
                  fill="#FFFFFF"
                  stroke="#0EA5E9"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
