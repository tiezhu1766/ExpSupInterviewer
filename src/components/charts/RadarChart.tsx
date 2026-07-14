import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { useTranslation } from '../../i18n/useTranslation';
import type { DimensionScore } from '../../types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  dimensions: DimensionScore[];
}

function getVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function RadarChart({ dimensions }: Props) {
  const { t } = useTranslation();

  const gridColor = getVar('--c-border');
  const labelColor = getVar('--c-text-secondary');
  const surfaceColor = getVar('--c-surface');
  const textPrimary = getVar('--c-text-primary');

  const data = {
    labels: dimensions.map(d => d.name),
    datasets: [{
      label: t('report.chart.score'),
      data: dimensions.map(d => d.score),
      backgroundColor: 'rgba(212, 168, 83, 0.18)',
      borderColor: '#d4a853',
      borderWidth: 2,
      pointBackgroundColor: '#d4a853',
      pointBorderColor: surfaceColor,
      pointBorderWidth: 2,
      pointHoverBackgroundColor: textPrimary,
    }],
  };

  const options = {
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, color: getVar('--c-text-tertiary'), backdropColor: 'transparent' },
        grid: { color: gridColor },
        pointLabels: { color: labelColor, font: { size: 12, family: "'DM Sans', sans-serif" } },
        angleLines: { color: gridColor },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return <Radar data={data} options={options} />;
}
