import React, { useState } from 'react';
import { Map, MapPin, CheckCircle, Navigation, ChevronDown, ChevronUp, Package, Phone, Building2, Flag, Route, TrendingUp, Info, PlusCircle, Home, Zap, DollarSign, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { Order, OptimizedRouteResult } from '../types';

interface OptimizationViewProps {
  data: OptimizedRouteResult;
  onReset: () => void;
  onRetry: () => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({ data, onReset, onRetry }) => {
  const [orders, setOrders] = useState<Order[]>(data.optimizedOrders);
  const [expandedId, setExpandedId] = useState<string | null>(data.optimizedOrders[0]?.id || null);

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const newStatus = o.status === 'completed' ? 'pending' : 'completed';
        if (newStatus === 'completed') {
            const currentIndex = prev.findIndex(item => item.id === id);
            if (currentIndex < prev.length - 1) {
                setExpandedId(prev[currentIndex + 1].id);
            } else {
                setExpandedId(null);
            }
        }
        return { ...o, status: newStatus as 'pending' | 'completed' };
      }
      return o;
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getGoogleMapsFullRouteUrl = () => {
    const origin = encodeURIComponent("Cl. 41 #47 - 33, Angeles, Itagüi, Antioquia");
    const destinations = orders.filter(o => o.status !== 'completed').map(o => encodeURIComponent(o.address)).join("/");
    return `https://www.google.com/maps/dir/${origin}/${destinations}`;
  };

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const progress = Math.round((completedCount / orders.length) * 100);

  // Check if the result is a fallback/failure
  const isFallback = data.reasoning.includes("FALLBACK_MODE") || data.reasoning.includes("Error crítico");

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      
      {/* 1. SCROLLABLE HEADER: Title, Strategy & Actions */}
      <div className="bg-white pt-6 pb-4 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Route className="w-6 h-6 text-[#5107F2]" />
                        Plan de Ruta
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Esmero Logistics • {new Date().toLocaleDateString()}</p>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={onReset}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:border-[#24D9B8] hover:text-[#24D9B8] shadow-sm hover:shadow-md font-semibold py-2.5 px-4 rounded-xl transition-all text-xs uppercase tracking-wide"
                    >
                        <Home className="w-4 h-4" />
                        Ir al Inicio
                    </button>
                    <button 
                        onClick={onReset}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#5107F2] text-white hover:bg-[#24D9B8] shadow-md hover:shadow-lg hover:shadow-[#24D9B8]/30 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs uppercase tracking-wide"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Nueva Ruta
                    </button>
                </div>
            </div>

            {/* Dispatcher Strategy or Error State */}
            {isFallback ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
                    <div className="px-4 py-3 flex items-center gap-3">
                         <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                         <div className="flex-1">
                             <h4 className="text-sm font-bold text-amber-800">Optimización Inteligente No Disponible</h4>
                             <p className="text-xs text-amber-700 mt-1">
                                 La IA no respondió a tiempo. Se muestra el orden original del archivo.
                             </p>
                         </div>
                         <button 
                            onClick={onRetry}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold py-2 px-3 rounded-lg border border-amber-300 flex items-center gap-1 transition-colors"
                         >
                             <RotateCcw className="w-3.5 h-3.5" />
                             Reintentar
                         </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-[#5107F2]/20 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-[#5107F2]/5 px-4 py-2 border-b border-[#5107F2]/10 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#5107F2]" />
                        <span className="text-xs font-bold text-[#5107F2] uppercase tracking-wide">Estrategia de Optimización</span>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            {data.reasoning}
                        </p>

                        {/* Zone Breakdown */}
                        {data.zoneSummary && data.zoneSummary.length > 0 && (
                            <div className="mb-4">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Distribución por Zonas:</h5>
                                <div className="flex flex-wrap gap-2">
                                    {data.zoneSummary.map((zone, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                                            <MapPin className="w-3.5 h-3.5 text-[#24D9B8]" />
                                            <span className="text-xs font-semibold text-gray-700">{zone.zoneName}</span>
                                            <span className="text-xs font-bold text-[#5107F2] bg-[#5107F2]/10 px-1.5 rounded">{zone.orderCount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Key Highlight */}
                        {data.keyHighlight && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-start gap-3 bg-[#24D9B8]/10 p-3 rounded-lg border border-[#24D9B8]/20">
                                    <CheckCircle className="w-5 h-5 text-[#24D9B8] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="text-xs font-bold text-[#24D9B8] uppercase tracking-wide block mb-1">
                                            Logro Principal
                                        </span>
                                        <p className="text-sm font-medium text-gray-800 leading-snug">
                                            {data.keyHighlight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* 2. COMPACT STICKY HEADER: Just Stats & Progress */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all">
        <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-4">
                
                {/* Compact Stats Row */}
                <div className="flex gap-6 items-center flex-1">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-gray-800 leading-none">{orders.length}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Paradas</span>
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-orange-500 leading-none">{orders.length - completedCount}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Faltan</span>
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                         <span className="text-xl font-bold text-[#5107F2] leading-none">{data.zoneSummary ? data.zoneSummary.length : 1}</span>
                         <span className="text-[9px] text-gray-400 font-bold uppercase">Zonas</span>
                    </div>
                </div>

                {/* Progress Circle & Text */}
                <div className="text-right">
                    <div className="text-lg font-bold text-[#24D9B8] leading-none">{progress}%</div>
                    <div className="text-[9px] text-[#24D9B8] font-bold uppercase">Completado</div>
                </div>
            </div>
            
            {/* Slim Progress Bar attached to bottom */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
                 <div 
                    className="h-full bg-[#24D9B8] transition-all duration-700 ease-out" 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
        
        {/* Full Route Button */}
        <a 
            href={getGoogleMapsFullRouteUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-[#111827] hover:bg-black text-white py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-gray-200 transition-all active:scale-[0.98]"
        >
            <Navigation className="w-4 h-4 text-[#24D9B8]" />
            Navegar Ruta Completa (Google Maps)
        </a>

        {/* List */}
        <div className="space-y-3">
            {orders.map((order, index) => {
            const isCompleted = order.status === 'completed';
            const isExpanded = expandedId === order.id;
            
            return (
                <div 
                key={order.id}
                onClick={() => toggleExpand(order.id)}
                className={`
                    relative bg-white rounded-xl overflow-hidden transition-all duration-200 cursor-pointer
                    ${isCompleted ? 'border border-gray-100 bg-gray-50 opacity-80' : 'border border-gray-200 shadow-sm hover:border-[#24D9B8] hover:shadow-md'}
                    ${isExpanded ? 'ring-2 ring-[#24D9B8] ring-offset-2 z-10' : ''}
                `}
                >
                <div className="p-4 flex items-center gap-3">
                    {/* Status Indicator */}
                    <div 
                        onClick={(e) => toggleComplete(order.id, e)}
                        className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors
                        ${isCompleted ? 'bg-[#24D9B8] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                        `}
                    >
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {order.clientName}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{order.address}</span>
                    </div>
                    </div>

                    {/* Toggle Icon */}
                    <div className="text-gray-300">
                     {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {/* EXPANDED DETAILS */}
                {isExpanded && (
                    <div className="bg-[#5107F2]/5 p-4 border-t border-gray-100 animate-in slide-in-from-top-1">
                    
                    {/* PRODUCT CARD */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Package className="w-3 h-3 text-[#24D9B8]" />
                            Pedido
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                            {order.products}
                        </p>
                    </div>

                    {/* CONTACT & ACTIONS GRID */}
                    <div className="grid grid-cols-1 gap-2">
                        {order.contactInfo && (
                             <a 
                                href={`https://wa.me/57${order.contactInfo.replace(/\D/g,'')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-[#5107F2]/20 bg-white text-[#5107F2] text-sm font-medium hover:bg-[#24D9B8] hover:text-white transition-colors"
                             >
                                <Phone className="w-3 h-3" />
                                WhatsApp / Llamar: {order.contactInfo}
                             </a>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <a 
                            href={`https://waze.com/ul?q=${encodeURIComponent(order.address)}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium text-xs hover:bg-gray-50"
                            onClick={(e) => e.stopPropagation()}
                            >
                            <Navigation className="w-3 h-3" />
                            Waze
                            </a>
                            <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium text-xs hover:bg-blue-700"
                            onClick={(e) => e.stopPropagation()}
                            >
                            <MapPin className="w-3 h-3" />
                            Google Maps
                            </a>
                        </div>
                    </div>
                    
                    <button
                        onClick={(e) => toggleComplete(order.id, e)}
                        className={`w-full mt-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white text-sm transition-all
                            ${isCompleted 
                                ? 'bg-gray-400 hover:bg-gray-500' 
                                : 'bg-[#5107F2] hover:bg-[#24D9B8] shadow-lg shadow-[#5107F2]/20'
                            }
                        `}
                    >
                        {isCompleted ? 'Desmarcar' : 'Completar Entrega'}
                    </button>
                    </div>
                )}
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};