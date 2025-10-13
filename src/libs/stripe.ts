import Stripe from "stripe";
import { getProduct } from "../services/product";
import { CartItem } from "../types/cart-item";
import { getStripeSecretKey } from "../utils/get-stripe-secret-key";
import { getFrontendURL } from "../utils/get-fronted-url";

export const stripe = new Stripe(getStripeSecretKey());

type StripeChekoutSessionParams = {
  cart: CartItem[];
  shippingCost: number;
  orderId: number;
};
export const createStripeChekoutSession = async ({
  cart,
  shippingCost,
  orderId,
}: StripeChekoutSessionParams) => {
  let stripeLineItems = [];
  for (let item of cart) {
    const product = await getProduct(item.productId);
    if (product) {
      stripeLineItems.push({
        price_data: {
          product_data: {
            name: product.label,
          },
          currency: "BRL",
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      });
    }
  }

  if (shippingCost > 0) {
    stripeLineItems.push({
      price_data: {
        product_data: {
          name: "Frete",
        },
        currency: "BRL",
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: stripeLineItems,
    mode: "payment",
    metadata: { orderId: orderId.toString() },
    success_url: `${getFrontendURL()}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getFrontendURL()}/my-orders`,
  });
  return session;
};
