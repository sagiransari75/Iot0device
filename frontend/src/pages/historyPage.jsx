'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const router = useRouter();
  
  // Get user from localStorage or context
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/history/${user.id}`);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("History fetch error:", err);
      }
    };
    fetchHistory();
  }, [user?.id]);

  const getStatus = (action) => {
    if (action.includes('Connected') || action.includes('Added')) return { icon: '🟢', color: 'text-green-400' };
    if (action.includes('Alert') || action.includes('reached')) return { icon: '🟡', color: 'text-yellow-400' };
    if (action.includes('Error') || action.includes('Lost')) return { icon: '🔴', color: 'text-red-400' };
    return { icon: '🔵', color: 'text-blue-400' };
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold italic text-blue-500">MR ENGINEER <span className="text-white not-italic">| Lab Logs</span></h1>
            <p className="text-zinc-500 mt-2">Aapke saare simulator actions yahan record hote hain.</p>
          </div>
          <button 
            onClick={() => router.back()} 
            className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg text-sm transition-all"
          >
            ← Back to Simulator
          </button>
        </div>

        <div className="space-y-3">
          {logs.length > 0 ? logs.map((log) => {
            const status = getStatus(log.action);
            return (
              <div key={log.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-xl">{status.icon}</span>
                  <div>
                    <h3 className={`font-medium ${status.color}`}>{log.action}</h3>
                    <p className="text-zinc-500 text-xs mt-1">{log.details || 'System Log'}</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-zinc-600">
                  <p>{new Date(log.createdAt).toLocaleTimeString()}</p>
                  <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl text-zinc-600 italic">
              Abhi tak koi activity record nahi hui hai...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}