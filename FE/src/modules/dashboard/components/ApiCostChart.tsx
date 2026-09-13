import React, { useState } from 'react';
import { Card } from '../../../core/components/Card/Card';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import type { ChartPoint } from '../types';
import { CHART_DIMS, getChartX, getChartY, generateSmoothPath } from './chartUtils';
import '../styles/dashboard.scss';

interface ApiCostChartProps {
  data: ChartPoint[];
}

export const ApiCostChart: React.FC<ApiCostChartProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const selectedYear = '2026';

  const { width, height, paddingLeft, paddingRight, paddingTop } = CHART_DIMS;
  const chartHeight = height - paddingTop - CHART_DIMS.paddingBottom;
  const getX = (i: number) => getChartX(i, data.length);
  const getY = getChartY;

  const costPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.cost) }));
  const costLinePath = generateSmoothPath(costPoints);
  const costAreaPath = `${costLinePath} L ${costPoints[costPoints.length - 1].x} ${paddingTop + chartHeight} L ${costPoints[0].x} ${paddingTop + chartHeight} Z`;

  const reqPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.requests * 5) }));
  const reqLinePath = generateSmoothPath(reqPoints);


  return (
    <Card className="mf-chart-card">
      {/* Card Header */}
      <div className="mf-card-top-row">
        <div>
          <h3 className="mf-card-title">Chi phí và request API</h3>
          <p className="mf-card-subtitle">Dựa trên request log 7 ngày gần nhất</p>
        </div>
        <div className="mf-chart-header-actions">
          <button className="mf-icon-btn-subtle" title="Tùy chọn">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Legend and Year Selector */}
      <div className="mf-chart-controls">
        <div className="mf-chart-legend">
          <div className="mf-legend-item">
            <span className="mf-legend-dot mf-legend-dot--orange" />
            <span className="mf-legend-text">Chi phí API</span>
          </div>
          <div className="mf-legend-item">
            <span className="mf-legend-dot mf-legend-dot--dark" />
            <span className="mf-legend-text">Tổng API request</span>
          </div>
        </div>

        <div className="mf-year-dropdown">
          <span>{selectedYear}</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="mf-chart-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="mf-chart-svg">
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[240, 180, 120, 60, 0].map(val => (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={getY(val)}
                x2={width - paddingRight}
                y2={getY(val)}
                stroke="#F1F5F9"
                strokeDasharray={val === 0 ? 'none' : '3 3'}
              />
              <text
                x={paddingLeft - 8}
                y={getY(val) + 4}
                textAnchor="end"
                className="mf-chart-axis-text"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path d={costAreaPath} fill="url(#costGradient)" />

          {/* Line 1: Cost (Orange) */}
          <path d={costLinePath} fill="none" stroke="#F97316" strokeWidth="2.5" />

          {/* Line 2: Requests (Dark) */}
          <path d={reqLinePath} fill="none" stroke="#334155" strokeWidth="1.8" />

          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={d.day}
              x={getX(i)}
              y={height - 8}
              textAnchor="middle"
              className="mf-chart-axis-text"
            >
              {d.day}
            </text>
          ))}

          {/* Interactive Hover Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.cost)}
              r={hoveredPoint?.day === d.day ? 5 : 3.5}
              fill="#FFFFFF"
              stroke="#F97316"
              strokeWidth="2.5"
              className="mf-chart-dot"
              onMouseEnter={() => setHoveredPoint(d)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="mf-chart-tooltip animate-fade-in">
            <div className="mf-tooltip-title">{hoveredPoint.day}</div>
            <div className="mf-tooltip-row">
              <span className="mf-tooltip-label">Chi phí:</span>
              <span className="mf-tooltip-val">{hoveredPoint.cost} đ</span>
            </div>
            <div className="mf-tooltip-row">
              <span className="mf-tooltip-label">Requests:</span>
              <span className="mf-tooltip-val">{hoveredPoint.requests}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
