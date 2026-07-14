import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { useTranslation } from '../../i18n/useTranslation';
import type { ProgressPoint } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  progress: ProgressPoint[];
}

function getVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function ProgressChart({ progress }: Props) {
  const { t } = useTranslation();

  if (progress.length === 0) {
    return <p className="text-text-tertiary text-center py-4">{t('report.chart.noData')}</p>;
  }

  const data = {
    labels: progress.map((_, i) => t('report.chart.interview', { num: i + 1 })),
    datasets: [{
      label: t('report.chart.score'),
      data: progress.map(p => p.totalScore),
      backgroundColor: '#d4a853',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const options = {
    scales: {
      y: { min: 0, max: 50, grid: { color: getVar('--c-border') }, ticks: { color: getVar('--c-text-tertiary') } },
      x: { grid: { display: false }, ticks: { color: getVar('--c-text-tertiary') } },
    },
    plugins: { legend: { display: false } },
  };

  return <Bar data={data} options={options} />;
}
