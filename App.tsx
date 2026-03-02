import React, { useState, useEffect } from 'react';
import { Truck, History } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { OptimizationView } from './components/OptimizationView';
import { RouteHistory } from './components/RouteHistory';
import { optimizeRouteWithGemini } from './services/geminiService';
import { Order, OptimizedRouteResult, RouteHistoryItem } from './types';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<'upload' | 'analyzing' | 'optimized' | 'history'>('upload');
  const [optimizationResult, setOptimizationResult] = useState<OptimizedRouteResult | null>(null);
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);
  
  // Store raw orders to allow re-optimization without re-uploading
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('esmero_history');
    if (saved) {
      try {
        setRouteHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (result: OptimizedRouteResult) => {
    const newItem: RouteHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalOrders: result.optimizedOrders.length,
      summary: result.zoneSummary.map(z => z.zoneName).join(', ') || 'Ruta General',
      data: result
    };
    
    const updatedHistory = [newItem, ...routeHistory];
    setRouteHistory(updatedHistory);
    localStorage.setItem('esmero_history', JSON.stringify(updatedHistory));
  };

  const handleOrdersLoaded = async (orders: Order[]) => {
    setCurrentOrders(orders); // Save for potential retry
    setViewState('analyzing');
    
    const minTimePromise = new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const [result] = await Promise.all([
        optimizeRouteWithGemini(orders),
        minTimePromise
      ]);
      
      setOptimizationResult(result);
      
      // Only save to history if it wasn't a fallback failure
      const isFallback = result.reasoning.includes('FALLBACK_MODE');
      if (result.optimizedOrders.length > 0 && !isFallback) {
        saveToHistory(result);
      }
      
      setViewState('optimized');
    } catch (error) {
      console.error("Critical app error", error);
      const fallback: OptimizedRouteResult = {
        reasoning: "FALLBACK_MODE: Error crítico al procesar. Lista original cargada.",
        keyHighlight: "Modo manual activo: No se aplicó inteligencia artificial.",
        zoneSummary: [],
        optimizedOrders: orders
      };
      setOptimizationResult(fallback);
      setViewState('optimized');
    }
  };

  const handleRetryOptimization = () => {
    if (currentOrders.length > 0) {
        handleOrdersLoaded(currentOrders);
    }
  };

  const handleReset = () => {
    setViewState('upload');
    setOptimizationResult(null);
    setCurrentOrders([]);
  };

  const handleClearHistory = () => {
    if(window.confirm('¿Estás seguro de borrar todo el historial?')) {
        setRouteHistory([]);
        localStorage.removeItem('esmero_history');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* App Header */}
      {viewState !== 'optimized' && (
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-[#5107F2] p-2 rounded-lg text-white">
                <Truck className="w-6 h-6" />
                </div>
                <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Esmero Logistics</h1>
                <p className="text-xs text-gray-500 font-medium">Optimizador de Rutas • Medellín</p>
                </div>
            </div>
            
            {viewState === 'upload' && routeHistory.length > 0 && (
                <button 
                    onClick={() => setViewState('history')}
                    className="flex items-center gap-2 text-sm bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-[#24D9B8] hover:border-[#24D9B8]/50 hover:shadow-md font-semibold py-2 px-4 rounded-lg transition-all"
                >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver Historial</span>
                </button>
            )}
          </div>
        </header>
      )}

      <main className="mx-auto">
        {viewState === 'upload' && (
          <div className="animate-in fade-in duration-500">
             <div className="text-center mt-12 mb-8 px-4">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
                  Optimiza tus entregas <br/>
                  <span className="text-[#24D9B8]">en segundos</span>
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Sube tu listado de pedidos en Excel y deja que nuestra inteligencia artificial organice la ruta más eficiente por el Valle de Aburrá.
                </p>
             </div>
            <FileUpload onOrdersLoaded={handleOrdersLoaded} />
          </div>
        )}

        {viewState === 'history' && (
            <RouteHistory 
                history={routeHistory}
                onClearHistory={handleClearHistory}
                onBack={() => setViewState('upload')}
                onSelectRoute={(item) => {
                    setOptimizationResult(item.data);
                    // Also set current orders in case they want to re-optimize an old historical route
                    setCurrentOrders(item.data.optimizedOrders);
                    setViewState('optimized');
                }}
            />
        )}

        {viewState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#24D9B8] rounded-full animate-ping opacity-25"></div>
              <div className="bg-white p-6 rounded-full shadow-xl relative z-10 border-4 border-[#5107F2]/10">
                <Truck className="w-12 h-12 text-[#5107F2] animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Calculando la mejor ruta...</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Analizando tráfico, distancias y ubicaciones en Medellín para ahorrarte tiempo y gasolina.
            </p>
          </div>
        )}

        {viewState === 'optimized' && optimizationResult && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <OptimizationView 
                data={optimizationResult} 
                onReset={handleReset}
                onRetry={handleRetryOptimization} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;