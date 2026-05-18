class AuthStrategy {
  getHeaders() { throw new Error("Not implemented"); }
  async refresh() {}
}
 
class APIKeyAuth extends AuthStrategy {
  constructor(apiKey, headerName = "X-API-Key") {
    super();
    this._apiKey = apiKey;
    this._headerName = headerName;
  }
  getHeaders() {
    return { [this._headerName]: this._apiKey };
  }
}
 
class JWTAuth extends AuthStrategy {
  constructor(token) {
    super();
    this._token = token;
  }
  getHeaders() {
    return { Authorization: `Bearer ${this._token}` };
  }
  updateToken(newToken) {
    this._token = newToken;
    console.log("[JWTAuth] Token updated.");
  }
}

class OAuthAuth extends AuthStrategy {
  constructor({ clientId, clientSecret, tokenUrl, expiresIn = 30 }) {
    super();
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._tokenUrl = tokenUrl;
    this._expiresIn = expiresIn * 1000; // ms
    this._accessToken = null;
    this._expiresAt = null;
    this._refreshPromise = null;
  }
 
  _isExpired() {
    if (!this._expiresAt) return true;
    return Date.now() >= this._expiresAt - 5000;
  }
 
  async _fetchToken() {
    console.log("[OAuthAuth] Fetching new access token…");
    await new Promise(r => setTimeout(r, 100)); // simulate network
    this._accessToken = `oauth_token_${Date.now()}`;
    this._expiresAt = Date.now() + this._expiresIn;
    console.log(`[OAuthAuth] Token obtained, expires in ${this._expiresIn / 1000}s`);
  }
 
  async refresh() {
    if (!this._refreshPromise) {
      this._refreshPromise = this._fetchToken().finally(() => {
        this._refreshPromise = null;
      });
    }
    return this._refreshPromise;
  }
 
  async getHeadersAsync() {
    if (this._isExpired()) await this.refresh();
    return { Authorization: `Bearer ${this._accessToken}` };
  }
 
  getHeaders() {
    return { Authorization: `Bearer ${this._accessToken}` };
  }
}

class RateLimiter {
  constructor(maxCalls, periodMs = 1000) {
    this._maxCalls = maxCalls;
    this._period = periodMs;
    this._timestamps = [];
  }
 
  async acquire() {
    const now = Date.now();
    this._timestamps = this._timestamps.filter(t => now - t < this._period);
 
    if (this._timestamps.length >= this._maxCalls) {
      const sleepMs = this._period - (now - this._timestamps[0]);
      console.warn(`[RateLimiter] Limit reached. Sleeping ${sleepMs}ms…`);
      await new Promise(r => setTimeout(r, sleepMs));
      this._timestamps.shift();
    }
    this._timestamps.push(Date.now());
  }
}

class AuthProxy {
  constructor({ auth, baseUrl = "", rateLimiter = null, timeout = 10000 }) {
    this._auth = auth;
    this._baseUrl = baseUrl.replace(/\/$/, "");
    this._rateLimiter = rateLimiter;
    this._timeout = timeout;
    this._requestCount = 0;
  }
 
  switchAuth(newStrategy) {
    console.log(`[AuthProxy] Switching auth to ${newStrategy.constructor.name}`);
    this._auth = newStrategy;
  }
 
  async request(method, path, { headers = {}, body = null } = {}) {
    if (this._rateLimiter) await this._rateLimiter.acquire();
 
    const url = path.startsWith("http") ? path : this._baseUrl + path;
    this._requestCount++;
 
    const authHeaders = this._auth.getHeadersAsync
      ? await this._auth.getHeadersAsync()
      : this._auth.getHeaders();
 
    const allHeaders = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    };
 
    const masked = Object.fromEntries(
      Object.entries(allHeaders).map(([k, v]) =>
        [k, /key|auth/i.test(k) ? "***" : v]
      )
    );
    console.log(`[#${this._requestCount}] ${method.toUpperCase()} ${url}`);
    console.log("  Headers:", masked);
 
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeout);
 
    try {
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers: allHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
 
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      console.log(`  → ${res.status} ${res.statusText}`);
      return { status: res.status, body: json };
    } catch (err) {
      clearTimeout(timer);
      console.error(`  → Request failed: ${err.message}`);
      return { status: null, error: err.message };
    }
  }
 
  get(path, opts) { return this.request("GET", path, opts); }
  post(path, body, opts) { return this.request("POST", path, { ...opts, body }); }
}
 