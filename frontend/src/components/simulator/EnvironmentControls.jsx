import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function EnvironmentControls() {
  const [controls, setControls] = useState({
    temperature: { min: 20, max: 45 },
    light: { threshold: 500 },
    gas: { min: 50, max: 500 },
  });

  // Example: Drag slider to force environment temp
  const handleTempChange = async (e) => {
    const val = parseInt(e.target.value);
    setControls(prev => ({ ...prev, temperature: { min: val, max: val + 2 } }));
    
    try {
      await axios.post('http://localhost:4000/api/sensors', { 
        sensor: 'temperature', 
        config: { min: val, max: val + 2 } 
      });
    } catch(err) {}
  };
  
  const handleGasChange = async (e) => {
    const val = parseInt(e.target.value);
    setControls(prev => ({ ...prev, gas: { min: val, max: val + 10 } }));
    
    try {
      await axios.post('http://localhost:4000/api/sensors', { 
        sensor: 'gas', 
        config: { min: val, max: val + 10 } 
      });
    } catch(err) {}
  };

  return (
    <div style={{
      position: 'absolute', top: 20, left: 20, zIndex: 100,
      background: 'rgba(20,20,25,0.85)', backdropFilter: 'blur(10px)',
      padding: '16px', borderRadius: '12px', border: '1px solid #333',
      color: '#fff', width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', marginBottom: '12px', letterSpacing: '1px' }}>ENVIRONMENT CONTROLS</h3>
      
      {/* Temperature Slider */}
      <div style={{ marginBottom: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
          <span>Room Temp:</span>
          <span style={{ color: '#ff5500', fontWeight: 'bold' }}>{controls.temperature.min}°C</span>
        </div>
        <input 
          type="range" min="-10" max="80" 
          value={controls.temperature.min} 
          onChange={handleTempChange} 
          style={{ width: '100%', accentColor: '#ff5500' }}
        />
      </div>

      {/* Gas Concentration Slider */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
          <span>Gas / Smoke:</span>
          <span style={{ color: '#ff4444', fontWeight: 'bold' }}>{controls.gas.min} ppm</span>
        </div>
        <input 
          type="range" min="0" max="1000" 
          value={controls.gas.min} 
          onChange={handleGasChange} 
          style={{ width: '100%', accentColor: '#ff4444' }}
        />
        <div style={{ fontSize: '0.6rem', color: '#666', marginTop: 4 }}>* Over 300ppm triggers MQ-2 Alert</div>
      </div>
    </div>
  );
}
