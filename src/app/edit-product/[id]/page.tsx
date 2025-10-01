'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProducts } from '@/contexts/ProductContext';
import { Product, ProductType, ProductVariant, ProductAttribute } from '@/types/product';
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const { products, updateProduct } = useProducts();
  const productId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    type: 'simple' as ProductType,
    price: '',
    sku: '',
    mainImage: '',
    galleryImages: [] as string[],
  });

  const [isUploading, setIsUploading] = useState(false);
  
  // Attributes for variable products
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    values: '',
  });

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({
    attributeValues: {} as Record<string, string>,
    sku: '',
    price: '',
    stock: '',
  });

  // Load product data
  useEffect(() => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData({
        name: product.name,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        type: product.type,
        price: product.price.toString(),
        sku: product.sku,
        mainImage: product.mainImage || '',
        galleryImages: product.galleryImages,
      });
      if (product.attributes) {
        setAttributes(product.attributes);
      }
      if (product.variants) {
        setVariants(product.variants);
      }
    } else {
      router.push('/');
    }
  }, [productId, products, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const formDataToUpload = new FormData();
      Array.from(files).forEach((file) => {
        formDataToUpload.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const uploadedUrls = data.urls as string[];

      if (type === 'main' && uploadedUrls.length > 0) {
        setFormData((prev) => ({ ...prev, mainImage: uploadedUrls[0] }));
      } else if (type === 'gallery') {
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, ...uploadedUrls],
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Échec du téléchargement des images. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  const addAttribute = () => {
    if (!newAttribute.name || !newAttribute.values) {
      alert('Veuillez remplir le nom et les valeurs de l\'attribut');
      return;
    }

    const attribute: ProductAttribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newAttribute.name,
      values: newAttribute.values.split(',').map(v => v.trim()).filter(Boolean),
      visible: true,
      variation: true,
    };

    setAttributes([...attributes, attribute]);
    setNewAttribute({ name: '', values: '' });
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
    // Clear variants when attributes change
    setVariants([]);
  };

  const addVariantToList = () => {
    // Validate that all attributes have values
    const missingAttributes = attributes.filter(attr => !newVariant.attributeValues[attr.name]);
    if (missingAttributes.length > 0) {
      alert(`Veuillez sélectionner une valeur pour: ${missingAttributes.map(a => a.name).join(', ')}`);
      return;
    }

    // Use variant price if provided, otherwise use default product price
    let variantPrice = 0;
    if (newVariant.price) {
      variantPrice = parseFloat(newVariant.price);
    } else if (formData.price) {
      variantPrice = parseFloat(formData.price);
    } else {
      alert('Veuillez définir un prix par défaut ou entrer un prix pour cette variante');
      return;
    }

    const variant: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      attributes: newVariant.attributeValues,
      sku: newVariant.sku || '',
      price: variantPrice,
      stock: newVariant.stock ? parseInt(newVariant.stock) : undefined,
    };

    setVariants([...variants, variant]);
    setNewVariant({ attributeValues: {}, sku: '', price: '', stock: '' });
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name) {
      alert('Veuillez remplir le champ obligatoire : Nom du Produit');
      return;
    }

    if (!formData.mainImage) {
      alert('Veuillez ajouter une image principale pour le produit');
      return;
    }

    if (formData.type === 'simple' && !formData.price) {
      alert('Veuillez entrer un prix pour les produits simples');
      return;
    }

    if (formData.type === 'variable' && variants.length === 0) {
      alert('Veuillez ajouter au moins une variante pour les produits variables');
      return;
    }

    const product: Product = {
      id: productId,
      name: formData.name,
      shortDescription: formData.shortDescription,
      longDescription: formData.longDescription,
      type: formData.type,
      price: formData.type === 'simple' ? parseFloat(formData.price) : 0,
      sku: formData.sku,
      mainImage: formData.mainImage,
      galleryImages: formData.galleryImages,
      attributes: formData.type === 'variable' ? attributes : undefined,
      variants: formData.type === 'variable' ? variants : undefined,
      createdAt: products.find((p) => p.id === productId)?.createdAt || new Date(),
    };

    updateProduct(productId, product);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux Produits
          </Link>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
            Modifier le Produit
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Modifiez les détails du produit ci-dessous
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          {/* Product Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Nom du Produit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
              placeholder="Entrez le nom du produit"
              required
            />
          </div>

          {/* Short Description */}
          <div className="mb-6">
            <label htmlFor="shortDescription" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Description Courte du Produit
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
              placeholder="Brève description du produit"
            />
          </div>

          {/* Long Description */}
          <div className="mb-6">
            <label htmlFor="longDescription" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Description Longue du Produit
            </label>
            <textarea
              id="longDescription"
              name="longDescription"
              value={formData.longDescription}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all resize-y"
              placeholder="Description détaillée du produit"
            />
          </div>

          {/* Product Type */}
          <div className="mb-6">
            <label htmlFor="type" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Type de Produit <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
            >
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {/* SKU */}
          <div className="mb-6">
            <label htmlFor="sku" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              SKU du Produit
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
              placeholder="Entrez le SKU (optionnel)"
            />
          </div>

          {/* Price (only for simple products) */}
          {formData.type === 'simple' && (
            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Prix du Produit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">MAD</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-16 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                  placeholder="0.00"
                  required={formData.type === 'simple'}
                />
              </div>
            </div>
          )}

          {/* Default Price for Variable Products */}
          {formData.type === 'variable' && (
            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Prix par Défaut des Variantes
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Ce prix sera appliqué à toutes les variantes. Vous pouvez le remplacer pour des variantes spécifiques.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">MAD</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-16 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Attributes & Variants (only for variable products) */}
          {formData.type === 'variable' && (
            <div className="mb-6 space-y-6">
              {/* Attributes Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Attributs du Produit <span className="text-red-500">*</span>
                </label>
                
                {/* Attribute List */}
                {attributes.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {attributes.map((attribute, index) => (
                      <div
                        key={attribute.id}
                        className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {attribute.name}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-wrap gap-1 mt-1">
                            {attribute.values.map((value, idx) => (
                              <span key={idx} className="inline-block bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-xs">
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Attribute Form */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white">Ajouter un Attribut</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      value={newAttribute.name}
                      onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white text-sm"
                      placeholder="Nom de l'attribut (ex: Couleur, Taille)"
                    />
                    <input
                      type="text"
                      value={newAttribute.values}
                      onChange={(e) => setNewAttribute({ ...newAttribute, values: e.target.value })}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white text-sm"
                      placeholder="Valeurs séparées par des virgules (ex: Rouge, Bleu, Vert)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter l&apos;Attribut
                  </button>
                </div>
              </div>

              {/* Variants Section - Only show if attributes exist */}
              {attributes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                    Variantes du Produit <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Variant List */}
                  {variants.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {variants.map((variant, index) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {Object.entries(variant.attributes).map(([key, value]) => `${key}: ${value}`).join(' | ')}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              SKU: {variant.sku} | Prix: {variant.price.toFixed(2)} MAD
                              {variant.stock && ` | Stock: ${variant.stock}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Variant Form */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Ajouter une Nouvelle Variante</h4>
                    
                    {/* Attribute Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {attributes.map((attribute) => (
                        <div key={attribute.id}>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                            {attribute.name}
                          </label>
                          <select
                            value={newVariant.attributeValues[attribute.name] || ''}
                            onChange={(e) => setNewVariant({
                              ...newVariant,
                              attributeValues: {
                                ...newVariant.attributeValues,
                                [attribute.name]: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white text-sm"
                          >
                            <option value="">Sélectionner {attribute.name}</option>
                            {attribute.values.map((value, idx) => (
                              <option key={idx} value={value}>{value}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Variant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newVariant.sku}
                        onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white text-sm"
                        placeholder="SKU (optionnel)"
                      />
                      <input
                        type="number"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                        step="0.01"
                        min="0"
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white text-sm"
                        placeholder="Prix (optionnel, utilise le prix par défaut)"
                      />
                      <input
                        type="number"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                        min="0"
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white text-sm"
                        placeholder="Stock (optionnel)"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addVariantToList}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter la Variante
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Image */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Image Principale du Produit
            </label>
            {formData.mainImage ? (
              <div className="relative w-48 h-48 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.mainImage}
                  alt="Principal"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, mainImage: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-700 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {isUploading ? 'Téléchargement...' : 'Cliquez pour télécharger l\'image principale'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'main')}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Gallery Images */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Images de Galerie du Produit
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-3">
              {formData.galleryImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`Galerie ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className={`aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-700 flex flex-col items-center justify-center ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-xs text-slate-600 dark:text-slate-400 text-center px-2">
                  {isUploading ? 'Téléchargement...' : 'Ajouter des Images'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'gallery')}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              Enregistrer les Modifications
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
