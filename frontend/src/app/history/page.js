'use client'; // Next.js me client component ke liye zaroori hai
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // navigate ki jagah useRouter use hoga
import { useAuth } from '@/context/AuthContext'; // Aapka purana AuthContext
import axios from 'axios';

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const router = useRouter();
  const { user, loading } = useAuth(); // AuthContext se user nikalna safe hai

  useEffect(() => {
    // Agar loading khatam ho jaye aur user na ho, to wapas bhej do
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(`http://localhost:4000/api/history/${user.id}`);
        setLogs(res.data);
      } catch (err) {
        console.error("History fetch error:", err);
      }
    };

    fetchHistory();
  }, [user, loading, router]);

  const handleClearHistory = async () => {
    if (!user?.id) return;

    try {
      await axios.delete(`http://localhost:4000/api/history/${user.id}`);
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
      alert("Failed to clear history");
    }
  };

  const getStatus = (action) => {
    if (action.includes('Connect') || action.includes('Add')) return { icon: '🟢', color: 'text-green-400' };
    if (action.includes('Start') || action.includes('Run')) return { icon: '⚡', color: 'text-orange-400' };
    if (action.includes('Stop')) return { icon: '🛑', color: 'text-red-400' };
    return { icon: '🔵', color: 'text-blue-400' };
  };

  if (loading) return <div className="p-8 text-white">Loading Logs...</div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold italic text-orange-500">MR ENGINEER <span className="text-white not-italic">| Lab Logs</span></h1>
            <p className="text-zinc-500 mt-2"></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClearHistory}
              disabled={logs.length === 0}
              className={`px-4 py-2 rounded-lg text-sm transition-all border flex items-center gap-2 ${logs.length === 0
                  ? 'bg-zinc-800/50 border-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              Clear
            </button>
            <button
              onClick={() => router.back()}
              className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg text-sm transition-all border border-zinc-700"
            >
              ← Back
            </button>
          </div>
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