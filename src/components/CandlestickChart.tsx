import { useMemo, useRef, useEffect, useState } from "react";

export function CandlestickChart({ 
  data, 
  width, 
  height,
  yDomain
}: { 
  data: any[]; 
  width: number; 
  height: number;
  yDomain?: [number, number];
}) {
  const candles = useMemo(() => {
    if (!data.length) return [];
    
    // Use provided yDomain or calculate from data
    const yMin = yDomain ? yDomain[0] : Math.min(...data.map(d => d.l));
    const yMax = yDomain ? yDomain[1] : Math.max(...data.map(d => d.h));
    const yRange = yMax - yMin;
    
    // Better spacing calculation
    const barWidth = width / data.length;
    const candleWidth = Math.min(barWidth * 0.7, 8);
    
    return data.map((d, i) => {
      const isUp = d.c >= d.o;
      // Center each candle in its allocated space
      const x = (i + 0.5) * barWidth;
      
      // Invert Y coordinates (SVG origin is top-left)
      const yHigh = height - ((d.h - yMin) / yRange) * height;
      const yLow = height - ((d.l - yMin) / yRange) * height;
      const yOpen = height - ((d.o - yMin) / yRange) * height;
      const yClose = height - ((d.c - yMin) / yRange) * height;
      
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1);
      
      return {
        x,
        yHigh,
        yLow,
        bodyTop,
        bodyHeight,
        candleWidth,
        isUp,
      };
    });
  }, [data, width, height, yDomain]);
  
  if (!data.length) return null;
  
  return (
    <svg 
      width={width} 
      height={height}
      style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        pointerEvents: "none",
        zIndex: 10
      }}
    >
      {candles.map((candle, i) => (
        <g key={i}>
          {/* Wick */}
          <line
            x1={candle.x}
            y1={candle.yHigh}
            x2={candle.x}
            y2={candle.yLow}
            stroke={candle.isUp ? "#22c55e" : "#ef4444"}
            strokeWidth={1}
          />
          {/* Body */}
          <rect
            x={candle.x - candle.candleWidth / 2}
            y={candle.bodyTop}
            width={candle.candleWidth}
            height={candle.bodyHeight}
            fill={candle.isUp ? "#22c55e" : "#ef4444"}
            stroke={candle.isUp ? "#22c55e" : "#ef4444"}
            strokeWidth={0.5}
            rx={0.5}
          />
        </g>
      ))}
    </svg>
  );
}
