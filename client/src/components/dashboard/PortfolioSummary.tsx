import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

type TimeRange = '1D' | '1W' | '1M' | 'YTD' | 'MAX';

interface PortfolioSummaryProps {
  balance: number;
  dailyPnL: number;
  dailyPnLPercentage: number;
  chartData: {
    labels: string[];
    values: number[];
  };
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  balance,
  dailyPnL,
  dailyPnLPercentage,
  chartData,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [currentChartData, setCurrentChartData] = useState(chartData);

  // Update chart data when timeRange changes
  useEffect(() => {
    // In a real app, we would fetch data for the selected time range
    // For now, we'll just modify the existing data for demonstration
    
    const now = new Date();
    let labels: string[] = [];
    let dataPoints = chartData.values;
    
    switch(timeRange) {
      case '1D':
        labels = Array.from({ length: 24 }, (_, i) => {
          const d = new Date(now);
          d.setHours(d.getHours() - (23 - i));
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        break;
      case '1W':
        labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString([], { weekday: 'short' });
        });
        // Generate slightly different data for demonstration
        dataPoints = Array.from({ length: 7 }, (_, i) => {
          return balance * (1 + (Math.random() * 0.02 - 0.005) * (i + 1));
        });
        break;
      case '1M':
        labels = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (29 - i));
          return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
        });
        // Generate slightly different data for demonstration
        dataPoints = Array.from({ length: 30 }, (_, i) => {
          return balance * (1 + (Math.random() * 0.05 - 0.01) * (i + 1));
        });
        break;
      case 'YTD':
        const currentMonth = now.getMonth();
        labels = Array.from({ length: currentMonth + 1 }, (_, i) => {
          const d = new Date(now.getFullYear(), i, 1);
          return d.toLocaleDateString([], { month: 'short' });
        });
        // Generate slightly different data for demonstration
        dataPoints = Array.from({ length: currentMonth + 1 }, (_, i) => {
          return balance * (1 - 0.1 + (Math.random() * 0.2) * (i + 1));
        });
        break;
      case 'MAX':
        labels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now);
          d.setMonth(d.getMonth() - (11 - i));
          return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
        });
        // Generate slightly different data for demonstration
        dataPoints = Array.from({ length: 12 }, (_, i) => {
          return balance * (0.7 + (Math.random() * 0.5) * (i + 1) / 12);
        });
        break;
    }
    
    setCurrentChartData({
      labels,
      values: dataPoints
    });
  }, [timeRange, chartData, balance]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = '';
            if (context.parsed.y !== null) {
              label = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
        hoverRadius: 6
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    }
  };

  const data = {
    labels: currentChartData.labels,
    datasets: [
      {
        fill: true,
        data: currentChartData.values,
        borderColor: dailyPnL >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: dailyPnL >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
      },
    ],
  };

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', 'YTD', 'MAX'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800 rounded-xl">
      {/* Left Side - Portfolio Stats */}
      <div className="space-y-4">
        <div>
          <h3 className="text-gray-400 text-sm">Current Balance</h3>
          <p className="text-2xl font-bold text-white">${balance.toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-gray-400 text-sm">Today's P&L</h3>
            <p className={`text-lg font-semibold ${dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dailyPnL >= 0 ? '+' : ''}{dailyPnLPercentage.toFixed(2)}%
            </p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Net Change</h3>
            <p className={`text-lg font-semibold ${dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dailyPnL >= 0 ? '+' : ''}${Math.abs(dailyPnL).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Chart */}
      <div>
        <div className="flex justify-end space-x-2 mb-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="h-32">
          <Line options={chartOptions} data={data} />
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;