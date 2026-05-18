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
 