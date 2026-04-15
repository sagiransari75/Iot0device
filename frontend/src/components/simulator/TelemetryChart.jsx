import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function TelemetryChart({ liveDataHistory }) {
  // We expect liveDataHistory to be an array of objects: { time: '10:00:00', temp: 25, light: 500 }
  
  const data = {
    labels: liveDataHistory.map(d => d.time).slice(-10),
    datasets: [
      {
        label: 'Temp (°C)',
        data: liveDataHistory.map(d => d.temp).slice(-10),
        borderColor: '#ff5500',
        backgroundColor: 'rgba(255, 85, 0, 0.1)',
        tension: 0.4, fill: true, pointRadius: 0,
        yAxisID: 'y'
      },
      {
        label: 'Light (Lux)',
        data: liveDataHistory.map(d => d.light).slice(-10),
        borderColor: '#0099ff',
        backgroundColor: 'rgba(0, 153, 255, 0.1)',
        tension: 0.4, fill: true, pointRadius: 0,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { position: 'top', labels: { color: '#ccc', boxWidth: 10, font: { size: 10 } } }
    },
    scales: {
      x: { ticks: { color: '#666', font: { size: 9 }, maxRotation: 0 } },
      y: { type: 'linear', position: 'left', ticks: { color: '#ff5500', font: { size: 9 } } },
      y1: { type: 'linear', position: 'right', ticks: { color: '#0099ff', font: { size: 9 } }, grid: { drawOnChartArea: false } }
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 20, right: 20, zIndex: 100,
      background: 'rgba(20,20,25,0.85)', backdropFilter: 'blur(10px)',
      padding: '12px', borderRadius: '12px', border: '1px solid #333',
      width: 350, height: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00ff88', marginBottom: '8px', letterSpacing: '1px' }}>LIVE TELEMETRY</h3>
      <div style={{ height: '80%' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
