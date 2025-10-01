'use client';

import { useProducts } from '@/contexts/ProductContext';
import { convertProductsToWooCommerceCSV, downloadCSV } from '@/utils/csvExport';
import { Plus, Download, Package, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { products, deleteProduct } = useProducts();

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('Aucun produit à exporter');
      return;
    }
    const csv = convertProductsToWooCommerceCSV(products);
    downloadCSV(csv, `woocommerce-products-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
              Gestionnaire de Produits WooCommerce
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez vos produits et exportez-les au format WooCommerce
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Link
            href="/add-product"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Ajouter un Produit
          </Link>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Exporter CSV
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Aucun produit pour le moment
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Commencez par ajouter votre premier produit
              </p>
              <Link
                href="/add-product"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter un Produit
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Nom du Produit
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      SKU
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Prix
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Variantes
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Créé le
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-200 dark:border-slate-700 ${
                        index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-750'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.mainImage && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                              {product.shortDescription}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm">
                          {product.sku}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            product.type === 'simple'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {product.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {product.price.toFixed(2)} MAD
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {product.type === 'variable' ? (
                          <span className="text-sm">
                            {product.variants?.length || 0} variante(s)
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/edit-product/${product.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
