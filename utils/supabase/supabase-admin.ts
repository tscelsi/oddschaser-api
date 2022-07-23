import { createClient } from '@supabase/supabase-js';
import { stripe } from '../stripe';
import { toDateTime } from '../helpers';
import { Customer, UserDetails, Price, Product, Subscription } from 'types';
import Stripe from 'stripe';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const getUser = async (token: string) => {
  const { data, error } = await supabaseAdmin.auth.api.getUser(token);

  if (error) {
    throw error;
  }

  return data;
};

export const getUserSubscription = async (user_id: string) => {
  const res = await supabaseAdmin
    .from<Subscription>('subscriptions')
    .select('*, prices(*, products(*))')
    .eq('user_id', user_id)
    .in('status', ['trialing', 'active'])
    .single();
  if (!res) return null;
  else return res.data;
}

export const getCustomerId = async ({ uuid }: { uuid: string }) => {
  const { data, error } = await supabaseAdmin.from<Customer>('customers').select('stripe_customer_id').eq('id', uuid).single();
  if (error) {
    // No customer record found
    throw new Error(error.message);
  } else {
    return data;
  }
}

export const userIsSubscribed = async (token: string) => {
  if (!token) return false;
  try {
    const user = await getUser(token);
    if (!user) throw new Error('Could not get user');
    const subscription = await getUserSubscription(user.id);
    if (subscription?.status === "active") { return true } else { return false };
  } catch (err) {
    throw err;
  }
}

/**
 * This function deletes a user from the supabase database. If the user also has an active subscription, it is cancelled.
 * @param token the JWT token used to authenticate the user session and identify the user.
 */
export const deleteUser = async (token: string) => {
  try {
    const { user, error } = await supabaseAdmin.auth.api.getUser(token);
    if (error) {
      throw error;
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY && user) {
      // check if user has subscription and subsequently cancel if needed.
      const subscription = await getUserSubscription(user.id);
      if (subscription) await stripe.subscriptions.del(subscription.id);
      // remove row from users table
      await supabaseAdmin
        .from<UserDetails>('users')
        .delete()
        .eq("id", user.id)
      const { data, error } = await supabaseAdmin.auth.api.deleteUser(user.id);
      if (error) {
        console.log(error);
        throw error;
      }
    } else {
      throw new Error("Server error.")
    }
  } catch (error) {
    throw error;
  }
}

// It should also properly catch and throw errors
export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.[0] ?? null,
    metadata: product.metadata
  };

  const { error } = await supabaseAdmin.from<Product>('products').insert([productData], { upsert: true });
  if (error) throw error;
  console.log(`Product inserted/updated: ${product.id}`);
};

export const upsertPriceRecord = async (price: Stripe.Price) => {
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? undefined,
    type: price.type,
    unit_amount: price.unit_amount ?? undefined,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
    trial_period_days: price.recurring?.trial_period_days,
    metadata: price.metadata
  };

  const { error } = await supabaseAdmin.from<Price>('prices').insert([priceData], { upsert: true });
  if (error) throw error;
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetrieveCustomer = async ({ email, uuid }: { email: string; uuid: string }) => {
  const { data, error } = await supabaseAdmin.from<Customer>('customers').select('stripe_customer_id').eq('id', uuid).single();
  if (error) {
    // No customer record found, let's create one.
    const customerData: { metadata: { supabaseUUID: string }; email?: string } = {
      metadata: {
        supabaseUUID: uuid
      }
    };
    if (email) customerData.email = email;
    const customer = await stripe.customers.create(customerData);
    // Now insert the customer ID into our Supabase mapping table.
    const { error: supabaseError } = await supabaseAdmin
      .from('customers')
      .insert([{ id: uuid, stripe_customer_id: customer.id }]);
    if (supabaseError) throw supabaseError;
    console.log(`New customer created and inserted for ${uuid}.`);
    return customer.id;
  }
  if (data) return data.stripe_customer_id;
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
export const copyBillingDetailsToCustomer = async (uuid: string, payment_method: Stripe.PaymentMethod) => {
  //Todo: check this assertion
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  const { error } = await supabaseAdmin
    .from<UserDetails>('users')
    .update({
      billing_address: address,
      payment_method: payment_method[payment_method.type]
    })
    .eq('id', uuid);
  if (error) throw error;
};

export const manageSubscriptionStatusChange = async (subscriptionId: string, customerId: string, createAction = false) => {
  // Get customer's UUID from mapping table.
  const { data: customerData, error: noCustomerError } = await supabaseAdmin
    .from<Customer>('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  if (noCustomerError) throw noCustomerError;

  const { id: uuid } = customerData || {};

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method']
  });
  // Upsert the latest status of the subscription object.
  const subscriptionData = {
    id: subscription.id,
    user_id: uuid,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    //TODO check quantity on subscription
    // @ts-ignore
    quantity: subscription.quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at) : null,
    canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at) : null,
    current_period_start: toDateTime(subscription.current_period_start),
    current_period_end: toDateTime(subscription.current_period_end),
    created: toDateTime(subscription.created),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at) : null,
    trial_start: subscription.trial_start ? toDateTime(subscription.trial_start) : null,
    trial_end: subscription.trial_end ? toDateTime(subscription.trial_end) : null
  };

  const { error } = await supabaseAdmin.from('subscriptions').insert([subscriptionData], { upsert: true });
  if (error) throw error;
  console.log(`Inserted/updated subscription [${subscription.id}] for user [${uuid}]`);

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (createAction && subscription.default_payment_method && uuid)
    //@ts-ignore
    await copyBillingDetailsToCustomer(uuid, subscription.default_payment_method);
};
