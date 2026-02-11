
import React, { useState, useEffect } from 'react';

interface CacheItem {
  url: string;
  size: string;
  type: string;
  cachedAt: string;
  age: number; // in minutes
}

const CacheDiagnostics: React.FC = () => {
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [activeCache, setActiveCache] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState<string>('0 KB');

  const refreshCacheInfo = async () => {
    setLoading(true);
    try {
      const keys = await caches.keys();
      const current = keys[keys.length - 1] || 'None';
      setActiveCache(current);

      if (current !== 'None') {
        const cache = await caches.open(current);
        const requests = await cache.keys();
        let sizeInBytes = 0;

        const items = await Promise.all(
          requests.map(async (req) => {
            const res = await cache.match(req);
            const blob = await res?.blob();
            const size = blob?.size || 0;
            sizeInBytes += size;

            const timestamp = res?.headers.get('X-Cache-Timestamp');
            const cachedDate = timestamp ? new Date(parseInt(timestamp)) : null;
            const age = cachedDate ? Math.floor((Date.now() - cachedDate.getTime()) / 60000) : -1;

            return {
              url: req.url.replace(window.location.origin, ''),
              size: (size / 1024).toFixed(2) + ' KB',
              type: res?.headers.get('content-type') || 'unknown',
              cachedAt: cachedDate ? cachedDate.toLocaleTimeString() : 'Unknown',
              age: age
            };
          })
        );

        setCacheItems(items.sort((a, b) => b.age - a.age));
        setTotalSize((sizeInBytes / 1024 / 1024).toFixed(2) + ' MB');
      }
    } catch (err) {
      console.error("Failed to read cache", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCacheInfo();
  }, []);

  const clearCache = async () => {
    if (!confirm("Are you sure you want to clear the PWA cache? This will force a reload.")) return;
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    window.location.reload();
  };

  const getAgeBadge = (age: number) => {
    if (age < 0) return <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">Legacy</span>;
    if (age < 5) return <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Fresh</span>;
    if (age < 60) return <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">Active</span>;
    return <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Stale</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-white">System Diagnostics</h3>
          <p className="text-slate-400 text-sm">Real-time PWA cache inspection and storage analysis.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refreshCacheInfo}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
          <button 
            onClick={clearCache}
            className="px-4 py-2 bg-rose-600/20 text-rose-400 text-sm font-bold rounded-lg border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
          >
            Purge Cache
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-slate-500 uppercase mb-1 text-center">Active Store</div>
          <div className="text-lg font-mono text-blue-400 font-bold text-center">{activeCache}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-slate-500 uppercase mb-1 text-center">Cached Assets</div>
          <div className="text-lg font-mono text-emerald-400 font-bold text-center">{cacheItems.length}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs font-bold text-slate-500 uppercase mb-1 text-center">Total Footprint</div>
          <div className="text-lg font-mono text-amber-400 font-bold text-center">{totalSize}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Asset URL</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cached At</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-slate-500 animate-pulse">Analyzing storage...</td>
                </tr>
              ) : cacheItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="text-xs font-mono text-slate-300 truncate max-w-md" title={item.url}>{item.url}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{item.type.split(';')[0]}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-xs font-mono text-slate-400">{item.size}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-xs font-mono text-slate-400">{item.cachedAt}</div>
                  </td>
                  <td className="px-6 py-3">
                    {getAgeBadge(item.age)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CacheDiagnostics;
