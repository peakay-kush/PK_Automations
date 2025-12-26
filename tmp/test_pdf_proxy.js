(async () => {
  try {
    const url = 'http://localhost:3000/api/pdf-proxy?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const r = await fetch(url, { method: 'HEAD' });
    console.log('status', r.status, 'content-type', r.headers.get('content-type'));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();