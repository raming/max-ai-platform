// Generated API Sample Code
// Created: 2025-10-21T23:28:45.814Z

class GHLAPIClient {
  constructor(tokenId, options = {}) {
    this.tokenId = tokenId;
    this.baseUrl = options.baseUrl || "https://backend.leadconnectorhq.com";
    this.defaultHeaders = {
      "Content-Type": "application/json"
    };
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      "token-id": this.tokenId
    };

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

}

// Usage:
// const client = new GHLAPIClient("your-token-id");
// const result = await client.get_users_id();

module.exports = GHLAPIClient;