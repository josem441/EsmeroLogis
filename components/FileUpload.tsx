import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { parseExcelFile } from '../services/excelService';
import { Order } from '../types';

interface FileUploadProps {
  onOrdersLoaded: (orders: Order[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onOrdersLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const orders = await parseExcelFile(file);
      onOrdersLoaded(orders);
    } catch (err) {
      setError("Error leyendo el archivo. Asegúrate de tener las columnas correctas.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [onOrdersLoaded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out cursor-pointer
          ${isDragging ? 'border-[#5107F2] bg-[#5107F2]/5 scale-105' : 'border-gray-300 hover:border-[#24D9B8] hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept=".xlsx, .xls" 
          onChange={handleFileInput}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center text-[#5107F2]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium text-lg">Analizando archivo...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-[#5107F2]/10 p-4 rounded-full">
                <FileSpreadsheet className="w-8 h-8 text-[#5107F2]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Cargar Ruta (Excel)</h3>
            <p className="text-gray-500 mb-6">Arrastra tu archivo aquí o haz clic para buscarlo</p>
            <button className="bg-[#5107F2] hover:bg-[#24D9B8] text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto gap-2 shadow-md shadow-[#5107F2]/20">
              <Upload className="w-4 h-4" />
              Seleccionar Archivo
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}
      
      <div className="mt-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Columnas Recomendadas (Excel):</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left text-gray-500">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Dirección</th>
                <th className="px-3 py-2">Barrio/Municipio (Opcional)</th>
                <th className="px-3 py-2">Descripción Producto</th>
                <th className="px-3 py-2">Teléfono/Contacto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-3 py-2">Tienda Don Pedro</td>
                <td className="px-3 py-2">Cl. 10 #40-20</td>
                <td className="px-3 py-2">Poblado, Medellín</td>
                <td className="px-3 py-2">3 Cajas de Jabón</td>
                <td className="px-3 py-2">310 123 4567</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};