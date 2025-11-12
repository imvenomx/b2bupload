'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load products from API and migrate any localStorage data once
  useEffect(() => {
    const load = async () => {
      try {
        // First, try fetch from API
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch products');
        const apiProducts = (await res.json()) as Product[];

        // One-time migration: if API empty and localStorage has items, push them
        const stored = localStorage.getItem('woocommerce-products');
        if ((!apiProducts || apiProducts.length === 0) && stored) {
          try {
            const parsed = JSON.parse(stored) as Product[];
            for (const p of parsed) {
              const createRes = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...p, createdAt: undefined }),
              });
              if (!createRes.ok) {
                // continue migration even if some fail
                // eslint-disable-next-line no-console
                console.error('Failed to migrate product', p.id);
              }
            }
            // Clear localStorage after migration attempt
            localStorage.removeItem('woocommerce-products');

            // Refetch after migration
            const refetch = await fetch('/api/products', { cache: 'no-store' });
            const refetched = (await refetch.json()) as Product[];
            setProducts(refetched.map(p => ({ ...p, createdAt: new Date(p.createdAt) })));
            setLoaded(true);
            return;
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Migration error:', e);
          }
        }

        setProducts(apiProducts.map(p => ({ ...p, createdAt: new Date(p.createdAt) })));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading products:', error);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const addProduct = async (product: Product) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to create product');
    const { id } = await res.json();
    const created: Product = { ...product, id, createdAt: new Date() };
    setProducts((prev) => [created, ...prev]);
  };

  const updateProduct = async (id: string, product: Product) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to update product');
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...product } : p)));
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
