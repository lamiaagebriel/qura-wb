import z from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { formatPrice } from "@/lib/utils";
import {
  checkOrderInfo,
  checkOrderPayment,
  checkOrderShipping,
  Validation,
  validations,
} from "@/lib/validations";

export type CartProduct = Omit<Validation["cart-product-schema"], "quantity">;
export type CartItem = CartProduct;
export type ProductIdProps = {
  productId: Pick<CartProduct, "id">["id"];
  attributes: Array<
    Pick<Pick<CartProduct, "attributes">["attributes"][0], "name" | "value">
  >;
};

export type StoreDiscount = Validation["order-schema"]["discount"];
export type StoreCart = {
  products: { [productId: string]: CartItem };
  discount?: StoreDiscount;
  info?: z.infer<typeof checkOrderInfo>;
  shipping?: z.infer<typeof checkOrderShipping>;
  payment?: z.infer<typeof checkOrderPayment>;
};

export type CartState = {
  cart: {
    [storeId: string]: StoreCart;
  };
};

export interface CartActions {
  addProduct: (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => void;
  removeProduct: (props: { storeId: string } & ProductIdProps) => void;
  updateQuantity: (
    props: {
      storeId: string;
      quantity: number;
    } & ProductIdProps
  ) => void;
  clearStoreCart: (storeId: string) => void;
  clearCart: () => void;
  setStoreDiscount: (props: {
    storeId: string;
    discount: StoreDiscount;
  }) => void;
  removeStoreDiscount: (storeId: string) => void;
  setStoreInfo: (props: {
    storeId: string;
    info: z.infer<typeof checkOrderInfo>;
  }) => void;
  removeStoreInfo: (storeId: string) => void;
  setStoreShipping: (props: {
    storeId: string;
    shipping: z.infer<typeof checkOrderShipping>;
  }) => void;
  removeStoreShipping: (storeId: string) => void;
  setStorePayment: (props: {
    storeId: string;
    payment: z.infer<typeof checkOrderPayment>;
  }) => void;
  removeStorePayment: (storeId: string) => void;
}

export interface CartSelectors {
  getProductsByStore: (storeId: string) => CartItem[];
  getTotalByStore: (storeId: string) => number;
  getNumbersByStore: (storeId: string) => {
    subtotal: number;
    discountAmount: number;
    total: number;
    deliveryFee: number;
  };
  getGrandTotal: () => number;
  getCartItemCount: () => number;
  getStoreItemCount: (storeId: string) => number;
  isProductInCart: (
    props: {
      storeId: string;
    } & ProductIdProps
  ) => boolean;
  getStoreDiscount: (storeId: string) => StoreDiscount | undefined;
  getStoreDiscountAmount: (storeId: string) => number;
}

export type CartStore = CartState & CartActions & CartSelectors;

const initialState: CartState = {
  cart: {},
};

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      addProduct: (
        payload: Omit<CartItem, "quantity"> & { quantity?: number }
      ) => {
        set((state) => {
          const product = payload;
          const storeId = product?.storeId;
          const productId = product.id;

          // Initialize store cart if it doesn't exist
          if (!state.cart[storeId]) state.cart[storeId] = { products: {} };
          if (!state.cart[storeId]?.["products"]?.[productId]) {
            // Add new product to the store cart
            const newItem = validations["cart-product-schema"].parse({
              ...payload,
              attributes: payload?.attributes?.map((e) => ({
                ...e,
                quantity: e?.quantity ?? 1,
              })),
            });
            state.cart[storeId]["products"][productId] = newItem;
            return;
          }

          // If product already exists in the store, increase quantity
          // Merge existing and payload attributes, summing quantities for matching (name, value) pairs,
          // and including all unique attributes from both.
          const existingAttrs =
            state.cart[storeId]?.["products"]?.[productId].attributes ?? [];
          const payloadAttrs = payload.attributes ?? [];

          // Create a map to merge by (name, value)
          const attrMap = new Map<string, any>();

          // Add existing attributes to the map
          for (const attr of existingAttrs) {
            const key = `${attr.name}::${attr.value}`;
            attrMap.set(key, { ...attr });
          }

          // Add payload attributes, summing quantity if already present
          for (const attr of payloadAttrs) {
            const key = `${attr.name}::${attr.value}`;
            if (attrMap.has(key)) {
              const existing = attrMap.get(key);
              attrMap.set(key, {
                ...existing,
                quantity: (existing.quantity ?? 1) + (attr.quantity ?? 1),
              });
            } else {
              attrMap.set(key, { ...attr, quantity: attr.quantity ?? 1 });
            }
          }

          state.cart[storeId]["products"][productId].attributes = Array.from(
            attrMap.values()
          );
        });
      },

      removeProduct: ({
        storeId,
        productId,
        attributes,
      }: { storeId: string } & ProductIdProps) => {
        set((state) => {
          const product = state.cart[storeId]?.["products"]?.[productId];
          if (!product) return;

          // If no attributes specified, remove the whole product
          if (
            !attributes ||
            !Array.isArray(attributes) ||
            attributes.length === 0
          ) {
            delete state.cart[storeId]?.["products"]?.[productId];
          } else {
            // Remove only the specified attribute variants
            const existingAttrs = product.attributes ?? [];
            // Remove all attribute objects that match any of the given attributes (by name & value)
            const filteredAttrs = existingAttrs.filter(
              (attr) =>
                !attributes.some(
                  (toRemove) =>
                    attr.name === toRemove.name && attr.value === toRemove.value
                )
            );
            if (filteredAttrs.length === 0) {
              // If no attributes left, remove the product entirely
              delete state.cart[storeId]?.["products"]?.[productId];
            } else {
              state.cart[storeId]["products"][productId].attributes =
                filteredAttrs;
            }
          }

          // Clean up empty store cart
          if (Object.keys(state.cart[storeId]?.["products"]).length === 0) {
            delete state.cart[storeId];
          }
        });
      },

      updateQuantity: ({
        storeId,
        quantity,
        productId,
        attributes,
      }: { storeId: string; quantity: number } & ProductIdProps) => {
        set((state) => {
          const product = state.cart[storeId]?.["products"]?.[productId];
          if (!product) return;

          // If quantity is 0 or less, remove the specified attribute(s) or the whole product
          if (quantity <= 0) {
            if (
              !attributes ||
              !Array.isArray(attributes) ||
              attributes.length === 0
            ) {
              // Remove the whole product
              delete state.cart[storeId]?.["products"]?.[productId];
            } else {
              // Remove only the specified attribute variants
              const existingAttrs = product.attributes ?? [];
              const filteredAttrs = existingAttrs.filter(
                (attr) =>
                  !attributes.some(
                    (toRemove) =>
                      attr.name === toRemove.name &&
                      attr.value === toRemove.value
                  )
              );
              if (filteredAttrs.length === 0) {
                // If no attributes left, remove the product entirely
                delete state.cart[storeId]?.["products"]?.[productId];
              } else {
                state.cart[storeId]["products"][productId].attributes =
                  filteredAttrs;
              }
            }
            // Clean up empty store cart
            if (Object.keys(state.cart[storeId]?.["products"]).length === 0) {
              delete state.cart[storeId];
            }
            return;
          }

          // Update quantity for specific attribute(s)
          if (
            !attributes ||
            !Array.isArray(attributes) ||
            attributes.length === 0
          ) {
            // If no attributes specified, update all attribute variants
            state.cart[storeId]["products"][productId].attributes =
              product.attributes?.map((e) => ({
                ...e,
                quantity,
              }));
          } else {
            // Update only the specified attribute variants
            state.cart[storeId]["products"][productId].attributes =
              product.attributes?.map((e) => {
                const match = attributes.find(
                  (attr) => attr.name === e.name && attr.value === e.value
                );
                if (match) {
                  return { ...e, quantity };
                }
                return e;
              });
          }
        });
      },

      clearStoreCart: (storeId: string) => {
        set((state) => {
          if (state.cart[storeId]) {
            delete state.cart[storeId];
          }
        });
      },

      clearCart: () => {
        set((state) => {
          state.cart = {};
        });
      },

      setStoreDiscount: ({
        storeId,
        discount,
      }: {
        storeId: string;
        discount: StoreDiscount;
      }) => {
        set((state) => {
          if (!state.cart[storeId]) {
            state.cart[storeId] = { products: {}, discount };
          } else {
            state.cart[storeId].discount = discount;
          }
        });
      },

      removeStoreDiscount: (storeId: string) => {
        set((state) => {
          if (state.cart[storeId] && "discount" in state.cart[storeId]) {
            delete state.cart[storeId].discount;
          }
        });
      },

      setStoreInfo: ({
        storeId,
        info,
      }: {
        storeId: string;
        info: z.infer<typeof checkOrderInfo>;
      }) => {
        set((state) => {
          if (!state.cart[storeId]) {
            state.cart[storeId] = { products: {}, info };
          } else {
            state.cart[storeId].info = info;
          }
        });
      },

      removeStoreInfo: (storeId: string) => {
        set((state) => {
          if (state.cart[storeId] && "info" in state.cart[storeId]) {
            delete state.cart[storeId].info;
          }
        });
      },

      setStoreShipping: ({
        storeId,
        shipping,
      }: {
        storeId: string;
        shipping: z.infer<typeof checkOrderShipping>;
      }) => {
        set((state) => {
          if (!state.cart[storeId]) {
            state.cart[storeId] = { products: {}, shipping };
          } else {
            state.cart[storeId].shipping = shipping;
          }
        });
      },

      removeStoreShipping: (storeId: string) => {
        set((state) => {
          if (state.cart[storeId] && "shipping" in state.cart[storeId]) {
            delete state.cart[storeId].shipping;
          }
        });
      },

      setStorePayment: ({
        storeId,
        payment,
      }: {
        storeId: string;
        payment: z.infer<typeof checkOrderPayment>;
      }) => {
        set((state) => {
          if (!state.cart[storeId]) {
            state.cart[storeId] = { products: {}, payment };
          } else {
            state.cart[storeId].payment = payment;
          }
        });
      },

      removeStorePayment: (storeId: string) => {
        set((state) => {
          if (state.cart[storeId] && "payment" in state.cart[storeId]) {
            delete state.cart[storeId].payment;
          }
        });
      },

      // Selectors
      getProductsByStore: (storeId: string) => {
        const store = get().cart[storeId]?.["products"];
        return store ? Object.values(store) : [];
      },

      getTotalByStore: (storeId: string) => {
        const { subtotal } = getOrderNumbers({
          products: get().getProductsByStore(storeId),
          discount: get().cart[storeId]?.discount,
        });

        return subtotal;
      },

      getNumbersByStore: (storeId: string) => {
        return getOrderNumbers({
          products: get().getProductsByStore(storeId),
          discount: get().cart[storeId]?.discount,
          shippingFee: get().cart[storeId]?.shipping?.address?.[0]?.shipping,
        });
      },

      getGrandTotal: () => {
        const state = get();
        return Object.keys(state.cart).reduce((total, storeId) => {
          return total + state.getTotalByStore(storeId);
        }, 0);
      },

      getCartItemCount: () => {
        const state = get();
        // Sum all quantities for all attribute variants of all products in all stores
        return Object.values(state.cart).reduce((total, storeCart) => {
          return (
            total +
            Object.values(storeCart["products"]).reduce((storeTotal, item) => {
              if (
                Array.isArray(item.attributes) &&
                item.attributes.length > 0
              ) {
                // Sum all attribute variant quantities for this product
                return (
                  storeTotal +
                  item.attributes.reduce(
                    (attrTotal, attr) => attrTotal + (attr.quantity ?? 0),
                    0
                  )
                );
              }
              return storeTotal;
            }, 0)
          );
        }, 0);
      },

      getStoreItemCount: (storeId: string) => {
        const products = get().getProductsByStore(storeId);
        // Sum all quantities for all attribute variants of all products in this store
        return products.reduce((total, item) => {
          if (Array.isArray(item.attributes) && item.attributes.length > 0) {
            return (
              total +
              item.attributes.reduce(
                (attrTotal, attr) => attrTotal + (attr.quantity ?? 0),
                0
              )
            );
          }
          return total;
        }, 0);
      },

      isProductInCart: ({
        storeId,
        productId,
      }: {
        storeId: string;
        productId: string;
      }) => {
        const state = get();
        return !!state.cart[storeId]?.["products"]?.[productId];
      },

      getStoreDiscount: (storeId: string): StoreDiscount | undefined => {
        return get().cart[storeId]?.discount;
      },

      getStoreDiscountAmount: (storeId: string): number => {
        // Returns the absolute amount discounted (not percentage)
        const products = get().getProductsByStore(storeId);
        const subtotal = products.reduce((total, item) => {
          if (Array.isArray(item.attributes) && item.attributes.length > 0) {
            return (
              total +
              item.attributes.reduce(
                (attrTotal, attr) =>
                  attrTotal + (attr.price ?? 0) * (attr.quantity ?? 0),
                0
              )
            );
          }
          return total;
        }, 0);
        const discount = get().cart[storeId]?.discount;
        if (discount) {
          if ("value" in discount) {
            return Math.min(subtotal, discount.value);
          }
          if ("percentage" in discount) {
            return Math.min(subtotal, (subtotal * discount.percentage) / 100);
          }
        }
        return 0;
      },
    })),
    {
      name: "cart-storage", // name of item in storage
      partialize: (state) => ({ cart: state.cart }), // only persist the cart
      // Optionally, you can use sessionStorage instead of localStorage:
      // storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Export individual selectors for convenience
export const useCartSelectors = () => {
  const store = useCartStore();
  return {
    getProductsByStore: store.getProductsByStore,
    getTotalByStore: store.getTotalByStore,
    getNumbersByStore: store.getNumbersByStore,
    getGrandTotal: store.getGrandTotal,
    getCartItemCount: store.getCartItemCount,
    getStoreItemCount: store.getStoreItemCount,
    isProductInCart: store.isProductInCart,
    getStoreDiscount: store.getStoreDiscount,
    getStoreDiscountAmount: store.getStoreDiscountAmount,
  };
};

// Export actions for convenience
export const useCartActions = () => {
  const store = useCartStore();
  return {
    addProduct: store.addProduct,
    removeProduct: store.removeProduct,
    updateQuantity: store.updateQuantity,
    clearStoreCart: store.clearStoreCart,
    clearCart: store.clearCart,
    setStoreDiscount: store.setStoreDiscount,
    removeStoreDiscount: store.removeStoreDiscount,
    setStoreInfo: store.setStoreInfo,
    removeStoreInfo: store.removeStoreInfo,
    setStoreShipping: store.setStoreShipping,
    removeStoreShipping: store.removeStoreShipping,
    setStorePayment: store.setStorePayment,
    removeStorePayment: store.removeStorePayment,
  };
};

// Export the raw store for advanced usage
export { useCartStore as cartStore };

// UTILS: some ui helper functions

export function getDiscountLabel({ storeDiscount, subTotal }: any) {
  if (storeDiscount) {
    if ("percentage" in storeDiscount && subTotal > 0) {
      // discountAmount = Math.round((subTotal * storeDiscount.percentage) / 100);
      return `Discount (${storeDiscount.percentage}%)`;
    } else if ("value" in storeDiscount) {
      // discountAmount = Math.min(storeDiscount.value, subTotal);
      return `Discount (${formatPrice(storeDiscount.value)})`;
    }
  }

  return undefined;
}

export function getOrderNumbers({
  products,
  discount,
  shippingFee,
}: {
  products: CartProduct[];
  discount?: Validation["order-schema"]["discount"];
  shippingFee?: number;
}) {
  // Calculate subtotal as a float number
  const subtotal = products.reduce((total, item) => {
    if (Array.isArray(item.attributes) && item.attributes.length > 0) {
      return (
        total +
        item.attributes.reduce((attrTotal, attr) => {
          const price = Number(attr.price) || 0;
          const quantity = Number(attr.quantity) || 0;
          return attrTotal + price * quantity;
        }, 0)
      );
    }
    return total;
  }, 0);

  let discountAmount = 0;
  let total = subtotal;

  if (discount) {
    if ("value" in discount) {
      const value = Number(discount.value) || 0;
      discountAmount = Math.min(value, subtotal);
      total = Math.max(0, subtotal - discountAmount);
    } else if ("percentage" in discount) {
      const percentage = Number(discount.percentage) || 0;
      // Discount amount should be calculated from the original subtotal
      discountAmount = Math.round((subtotal * percentage) / 100);
      total = Math.max(0, subtotal - discountAmount);
    }
  }

  // Delivery fee logic: use options.deliveryFee if provided, otherwise default to 0
  const deliveryFee = shippingFee ?? 0;
  total = total + deliveryFee;

  // Ensure all numbers are precise, round cents to avoid floating point errors
  const result = {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
  return result;
}
