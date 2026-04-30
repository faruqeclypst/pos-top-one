import { StoreProfile } from "./db";

export type BusinessType = 'FNB' | 'RETAIL' | 'GENERAL';

export const getTerminology = (type?: BusinessType) => {
  switch (type) {
    case 'FNB':
      return {
        product: 'Menu',
        products: 'Menu',
        inventory: 'Daftar Menu',
        supplier: 'Supplier',
        suppliers: 'Supplier',
        category: 'Kategori Menu',
        stock: 'Ketersediaan',
      };
    case 'RETAIL':
      return {
        product: 'Barang',
        products: 'Barang',
        inventory: 'Stok Barang',
        supplier: 'Supplier',
        suppliers: 'Supplier',
        category: 'Kategori Barang',
        stock: 'Stok',
      };
    default:
      return {
        product: 'Produk',
        products: 'Produk',
        inventory: 'Inventaris',
        supplier: 'Supplier',
        suppliers: 'Supplier',
        category: 'Kategori Produk',
        stock: 'Stok',
      };
  }
};
