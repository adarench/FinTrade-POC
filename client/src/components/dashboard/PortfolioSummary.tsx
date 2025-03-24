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
      mode: 'index' as const,
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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Left Side - Portfolio Stats */}
        <div className="space-y-4">
          <div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Current Balance</h3>
            <p className="text-3xl font-bold text-white mt-1">${balance.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Today's P&L</h3>
              <p className={`text-lg font-bold flex items-center mt-1 ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyPnL >= 0 ? (
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 11.586V7z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 10-2 0v-4.586l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L12 8.414V13z" clipRule="evenodd" />
                  </svg>
                )}
                {dailyPnL >= 0 ? '+' : ''}{dailyPnLPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Net Change</h3>
              <p className={`text-lg font-bold mt-1 ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyPnL >= 0 ? '+' : ''}${Math.abs(dailyPnL).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Chart */}
        <div>
          <div className="flex justify-end space-x-1 mb-3">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="h-36 bg-gray-800/30 rounded-lg p-2">
            <Line options={chartOptions} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;