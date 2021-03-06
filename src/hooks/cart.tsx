import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartList = await AsyncStorage.getItem('@GoMarketplace:products');

      if (cartList) {
        setProducts([...JSON.parse(cartList)]);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(item => {
        if (item.id !== id) return item;

        const updatedItem = {
          ...item,
          quantity: item.quantity + 1,
        };

        return updatedItem;
      });

      setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products
        .map(item => {
          if (item.id !== id) return item;

          const updatedItem = {
            ...item,
            quantity: item.quantity - 1,
          };

          return updatedItem;
        })
        .filter(item => item.quantity > 0);

      setProducts(updatedProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        increment(product.id);
        return;
      }

      const newProduct = Object.assign(product, { quantity: 1 });

      setProducts(prevState => [...prevState, newProduct]);
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
