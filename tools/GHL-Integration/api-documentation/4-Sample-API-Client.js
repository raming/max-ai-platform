/**
 * GHL API Client v2
 * Comprehensive client for interacting with GoHighLevel API
 * 
 * Generated: 2025-10-21T23:31:47.585Z
 * Total Endpoints: 25
 */

class GHLAPIClient {
  /**
   * Initialize GHL API Client
   * @param {string} tokenId - Your token-id from GHL authentication
   * @param {object} options - Configuration options
   */
  constructor(tokenId, options = {}) {
    this.tokenId = tokenId;
    this.baseUrl = options.baseUrl || 'https://backend.leadconnectorhq.com';
    this.version = '2021-07-28';           // ✅ Real version format from API
    this.timeout = options.timeout || 30000;
  }

  /**
   * Make HTTP request with proper headers
   * @private
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = new URL(endpoint, this.baseUrl).href;
    
    // ✅ REAL headers discovered from actual GHL API calls
    const headers = {
      'token-id': this.tokenId,
      'version': '2021-07-28',              // ✅ DATE-based version (not "1.0" or 2)
      'channel': 'APP',                     // ✅ Required
      'source': 'WEB_USER',                 // ✅ Required
      'accept': 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'referer': 'https://app.1prompt.com/',
      'origin': 'https://app.1prompt.com',
      ...options.headers
    };

    const config = {
      method,
      headers,
      timeout: this.timeout
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        throw new Error('Authentication failed - token may be expired');
      }
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error [${response.status}]: ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  // ========== USER ENDPOINTS ==========

  /**
   * Get current authenticated user
   * @returns {Promise} User object
   */
  async getCurrentUser() {
    return this.request('GET', '/users/me');
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} User object
   */
  async getUser(userId) {
    return this.request('GET', `/users/${userId}`);
  }

  // ========== LOCATION ENDPOINTS ==========

  /**
   * Get default location
   * @returns {Promise} Location object
   */
  async getLocation() {
    return this.request('GET', '/location');
  }

  /**
   * Get location by ID
   * @param {string} locationId - Location ID
   * @returns {Promise} Location object
   */
  async getLocationById(locationId) {
    return this.request('GET', `/location/${locationId}`);
  }

  /**
   * List all locations
   * @returns {Promise} Array of locations
   */
  async listLocations() {
    return this.request('GET', '/locations');
  }

  // ========== CONTACT ENDPOINTS ==========

  /**
   * List all contacts
   * @param {object} params - Query parameters (limit, skip, etc.)
   * @returns {Promise} Array of contacts
   */
  async listContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/contact?${query}`;
    return this.request('GET', endpoint);
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise} Contact object
   */
  async getContact(contactId) {
    return this.request('GET', `/contact/${contactId}`);
  }

  /**
   * Create new contact
   * @param {object} contactData - Contact information
   * @returns {Promise} Created contact object
   */
  async createContact(contactData) {
    return this.request('POST', '/contact', contactData);
  }

  /**
   * Update contact
   * @param {string} contactId - Contact ID
   * @param {object} updateData - Data to update
   * @returns {Promise} Updated contact object
   */
  async updateContact(contactId, updateData) {
    return this.request('PUT', `/contact/${contactId}`, updateData);
  }

  // ========== PAGE ENDPOINTS ==========

  /**
   * List all landing pages
   * @returns {Promise} Array of pages
   */
  async listPages() {
    return this.request('GET', '/page');
  }

  /**
   * Get page by ID
   * @param {string} pageId - Page ID
   * @returns {Promise} Page object
   */
  async getPage(pageId) {
    return this.request('GET', `/page/${pageId}`);
  }

  /**
   * Create new page
   * @param {object} pageData - Page configuration
   * @returns {Promise} Created page object
   */
  async createPage(pageData) {
    return this.request('POST', '/page', pageData);
  }

  /**
   * Update page
   * @param {string} pageId - Page ID
   * @param {object} updateData - Data to update
   * @returns {Promise} Updated page object
   */
  async updatePage(pageId, updateData) {
    return this.request('PUT', `/page/${pageId}`, updateData);
  }

  /**
   * Publish page to live
   * @param {string} pageId - Page ID
   * @returns {Promise} Response
   */
  async publishPage(pageId) {
    return this.request('POST', `/page/${pageId}/publish`);
  }

  /**
   * Delete page
   * @param {string} pageId - Page ID
   * @returns {Promise} Response
   */
  async deletePage(pageId) {
    return this.request('DELETE', `/page/${pageId}`);
  }

  // ========== OPPORTUNITY ENDPOINTS ==========

  /**
   * List opportunities/deals
   * @returns {Promise} Array of opportunities
   */
  async listOpportunities() {
    return this.request('GET', '/opportunity');
  }

  /**
   * Get opportunity by ID
   * @param {string} opportunityId - Opportunity ID
   * @returns {Promise} Opportunity object
   */
  async getOpportunity(opportunityId) {
    return this.request('GET', `/opportunity/${opportunityId}`);
  }

  /**
   * Create opportunity
   * @param {object} opportunityData - Opportunity data
   * @returns {Promise} Created opportunity object
   */
  async createOpportunity(opportunityData) {
    return this.request('POST', '/opportunity', opportunityData);
  }

  // ========== CAMPAIGN ENDPOINTS ==========

  /**
   * List campaigns
   * @returns {Promise} Array of campaigns
   */
  async listCampaigns() {
    return this.request('GET', '/campaigns');
  }

  /**
   * Get campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Promise} Campaign object
   */
  async getCampaign(campaignId) {
    return this.request('GET', `/campaign`);
  }

  /**
   * Create campaign
   * @param {object} campaignData - Campaign data
   * @returns {Promise} Created campaign object
   */
  async createCampaign(campaignData) {
    return this.request('POST', '/campaigns', campaignData);
  }

  // ========== FUNNEL ENDPOINTS ==========

  /**
   * List funnels/automations
   * @returns {Promise} Array of funnels
   */
  async listFunnels() {
    return this.request('GET', '/funnel');
  }

  // ========== WEBHOOK ENDPOINTS ==========

  /**
   * List webhooks
   * @returns {Promise} Array of webhooks
   */
  async listWebhooks() {
    return this.request('GET', '/webhook');
  }

  /**
   * Create webhook
   * @param {object} webhookData - Webhook configuration
   * @returns {Promise} Created webhook object
   */
  async createWebhook(webhookData) {
    return this.request('POST', '/webhook', webhookData);
  }

  /**
   * Delete webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise} Response
   */
  async deleteWebhook(webhookId) {
    return this.request('DELETE', `/webhook/${webhookId}`);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GHLAPIClient;
}
