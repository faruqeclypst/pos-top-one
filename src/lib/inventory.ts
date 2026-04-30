import db, { type Product } from "./db";

/**
 * Calculates new COGS (HPP) using Weighted Average method.
 * Formula: ((Old Stock * Old COGS) + (New Stock * Buy Price)) / (Old Stock + New Stock)
 */
export const calculateWeightedAverage = (
  oldStock: number,
  oldCOGS: number,
  addedStock: number,
  buyPrice: number
): number => {
  if (addedStock <= 0) return oldCOGS;
  
  const totalOldValue = oldStock * oldCOGS;
  const totalNewValue = addedStock * buyPrice;
  const totalStock = oldStock + addedStock;
  
  if (totalStock <= 0) return buyPrice;
  
  return Math.round((totalOldValue + totalNewValue) / totalStock);
};

/**
 * Records a stock movement and updates product HPP if it's a stock-in.
 */
export const processStockIn = async (
  productId: string,
  addedQty: number,
  buyPrice: number,
  referenceId?: string
) => {
  const product = await db.products.get(productId);
  if (!product) return;

  const oldCOGS = product.cogs || 0;
  const oldStock = product.stock || 0;
  
  // 1. Calculate new HPP
  const newCOGS = calculateWeightedAverage(oldStock, oldCOGS, addedQty, buyPrice);
  
  // 2. Update Product
  await db.products.update(productId, {
    stock: oldStock + addedQty,
    cogs: newCOGS
  });

  // 3. Record History
  await db.hppHistory.add({
    productId,
    oldCOGS,
    newCOGS,
    buyPrice,
    buyQty: addedQty,
    createdAt: Date.now()
  });

  // 4. Record Mutation
  await db.stockMutations.add({
    productId,
    type: 'IN',
    quantity: addedQty,
    referenceId,
    createdAt: Date.now()
  });

  return newCOGS;
};
