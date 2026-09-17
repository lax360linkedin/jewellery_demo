/**
 * SJ Jewelers Support Configuration
 * Configurable customer support contact details.
 */

export const CUSTOMER_SUPPORT_PHONE =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_CUSTOMER_SUPPORT_PHONE) || '+91 9790400432';

export const CUSTOMER_SUPPORT_EMAIL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_CUSTOMER_SUPPORT_EMAIL) || 'sjjewellery174@gmail.com';

/**
 * Returns a tel: URI formatted for mobile telephone links.
 */
export const getTelephoneLink = (phone = CUSTOMER_SUPPORT_PHONE) => {
  const digits = (phone || '').replace(/[^\d+]/g, '');
  return `tel:${digits}`;
};
