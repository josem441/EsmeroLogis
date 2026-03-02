export interface Order {
  id: string;
  clientName: string;
  address: string;
  products: string;
  contactInfo?: string; // Changed from notes to contactInfo
  status: 'pending' | 'completed';
}

export interface ZoneSummary {
  zoneName: string;
  orderCount: number;
}

export interface OptimizedRouteResult {
  reasoning: string;
  keyHighlight: string; // Changed from list of benefits to single specific highlight
  zoneSummary: ZoneSummary[];
  optimizedOrders: Order[];
  totalDistanceEstimate?: string;
  totalTimeEstimate?: string;
}

export interface RouteHistoryItem {
  id: string;
  date: string;
  summary: string;
  totalOrders: number;
  data: OptimizedRouteResult;
}

export interface ExcelRow {
  [key: string]: string | number;
}