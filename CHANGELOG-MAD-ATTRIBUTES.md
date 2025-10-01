# Changelog - Système d'Attributs WooCommerce & Devise MAD

## ✅ Changements Majeurs

### 1. **Devise MAD (Dirham Marocain)**
Tous les prix sont maintenant affichés en MAD au lieu d'euros (€):
- ✅ Page principale: Prix affichés en "XXX MAD"
- ✅ Page d'ajout de produit: Symbole "MAD" au lieu de "€"
- ✅ Page de modification de produit: Symbole "MAD" au lieu de "€"  
- ✅ Variantes: Prix affichés en "XXX MAD"

### 2. **Système d'Attributs WooCommerce**
Implémentation complète du système d'attributs comme WooCommerce:

#### Structure des Attributs
```typescript
export interface ProductAttribute {
  id: string;
  name: string;           // Ex: "Couleur", "Taille"
  values: string[];       // Ex: ["Rouge", "Bleu", "Vert"]
  visible: boolean;
  variation: boolean;     // Utilisé pour les variations
}
```

#### Structure des Variantes (Mise à Jour)
```typescript
export interface ProductVariant {
  id: string;
  attributes: Record<string, string>;  // Ex: { "Couleur": "Rouge", "Taille": "M" }
  sku: string;
  price: number;
  stock?: number;
  image?: string;
}
```

### 3. **Workflow des Produits Variables**

#### Étape 1: Ajouter des Attributs
1. Cliquez sur "Ajouter un Attribut"
2. Entrez le nom (ex: "Couleur")
3. Entrez les valeurs séparées par des virgules (ex: "Rouge, Bleu, Vert")
4. Les attributs s'affichent avec leurs valeurs sous forme de badges

**Exemple:**
- **Couleur**: Rouge, Bleu, Vert
- **Taille**: S, M, L, XL

#### Étape 2: Créer des Variantes
1. Une fois les attributs ajoutés, la section variantes apparaît
2. Sélectionnez une valeur pour chaque attribut via les listes déroulantes
3. Entrez le SKU et le prix spécifiques à cette variante
4. Optionnellement, entrez le stock
5. Cliquez sur "Ajouter la Variante"

**Exemple de Variante:**
- Couleur: Rouge
- Taille: M
- SKU: TSHIRT-RED-M
- Prix: 250.00 MAD
- Stock: 50

### 4. **Interface Utilisateur**

#### Section Attributs
- 📋 Liste des attributs avec badges de valeurs
- ➕ Formulaire d'ajout d'attribut
- 🗑️ Bouton de suppression pour chaque attribut
- ⚠️ La suppression d'un attribut efface toutes les variantes

#### Section Variantes
- ✅ Affichage conditionnel (uniquement si des attributs existent)
- 🎯 Sélecteurs déroulants pour chaque attribut
- 📝 Champs SKU, Prix (MAD), Stock
- 📊 Liste des variantes créées avec détails complets
- 🔍 Format d'affichage: "Couleur: Rouge | Taille: M"

## 📁 Fichiers Modifiés

### Types & Interfaces
- **`src/types/product.ts`**
  - Ajout de `ProductAttribute` interface
  - Mise à jour de `ProductVariant.attributes` (string → Record<string, string>)
  - Ajout de `attributes?: ProductAttribute[]` au Product
  - Ajout de `image?: string` au ProductVariant

### Pages
- **`src/app/page.tsx`**
  - Prix en MAD
  - Affichage des variantes mis à jour

- **`src/app/add-product/page.tsx`**
  - Système d'attributs complet
  - Nouveaux états: `attributes`, `newAttribute`
  - Fonctions: `addAttribute()`, `removeAttribute()`
  - Variantes avec sélecteurs d'attributs
  - Validation des attributs requis
  - Prix en MAD

- **`src/app/edit-product/[id]/page.tsx`**
  - Même système d'attributs que add-product
  - Chargement des attributs existants
  - Prix en MAD

## 🎯 Fonctionnalités

### Ajout de Produit Variable
1. Sélectionner "Variable" comme type
2. **Ajouter des Attributs:**
   - Nom: Couleur
   - Valeurs: Rouge, Bleu, Vert
3. **Créer des Variantes:**
   - Sélectionner Couleur: Rouge
   - Entrer SKU: PROD-RED
   - Entrer Prix: 299.00 MAD
4. Répéter pour chaque combinaison

### Modification de Produit Variable
1. Les attributs existants sont chargés
2. Possibilité d'ajouter de nouveaux attributs
3. Possibilité de créer de nouvelles variantes
4. La suppression d'un attribut efface les variantes

### Validation
- ✅ Vérification que tous les attributs ont une valeur sélectionnée
- ✅ Au moins un attribut requis pour produits variables
- ✅ Au moins une variante requise pour produits variables
- ✅ SKU et Prix requis pour chaque variante

## 🔄 Export CSV WooCommerce

Les attributs et variantes sont maintenant exportés au format WooCommerce standard:
- Attributs du produit parent
- Variantes avec leurs combinaisons d'attributs
- Prix en MAD pour chaque variante

## 💡 Exemples d'Utilisation

### Exemple 1: T-Shirt avec Couleur et Taille
```
Attributs:
- Couleur: Noir, Blanc, Rouge
- Taille: S, M, L, XL

Variantes possibles (12 combinaisons):
- Noir + S (299 MAD)
- Noir + M (299 MAD)
- Noir + L (299 MAD)
- etc...
```

### Exemple 2: Chaussures avec Pointure
```
Attributs:
- Pointure: 38, 39, 40, 41, 42, 43

Variantes possibles (6 variantes):
- Pointure 38 (450 MAD)
- Pointure 39 (450 MAD)
- etc...
```

## ✨ Avantages

1. **Conformité WooCommerce**: Structure identique à WooCommerce
2. **Flexibilité**: Support de multiples attributs
3. **Interface Intuitive**: Sélecteurs déroulants pour chaque attribut
4. **Validation Robuste**: Vérifications à chaque étape
5. **Prix en MAD**: Devise locale marocaine
6. **Export CSV Compatible**: Prêt pour l'import WooCommerce
