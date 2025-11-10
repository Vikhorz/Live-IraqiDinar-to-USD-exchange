import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { RateHistoryEntry, Translation } from '../types';

interface RateHistoryChartProps {
  history: RateHistoryEntry[];
  t: Translation;
}

const SVG_WIDTH = 380;
const SVG_HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 55 };
const Y_AXIS_TICKS = 5;

export const RateHistoryChart: React.FC<RateHistoryChartProps> = ({ history, t }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; rate: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const processedData = useMemo(() => {
        if (!history || history.length < 2) return null;
        return history
            .map(d => ({ ...d, date: new Date(d.date) }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [history]);

    const scales = useMemo(() => {
        if (!processedData) return null;

        const rates = processedData.map(d => d.rate);
        const dates = processedData.map(d => d.date.getTime());

        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const ratePadding = (maxRate - minRate) * 0.1 || 100;

        return {
            minRate: minRate - ratePadding,
            maxRate: maxRate + ratePadding,
            minDate: Math.min(...dates),
            maxDate: Math.max(...dates),
        };
    }, [processedData]);

    const { pathD, areaPathD, yAxisLabels, xAxisLabels } = useMemo(() => {
        if (!processedData || !scales) return { pathD: '', areaPathD: '', yAxisLabels: [], xAxisLabels: [] };

        const { minRate, maxRate, minDate, maxDate } = scales;
        const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
        const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

        const getX = (date: Date) => PADDING.left + ((date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const getY = (rate: number) => PADDING.top + chartHeight - ((rate - minRate) / (maxRate - minRate)) * chartHeight;

        let path = '';
        processedData.forEach((d, i) => {
            const command = i === 0 ? 'M' : 'L';
            path += `${command}${getX(d.date)},${getY(d.rate)} `;
        });

        const areaPath = `${path} V${SVG_HEIGHT - PADDING.bottom} H${PADDING.left} Z`;

        const yLabels = [];
        for (let i = 0; i < Y_AXIS_TICKS; i++) {
            const rate = minRate + (i / (Y_AXIS_TICKS - 1)) * (maxRate - minRate);
            yLabels.push({
                y: getY(rate),
                label: Math.round(rate / 100) * 100,
            });
        }
        
        const xLabels = [];
        const first = processedData[0];
        const last = processedData[processedData.length - 1];
        if (first) xLabels.push({ x: getX(first.date), label: first.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
        if (last && last.date.getDate() !== first.date.getDate()) xLabels.push({ x: getX(last.date), label: last.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });

        return { pathD: path, areaPathD: areaPath, yAxisLabels: yLabels, xAxisLabels: xLabels };
    }, [processedData, scales]);

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        if (!processedData || !scales || !svgRef.current) return;

        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const { x: mouseX } = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());

        const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
        const { minDate, maxDate, minRate, maxRate } = scales;

        const getX = (date: Date) => PADDING.left + ((date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const getY = (rate: number) => PADDING.top + (SVG_HEIGHT - PADDING.top - PADDING.bottom) - ((rate - minRate) / (maxRate - minRate)) * (SVG_HEIGHT - PADDING.top - PADDING.bottom);

        let closestPoint = processedData[0];
        let minDistance = Infinity;
        for (const point of processedData) {
            const pointX = getX(point.date);
            const distance = Math.abs(pointX - mouseX);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }
        
        setTooltip({
            x: getX(closestPoint.date),
            y: getY(closestPoint.rate),
            date: closestPoint.date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
            rate: closestPoint.rate
        });
    }, [processedData, scales]);
    
    if (!processedData) {
        return <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">{t.noHistoryData}</p>;
    }

    return (
        <div className="relative">
            <svg ref={svgRef} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} className="w-full h-auto">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="text-sky-400 dark:text-sky-500" stopOpacity={0.4} />
                        <stop offset="100%" className="text-sky-400 dark:text-sky-500" stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {yAxisLabels.map(({ y, label }) => (
                    <g key={label}>
                        <line x1={PADDING.left} y1={y} x2={SVG_WIDTH - PADDING.right} y2={y} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" strokeDasharray="2,2" />
                        <text x={PADDING.left - 8} y={y + 4} textAnchor="end" className="text-xs fill-gray-500 dark:fill-gray-400">{label.toLocaleString()}</text>
                    </g>
                ))}
                
                 {/* X-Axis Labels */}
                {xAxisLabels.map(({ x, label }) => (
                    <text key={label} x={x} y={SVG_HEIGHT - PADDING.bottom + 15} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400">{label}</text>
                ))}

                {/* Area Path */}
                <path d={areaPathD} fill="url(#areaGradient)" />

                {/* Line Path */}
                <path d={pathD} fill="none" className="stroke-sky-500 dark:stroke-sky-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Tooltip elements */}
                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={SVG_HEIGHT - PADDING.bottom} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1" strokeDasharray="3,3" />
                        <circle cx={tooltip.x} cy={tooltip.y} r="5" className="fill-sky-500 stroke-white dark:stroke-gray-800" strokeWidth="2" />
                    </g>
                )}
            </svg>
            
            {tooltip && (
                 <div 
                    className="absolute top-0 left-0 p-2 text-xs text-center bg-gray-800 text-white rounded-md shadow-lg pointer-events-none transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${tooltip.x > SVG_WIDTH / 2 ? tooltip.x - 120 : tooltip.x + 10}px, ${tooltip.y - 70}px)` }}
                >
                    <p className="font-bold font-mono">{tooltip.rate.toLocaleString()}</p>
                    <p className="opacity-80">{tooltip.date}</p>
                </div>
            )}
        </div>
    );
};