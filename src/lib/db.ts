import Dexie, { type EntityTable } from 'dexie';

export interface StoreProfile {
  id: number; // Single row, always 1
  name: string;
  address: string;
  phone: string;
  theme: string;
  accentColor?: string; // e.g. "violet", "blue", "emerald", "rose", "amber"
  logo?: Blob | null;
  isOnboarded: boolean;
  businessType: 'FNB' | 'RETAIL' | 'GENERAL';
  useTable: boolean;
  usePhoneNumber: boolean;
  spreadsheetId?: string; 
  isGoogleConnected?: boolean;
  lastCloudSync?: number;
}

export interface Category {
  id?: number;
  name: string;
}

export interface Product {
  id: string; // Internal UUID
  sku: string; // Unique SKU
  barcode?: string;
  name: string;
  sellingPrice: number;
  cogs: number; // HPP (Weighted Average)
  stock: number;
  unit: string;
  category: string;
  supplierId?: string;
  image?: Blob | null;
  trackStock: boolean; // Enable/disable stock tracking (useful for FNB)
  isActive: boolean; // Enable/disable product (useful for FNB - marking sold out/ unavailable)
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  createdAt: number;
}

export interface Transaction {
  id: string; // e.g. TRX-XYZ
  date: number;
  total: number;
  paymentMethod: string;
  status: 'OPEN' | 'SETTLEMENT' | 'CANCELLED';
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  notes?: string;
  cashTendered?: number;
  cashChange?: number;
  orderType?: 'DINE_IN' | 'TAKEAWAY';
}

export interface TransactionItem {
  id?: number; // Auto-increment
  transactionId: string;
  productId: string;
  qty: number;
  priceAtTransaction: number;
  subtotal: number;
  notes?: string;
}

export interface StockMutation {
  id?: number; // Auto-increment
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  referenceId?: string; // e.g. Transaction ID or DO
  createdAt: number;
}

export interface HPPHistory {
  id?: number;
  productId: string;
  oldCOGS: number;
  newCOGS: number;
  buyPrice: number;
  buyQty: number;
  createdAt: number;
}

const db = new Dexie('TokoKuPOS') as Dexie & {
  storeProfile: EntityTable<StoreProfile, 'id'>;
  categories: EntityTable<Category, 'id'>;
  products: EntityTable<Product, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  transactionItems: EntityTable<TransactionItem, 'id'>;
  stockMutations: EntityTable<StockMutation, 'id'>;
  hppHistory: EntityTable<HPPHistory, 'id'>;
};

// Schema versioning
db.version(1).stores({
  storeProfile: 'id',
  products: 'id, category, name', 
  suppliers: 'id, name',
  transactions: 'id, date, status',
  transactionItems: '++id, transactionId, productId',
  stockMutations: '++id, productId, type, createdAt'
});

db.version(2).stores({
  categories: '++id, name',
  products: 'id, sku, barcode, category, name',
  transactions: 'id, date, status, customerName',
  hppHistory: '++id, productId, createdAt'
});

db.version(4).stores({
  storeProfile: 'id', // spreadsheetId, isGoogleConnected, lastCloudSync added
});

db.version(5).stores({
  products: 'id, sku, barcode, category, name, trackStock',
});

export default db;
