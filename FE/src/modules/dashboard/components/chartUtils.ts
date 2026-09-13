export const CHART_DIMS = {
  width: 640,
  height: 200,
  paddingLeft: 45,
  paddingBottom: 30,
  paddingTop: 15,
  paddingRight: 20,
  maxY: 240,
};

export const getChartX = (index: number, total: number) => {
  const chartWidth = CHART_DIMS.width - CHART_DIMS.paddingLeft - CHART_DIMS.paddingRight;
  return CHART_DIMS.paddingLeft + (index / (total - 1)) * chartWidth;
};

export const getChartY = (val: number) => {
  const chartHeight = CHART_DIMS.height - CHART_DIMS.paddingTop - CHART_DIMS.paddingBottom;
  return CHART_DIMS.paddingTop + chartHeight - (val / CHART_DIMS.maxY) * chartHeight;
};

export const generateSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return '';
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