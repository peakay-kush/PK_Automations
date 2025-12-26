export default function patchUrlParse() {
  try {
    const url = require('url');
    if (url && typeof url.parse === 'function') {
      const origParse = url.parse;
      url.parse = (input, parseQueryString) => {
        try {
          const u = new URL(input);
          return {
            href: u.href,
            protocol: u.protocol,
            slashes: input.startsWith(u.protocol + '//'),
            auth: u.username ? (u.username + (u.password ? ':' + u.password : '')) : null,
            host: u.host,
            port: u.port,
            hostname: u.hostname,
            hash: u.hash,
            search: u.search,
            query: parseQueryString ? Object.fromEntries(u.searchParams) : u.searchParams.toString(),
            pathname: u.pathname,
            path: u.pathname + u.search,
          };
        } catch (e) {
          return origParse(input, parseQueryString);
        }
      };
    }
  } catch (e) {
    // non-fatal
  }
}
