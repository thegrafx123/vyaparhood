import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { CheckoutOutcome, PayUOrder, registerCheckoutPresenter } from '../services/payments/payu';
import { colors, fonts, s } from '../theme/tokens';

const RETURN_PREFIX = 'vyaparhood://payment-result';

const formBody = (fields: Record<string, string>) =>
  Object.entries(fields)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

/**
 * Full-screen PayU checkout. Mount once on any screen that buys (the
 * paywall). `payments.purchase()` opens it and waits for the result.
 */
export function PayUCheckout() {
  const [order, setOrder] = useState<PayUOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const resolver = useRef<((o: CheckoutOutcome) => void) | null>(null);

  useEffect(() => {
    registerCheckoutPresenter(
      (o) =>
        new Promise<CheckoutOutcome>((resolve) => {
          resolver.current = resolve;
          setLoading(true);
          setOrder(o);
        }),
    );
    return () => registerCheckoutPresenter(null);
  }, []);

  const finish = (outcome: CheckoutOutcome) => {
    resolver.current?.(outcome);
    resolver.current = null;
    setOrder(null);
  };

  const intercept = (url: string) => {
    if (!url.startsWith(RETURN_PREFIX)) return false;
    const q = new URLSearchParams(url.split('?')[1] ?? '');
    finish({ status: q.get('status') ?? 'pending', txnid: q.get('txnid') ?? order?.txnid ?? '' });
    return true;
  };

  return (
    <Modal visible={!!order} animationType="slide" onRequestClose={() => finish({ status: 'closed' })}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: s(16),
            paddingVertical: s(12),
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(15), color: colors.ink }}>Secure payment</Text>
          <Pressable accessibilityRole="button" onPress={() => finish({ status: 'closed' })} hitSlop={12}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: s(14), color: colors.blue }}>Cancel</Text>
          </Pressable>
        </View>
        {order ? (
          <WebView
            source={{
              uri: order.action,
              method: 'POST',
              body: formBody(order.fields),
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }}
            originWhitelist={['https://*', 'http://*', 'vyaparhood://*', 'upi://*', 'intent://*']}
            onShouldStartLoadWithRequest={(req) => {
              if (intercept(req.url)) return false;
              // Let UPI apps (GPay, PhonePe, Paytm...) open from the checkout.
              if (/^(upi|intent|phonepe|paytmmp|tez|gpay):/i.test(req.url)) {
                Linking.openURL(req.url).catch(() => {});
                return false;
              }
              return true;
            }}
            onNavigationStateChange={(n: WebViewNavigation) => intercept(n.url)}
            onLoadEnd={() => setLoading(false)}
            setSupportMultipleWindows={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            style={{ flex: 1 }}
          />
        ) : null}
        {loading ? (
          <View style={{ position: 'absolute', top: '50%', alignSelf: 'center' }}>
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
