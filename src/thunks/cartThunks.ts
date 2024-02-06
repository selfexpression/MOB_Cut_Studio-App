import { createAsyncThunk } from '@reduxjs/toolkit';
import { Firestore } from '@firebase/firestore';

import { getCurrentUserCart, updateCartItems } from '../services/cartService';
import { actions } from '../slices/cartSlice';
import type { CartItem } from '../types/interfaces';
import type { RootState } from '../types/aliases';

type CartActionType = 'add' | 'quantity' | 'trash';

interface CartAsyncThunkPayload {
  db: Firestore;
  userUID: string;
  cartItem?: CartItem;
  cartActionType: CartActionType;
  updateQuantityType?: string;
  id?: number;
}

export const updateCart = createAsyncThunk(
  'cart/updateCart',
  async ({
    db, userUID, cartItem, cartActionType, updateQuantityType, id,
  }: CartAsyncThunkPayload, { dispatch, getState }) => {
    const map = {
      add: () => dispatch(actions.addToCart(cartItem)),
      quantity: () => dispatch(actions.updateQuantity({ updateQuantityType, id })),
      trash: () => dispatch(actions.setEmptyCart()),
    };

    map[cartActionType]();

    const state = getState() as RootState;
    const updatedCartItems = state.cart.items;

    try {
      await updateCartItems(userUID, updatedCartItems, db);
    } catch (error) {
      console.error('Error updating the cart in Firestore:', error);
      throw error;
    }
  },
);

export const syncCartWithDatabase = createAsyncThunk(
  'cart/syncWithDatabase',
  async ({ userUID, db }: { userUID: string, db: Firestore }, { dispatch }) => {
    if (!userUID) return;

    try {
      const cartItems: CartItem[] = await getCurrentUserCart(userUID, db);

      if (!cartItems) return;

      dispatch(actions.setCartItems(cartItems));
    } catch (error) {
      console.error('Error loading the cart in Firestore:', error);
      throw error;
    }
  },
);
