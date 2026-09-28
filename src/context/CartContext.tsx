"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean; // true once localStorage has been read on mount
}

type CartAction =
  | { type: "ADD_ITEM"; payload: { item: Omit<CartItem, "qty">; qty: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QTY"; payload: { productId: string; qty: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartItem[] };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  cartHydrated: boolean; // consumers can wait for this before reading items
  addItem: (item: Omit<CartItem, "qty">, qty: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "flamira_cart";

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota exceeded or access denied — fail silently
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.payload, hydrated: true };

    case "ADD_ITEM": {
      const { item, qty } = action.payload;
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...item, qty }] };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.payload.productId),
      };

    case "UPDATE_QTY": {
      const { productId, qty } = action.payload;
      if (qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, qty } : i
        ),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false });

  // Hydrate from localStorage ONCE on mount — sets hydrated: true
  useEffect(() => {
    const stored = loadFromStorage();
    // Always dispatch HYDRATE (even with empty array) to mark hydrated: true
    dispatch({ type: "HYDRATE", payload: stored });
  }, []);

  // Persist to localStorage — only AFTER hydration to avoid wiping stored cart
  useEffect(() => {
    if (!state.hydrated) return; // don't write until we've read
    saveToStorage(state.items);
  }, [state.items, state.hydrated]);

  // Sync across browser tabs
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      try {
        const updated = e.newValue ? (JSON.parse(e.newValue) as CartItem[]) : [];
        dispatch({ type: "HYDRATE", payload: updated });
      } catch {
        // ignore
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ---- Actions ----

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty: number) => {
    dispatch({ type: "ADD_ITEM", payload: { item, qty } });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    dispatch({ type: "UPDATE_QTY", payload: { productId, qty } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  // ---- Derived values ----

  const totalItems = useMemo(
    () => state.items.reduce((sum, i) => sum + i.qty, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [state.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      totalItems,
      subtotal,
      cartHydrated: state.hydrated,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }),
    [state.items, state.hydrated, totalItems, subtotal, addItem, removeItem, updateQty, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a <CartProvider>");
  return ctx;
}
