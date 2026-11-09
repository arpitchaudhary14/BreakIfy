export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = `https://api.breakify.site${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('Host', 'api.breakify.site');

  const isGetOrHead = context.request.method === 'GET' || context.request.method === 'HEAD';

  const newRequest = new Request(targetUrl, {
    method: context.request.method,
    headers: headers,
    body: isGetOrHead ? undefined : context.request.body,
    redirect: 'follow',
  });

  return fetch(newRequest);
}
