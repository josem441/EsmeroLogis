import { GoogleGenAI, Type } from "@google/genai";
import { Order, OptimizedRouteResult } from '../types';

const FACTORY_ADDRESS = "Cl. 41 #47 - 33, Angeles, Itagüi, Antioquia";

// Initialize Gemini Client Lazily
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key no configurada. Por favor configura VITE_GEMINI_API_KEY en tus variables de entorno.");
  }
  return new GoogleGenAI({ apiKey });
};

// Retry helper function
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryOperation(operation, retries - 1, delay * 2); // Exponential backoff
  }
}

export const optimizeRouteWithGemini = async (orders: Order[]): Promise<OptimizedRouteResult> => {
  
  // Initialize client here to avoid top-level crashes
  let ai;
  try {
    ai = getAiClient();
  } catch (e) {
    console.error("Gemini Client Init Error:", e);
    return {
      reasoning: "ERROR DE CONFIGURACIÓN: No se encontró la API Key.",
      keyHighlight: "Configura VITE_GEMINI_API_KEY en Vercel.",
      zoneSummary: [],
      optimizedOrders: orders
    };
  }
  const orderListString = orders.map((o) => 
    `{id:"${o.id}", client:"${o.clientName}", addr:"${o.address}"}`
  ).join("\n");

  const prompt = `
    Actúa como un Jefe de Logística experto en el Valle de Aburrá (Medellín, Colombia) con 20 años de experiencia.
    
    Punto de Partida (Centro de Distribución): ${FACTORY_ADDRESS}
    
    Tus objetivos son:
    1. MINIMIZAR TIEMPO Y DISTANCIA: Ordena las entregas para crear una ruta lógica y eficiente.
    2. EVITAR CRUCES INNECESARIOS DEL RÍO: El Río Medellín divide la ciudad. Cruza los puentes solo cuando sea estrictamente necesario para cambiar de zona (Occidente a Oriente o viceversa).
    3. AGRUPACIÓN POR ZONAS: Agrupa entregas cercanas (ej: Todo El Poblado junto, todo Laureles junto, todo Bello junto) antes de moverte a la siguiente gran zona.
    4. SENTIDO LÓGICO: Usa las arterias principales (Autopista Sur/Norte, Avenida Regional, Avenida Las Palmas, La 33, La 80) como ejes de desplazamiento.
    5. EVITAR CONGESTIÓN: Prioriza flujos que eviten los tacos más comunes en horas pico si es posible inferirlo.

    Lista de Pedidos a organizar:
    ${orderListString}
    
    Instrucciones de Salida (JSON estricto):
    1. "optimizedOrderIds": La lista de IDs en el orden EXACTO de entrega.
    2. "reasoning": Explica tu estrategia en 2-3 frases. Menciona qué zonas atacas primero y por qué.
    3. "keyHighlight": UNA SOLA frase impactante y ESPECÍFICA de esta ruta (ej: "Se agruparon 8 entregas en Poblado antes de cruzar al Occidente, ahorrando ~40 min de cruces"). NO uses frases genéricas.
    4. "zoneSummary": Agrupa los pedidos por zonas lógicas.

    Formato JSON requerido:
    {
      "reasoning": "string",
      "keyHighlight": "string",
      "zoneSummary": [{"zoneName": "string", "orderCount": number}],
      "optimizedOrderIds": ["string"]
    }
  `;

  // Define the API call logic wrapped in a function
  const performApiCall = async (modelName: string, timeoutMs: number) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms)`)), timeoutMs);
    });

    const apiCallPromise = ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            keyHighlight: { type: Type.STRING },
            zoneSummary: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        zoneName: { type: Type.STRING },
                        orderCount: { type: Type.NUMBER }
                    }
                }
            },
            optimizedOrderIds: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["reasoning", "keyHighlight", "optimizedOrderIds", "zoneSummary"]
        }
      }
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;
    let text = response.text;
    if (!text) throw new Error("Empty response");
    
    // Cleanup
    text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    return JSON.parse(text);
  };

  try {
    let result;
    try {
        // Attempt 1: Try with Gemini 3 Flash (New generation, smarter than 1.5 Flash, faster than Pro)
        // 45s timeout
        result = await performApiCall('gemini-3-flash-preview', 45000);
    } catch (flash3Error: any) {
        console.warn("Gemini 3 Flash failed, switching to 1.5 Flash fallback:", flash3Error);
        try {
             // Attempt 2: Fallback to Gemini 1.5 Flash (Most stable/high limits)
             // 30s timeout
             result = await performApiCall('gemini-1.5-flash', 30000);
        } catch (flash1Error: any) {
             console.warn("Gemini 1.5 Flash failed too:", flash1Error);
             throw new Error(`All models failed. 3 Flash: ${flash3Error?.message}. 1.5 Flash: ${flash1Error?.message}`);
        }
    }

    // Reorder logic
    const reorderedOrders: Order[] = [];
    if (result.optimizedOrderIds && Array.isArray(result.optimizedOrderIds)) {
        result.optimizedOrderIds.forEach((id: string) => {
          const original = orders.find(o => o.id === id);
          if (original) reorderedOrders.push(original);
        });
    }

    // Failsafe: Add missing orders
    orders.forEach(o => {
      if (!reorderedOrders.find(ro => ro.id === o.id)) {
        reorderedOrders.push(o);
      }
    });

    return {
      reasoning: result.reasoning || "Ruta calculada estratégicamente.",
      keyHighlight: result.keyHighlight || "Ruta optimizada para minimizar cruces de río.",
      zoneSummary: result.zoneSummary || [],
      optimizedOrders: reorderedOrders.length > 0 ? reorderedOrders : orders,
    };

  } catch (error: any) {
    console.error("Optimization failed after retries:", error);
    
    const errorMessage = error?.message || "Error desconocido";
    
    // 3. Fallback - Specific markers for UI detection
    return {
      reasoning: `FALLBACK_MODE: Error Técnico: ${errorMessage}`, // Removed substring limit to show full error
      keyHighlight: "Modo manual activo: No se aplicó inteligencia artificial.",
      zoneSummary: [{ zoneName: "Sin Optimizar", orderCount: orders.length }],
      optimizedOrders: orders
    };
  }
};