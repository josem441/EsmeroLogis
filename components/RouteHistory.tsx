import React from 'react';
import { Clock, ArrowRight, MapPin, Calendar, Trash2 } from 'lucide-react';
import { RouteHistoryItem } from '../types';

interface RouteHistoryProps {
  history: RouteHistoryItem[];
  onSelectRoute: (item: RouteHistoryItem) => void;
  onClearHistory: () => void;
  onBack: () => void;
}

export const RouteHistory: React.FC<RouteHistoryProps> = ({ history, onSelectRoute, onClearHistory, onBack }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#5107F2]" />
            Historial de Rutas
            </h2>
            <p className="text-gray-500 text-sm">Tus últimas optimizaciones</p>
        </div>
        <button 
            onClick={onBack}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
            Volver
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No tienes rutas guardadas aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelectRoute(item)}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#24D9B8] transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#5107F2]/10 text-[#5107F2] text-xs font-bold px-2 py-0.5 rounded">
                        {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400">
                        {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {item.totalOrders} Pedidos
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{item.summary}</span>
                  </div>
                </div>
                <div className="text-gray-300 group-hover:text-[#24D9B8] transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 flex justify-center">
            <button 
                onClick={onClearHistory}
                className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
                <Trash2 className="w-3 h-3" />
                Borrar Historial
            </button>
          </div>
        </div>
      )}
    </div>
  );
};