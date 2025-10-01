import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { Validation, validations } from "@/lib/validations";

export type CartProduct = Omit<Validation["cart-product-schema"], "quantity">;
export type CartItem = CartProduct;
export type ProductIdProps = {
  productId: Pick<CartProduct, "id">["id"];
  attributes: Array<
    Pick<Pick<CartProduct, "attributes">["attributes"][0], "name" | "value">
  >;
};

export interface StoreCart {
  [productId: string]: CartItem;
}

export interface CartState {
  cart: {
    [storeId: string]: StoreCart;
  };
}

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
}

export interface CartSelectors {
  getProductsByStore: (storeId: string) => CartItem[];
  getTotalByStore: (storeId: string) => number;
  getGrandTotal: () => number;
  getCartItemCount: () => number;
  getStoreItemCount: (storeId: string) => number;
  isProductInCart: (
    props: {
      storeId: string;
    } & ProductIdProps
  ) => boolean;
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
          if (!state.cart[storeId]) state.cart[storeId] = {};
          if (!state.cart[storeId][productId]) {
            // Add new product to the store cart
            const newItem = validations["cart-product-schema"].parse({
              ...payload,
              attributes: payload?.attributes?.map((e) => ({
                ...e,
                quantity: e?.quantity ?? 1,
              })),
            });
            state.cart[storeId][productId] = newItem;
            return;
          }

          // If product already exists in the store, increase quantity
          // Merge existing and payload attributes, summing quantities for matching (name, value) pairs,
          // and including all unique attributes from both.
          const existingAttrs = state.cart[storeId][productId].attributes ?? [];
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

          state.cart[storeId][productId].attributes = Array.from(
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
          const product = state.cart[storeId]?.[productId];
          if (!product) return;

          // If no attributes specified, remove the whole product
          if (
            !attributes ||
            !Array.isArray(attributes) ||
            attributes.length === 0
          ) {
            delete state.cart[storeId][productId];
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
              delete state.cart[storeId][productId];
            } else {
              state.cart[storeId][productId].attributes = filteredAttrs;
            }
          }

          // Clean up empty store cart
          if (Object.keys(state.cart[storeId]).length === 0) {
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
          const product = state.cart[storeId]?.[productId];
          if (!product) return;

          // If quantity is 0 or less, remove the specified attribute(s) or the whole product
          if (quantity <= 0) {
            if (
              !attributes ||
              !Array.isArray(attributes) ||
              attributes.length === 0
            ) {
              // Remove the whole product
              delete state.cart[storeId][productId];
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
                delete state.cart[storeId][productId];
              } else {
                state.cart[storeId][productId].attributes = filteredAttrs;
              }
            }
            // Clean up empty store cart
            if (Object.keys(state.cart[storeId]).length === 0) {
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
            state.cart[storeId][productId].attributes = product.attributes?.map(
              (e) => ({
                ...e,
                quantity,
              })
            );
          } else {
            // Update only the specified attribute variants
            state.cart[storeId][productId].attributes = product.attributes?.map(
              (e) => {
                const match = attributes.find(
                  (attr) => attr.name === e.name && attr.value === e.value
                );
                if (match) {
                  return { ...e, quantity };
                }
                return e;
              }
            );
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

      // Selectors
      getProductsByStore: (storeId: string) => {
        const store = get().cart[storeId];
        return store ? Object.values(store) : [];
      },

      getTotalByStore: (storeId: string) => {
        const products = get().getProductsByStore(storeId);
        // Each product may have multiple attribute objects, each with price and quantity
        return products.reduce((total, item) => {
          if (Array.isArray(item.attributes) && item.attributes.length > 0) {
            // Sum over all attribute variants for this product
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
            Object.values(storeCart).reduce((storeTotal, item) => {
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
        return !!state.cart[storeId]?.[productId];
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
    getGrandTotal: store.getGrandTotal,
    getCartItemCount: store.getCartItemCount,
    getStoreItemCount: store.getStoreItemCount,
    isProductInCart: store.isProductInCart,
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
  };
};

// Export the raw store for advanced usage
export { useCartStore as cartStore };
