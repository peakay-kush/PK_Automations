// archived - mpesa removed
console.log('archived');
process.exit(0);

  Body: {
    stkCallback: {
      MerchantRequestID: '072f-4a24-8047-bf11c861645b17729',
      CheckoutRequestID: 'ws_CO_24122025181947086112961056',
      ResultCode: 0,
      ResultDesc: 'Success. Request accepted for processing',
      CallbackMetadata: {
        Item: [
          { Name: 'Amount', Value: 100 },
          { Name: 'MpesaReceiptNumber', Value: 'TST12345' },
          { Name: 'TransactionDate', Value: 20251224181947 },
          { Name: 'PhoneNumber', Value: 254112961056 }
        ]
      }
    }
  }
};

(async () => {
  try {
    const fakeReq = { json: async () => payload };
    const res = await cbModule.POST(fakeReq);
    const text = await res.text();
    console.log('Callback handler returned status', res.status, text);
  } catch (e) {
    console.error('Handler invocation failed', e);
  }
})();