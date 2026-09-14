export const CHART_DIMS = {
  width: 680,
  height: 220,
  paddingLeft: 60,
  paddingBottom: 35,
  paddingTop: 20,
  paddingRight: 25,
};

export const getChartX = (index: number, total: number) => {
  if (total <= 1) return CHART_DIMS.paddingLeft;
  const chartWidth = CHART_DIMS.width - CHART_DIMS.paddingLeft - CHART_DIMS.paddingRight;
  return CHART_DIMS.paddingLeft + (index / (total - 1)) * chartWidth;
};

export const getChartY = (val: number, maxY: number) => {
  const chartHeight = CHART_DIMS.height - CHART_DIMS.paddingTop - CHART_DIMS.paddingBottom;
  const safeMax = maxY > 0 ? maxY : 100;
  const ratio = Math.min(Math.max(val / safeMax, 0), 1);
  return CHART_DIMS.paddingTop + chartHeight - ratio * chartHeight;
};

export const generateSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  return d;
};