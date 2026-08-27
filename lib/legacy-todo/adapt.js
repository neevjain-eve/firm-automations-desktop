// Adapts the original TO-DO-LIST app's unmodified Express/Vercel-style
// handlers -- module.exports = async (req, res) => { ... } using
// req.method/req.query/req.body and res.status(n).json(x) -- to Next.js App
// Router's Request/Response signature, so those handler files (login.js,
// employees.js, managers.js, personal-tasks.js, seed.js, sync-calendar.js,
// tasks.js, all copied byte-for-byte from the original repo) don't need to
// change at all.
function toAppRoute(handler) {
  return async function (request) {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());

    let body = {};
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const req = { method: request.method, headers, query, body };

    let statusCode = 200;
    let responseBody = null;
    const res = {
      setHeader() {
        return res;
      },
      status(code) {
        statusCode = code;
        return res;
      },
      json(payload) {
        responseBody = payload;
        return res;
      }
    };

    await handler(req, res);

    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

module.exports = { toAppRoute };
