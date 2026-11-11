// src/components/ui/UsageProgressBar.tsx
import React from 'react';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface UsageProgressBarProps {
  label: string;
  current: number;
  limit: number;
  isLoading?: boolean;
}

export const UsageProgressBar: React.FC<UsageProgressBarProps> = ({
  label,
  current,
  limit,
  isLoading = false,
}) => {
  // -1 significa ilimitado en nuestra lógica
  const isUnlimited = limit === -1;
  
  // Calcular porcentaje (evitar división por cero)
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  
  // Determinar colores según el porcentaje
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let bgColor = 'bg-emerald-50';
  let Icon = CheckCircle2;

  if (!isUnlimited) {
    if (percentage >= 100) {
      barColor = 'bg-rose-500';
      textColor = 'text-rose-700';
      bgColor = 'bg-rose-50';
      Icon = AlertCircle;
    } else if (percentage >= 80) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-700';
      bgColor = 'bg-amber-50';
      Icon = TrendingUp;
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-2 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${bgColor} ${textColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800">{label}</span>
        </div>
        <span className={`text-xs font-black ${textColor}`}>
          {isUnlimited ? (
            `${current} / Ilimitado`
          ) : (
            `${current} / ${limit}`
          )}
        </span>
      </div>

      {!isUnlimited && (
        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {!isUnlimited && percentage >= 100 && (
        <p className="text-[11px] font-bold text-rose-600">
          Has alcanzado el límite de tu plan. Considera hacer un upgrade.
        </p>
      )}
    </div>
  );
};