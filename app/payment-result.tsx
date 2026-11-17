import { Redirect } from 'expo-router';

/**
 * PayU's return link (vyaparhood://payment-result) is normally caught by
 * the checkout WebView. If the OS opens it instead, just go back to the
 * start; the server has already recorded the payment.
 */
export default function PaymentResult() {
  return <Redirect href="/" />;
}
