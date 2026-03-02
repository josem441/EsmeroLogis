import { Order } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

export const parseExcelFile = async (file: File): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!window.XLSX) {
          reject(new Error("XLSX library not loaded"));
          return;
        }

        const workbook = window.XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // defval: '' ensures empty cells are empty strings, not undefined
        const jsonData: any[] = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Normalize data to our Order interface
        const orders: Order[] = jsonData.map((row, index) => {
          
          // Helper to find value by fuzzy matching keys
          const getVal = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            const foundKey = rowKeys.find(k => 
              keys.some(search => k.toLowerCase().trim() === search.toLowerCase()) || // Exact match first
              keys.some(search => k.toLowerCase().includes(search.toLowerCase()))     // Then partial match
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          // MAPPING LOGIC
          
          // Client
          const clientName = getVal(['cliente', 'nombre', 'razon social', 'destinatario', 'tienda', 'customer']) || `Cliente ${index + 1}`;
          
          // Address
          let address = getVal(['direccion', 'dirección', 'address', 'ubicacion', 'destino', 'domicilio']) || 'Sin dirección';
          const barrio = getVal(['barrio', 'neighborhood', 'sector', 'zona']);
          const municipio = getVal(['municipio', 'ciudad', 'city', 'poblacion']);

          if (barrio && !address.toLowerCase().includes(barrio.toLowerCase())) {
            address += `, ${barrio}`;
          }
          if (municipio && !address.toLowerCase().includes(municipio.toLowerCase())) {
            address += `, ${municipio}`;
          }
          
          // Products: Prioritize 'pedidos', 'pedido', 'items' explicitly as requested
          let products = getVal(['pedidos', 'pedido', 'items', 'productos', 'producto', 'descripcion', 'descripción', 'detalle', 'articulos']);
          
          // Fallback if empty
          if (!products || products === '0') {
             products = 'Verificar pedido físico';
          }

          // Contact
          const contactInfo = getVal(['celular', 'telefono', 'teléfono', 'tel', 'movil', 'contacto', 'contact', 'whatsapp']);

          return {
            id: `order-${index}-${Date.now()}`,
            clientName,
            address,
            products,
            contactInfo,
            status: 'pending'
          };
        });

        // Filter out empty rows or rows without address
        const validOrders = orders.filter(o => o.address && o.address.length > 3 && o.address !== 'Sin dirección');

        if (validOrders.length === 0) {
          reject(new Error("No valid orders found. Please ensure headers include 'Cliente', 'Dirección', and 'Pedidos'."));
        } else {
          resolve(validOrders);
        }

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};