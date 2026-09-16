'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { CurrencyCode } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';

interface ChartDataItem {
  id: string;
  label: string;
  color: string;
  value: number;
  amount: number;
}

interface CircularBudgetChartProps {
  data: ChartDataItem[];
  totalAmount: number;
  currency: CurrencyCode;
}

export function CircularBudgetChart({ data, totalAmount, currency }: CircularBudgetChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 360;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 130;
    const innerRadius = 80;

    let currentAngle = -Math.PI / 2;
    const totalPercentage = data.reduce((sum, item) => sum + item.value, 0);

    ctx.clearRect(0, 0, size, size);

    // Draw Slices
    data.forEach((item) => {
      const sliceAngle = (item.value / totalPercentage) * 2 * Math.PI;
      const isHovered = hoveredId === item.id;

      const offset = isHovered ? 10 : 0;
      const midAngle = currentAngle + sliceAngle / 2;
      const oX = Math.cos(midAngle) * offset;
      const oY = Math.sin(midAngle) * offset;

      ctx.save();
      ctx.translate(oX, oY);

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      currentAngle += sliceAngle;
    });

    // Draw Center Text
    const hoveredItem = data.find((d) => d.id === hoveredId);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (hoveredItem) {
      ctx.fillStyle = '#0B0F17';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(hoveredItem.label, centerX, centerY - 18);

      ctx.fillStyle = hoveredItem.color;
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(formatMoney(hoveredItem.amount * 100, currency), centerX, centerY + 6);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${hoveredItem.value.toFixed(1)}%`, centerX, centerY + 28);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('Total Expenses', centerX, centerY - 14);

      ctx.fillStyle = '#0B0F17';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(formatMoney(totalAmount * 100, currency), centerX, centerY + 10);
    }
  }, [data, hoveredId, totalAmount, currency]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = 180;
    const centerY = 180;
    const outerRadius = 130;
    const innerRadius = 80;

    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    const distance = Math.sqrt(x * x + y * y);

    if (distance >= innerRadius && distance <= outerRadius) {
      let mouseAngle = Math.atan2(y, x);
      if (mouseAngle < -Math.PI / 2) mouseAngle += 2 * Math.PI;

      let checkAngle = -Math.PI / 2;
      let foundId = null;

      const totalPercentage = data.reduce((sum, item) => sum + item.value, 0);
      for (let item of data) {
        const sliceAngle = (item.value / totalPercentage) * 2 * Math.PI;
        if (mouseAngle >= checkAngle && mouseAngle <= checkAngle + sliceAngle) {
          foundId = item.id;
          break;
        }
        checkAngle += sliceAngle;
      }
      setHoveredId(foundId);
    } else {
      setHoveredId(null);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center gap-6 rounded-2xl border border-[#E8EAED] bg-white p-6">
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0B0F17]">Expense Breakdown</h3>
          <p className="mt-1 text-xs text-[#64748b]">By category</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-center">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredId(null)}
          className="h-[360px] w-[360px] cursor-pointer transition-all hover:drop-shadow-lg"
        />

        {/* Interactive Legend */}
        <div className="flex flex-col gap-2 md:min-w-[280px]">
          {data.map((item, idx) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-left-4 duration-300 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-all"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                backgroundColor: hoveredId === item.id ? '#F0F2F4' : 'transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full transition-transform"
                  style={{
                    backgroundColor: item.color,
                    transform: hoveredId === item.id ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                <span
                  className={`text-sm transition-all ${
                    hoveredId === item.id
                      ? 'font-semibold text-[#0B0F17]'
                      : 'font-medium text-[#475569]'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <span
                className="font-semibold text-[#0B0F17] transition-transform"
                style={{
                  transform: hoveredId === item.id ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {item.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
