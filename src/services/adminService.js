/**
 * Admin Service (Standalone Frontend)
 * Provides offline mock administrative dashboard and reporting metrics.
 */

export const adminService = {
  // 1. Dashboard Analytics & Statistics
  getDashboardStats: async () => {
    return {
      total_sales_value: 1250000,
      gold_sold_grams: 85.5,
      silver_sold_grams: 450.0,
      total_users: 128,
      pending_kyc: 2,
      pending_withdrawals: 1,
    };
  },

  getSalesByMetal: async () => {
    return {
      gold: { sales_value: 950000, grams: 67.0 },
      silver: { sales_value: 300000, grams: 1123.0 },
    };
  },

  getSalesChart: async (period = 'month') => {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      gold_sales: [12000, 15000, 8000, 22000, 18000, 31000, 25000],
      silver_sales: [3000, 4500, 2100, 5600, 4200, 7800, 6100],
    };
  },

  getWithdrawalsSummary: async () => {
    return {
      pending_count: 1,
      approved_count: 14,
      rejected_count: 0,
      total_withdrawn_gold_grams: 5.5,
      total_withdrawn_silver_grams: 120.0,
    };
  },

  getRecentTransactions: async (limit = 5) => {
    return [];
  },

  getRecentMembers: async (limit = 5) => {
    return [];
  },

  getNotificationSummary: async () => {
    return { unread: 0, total: 2 };
  },

  // 2. User & Customer Management
  getUsers: async (params = {}) => {
    return { items: [], total: 0 };
  },

  getUserDetail: async (userId) => {
    return null;
  },

  // 3. KYC Verification Operations
  getPendingKycList: async (params = {}) => {
    return { items: [], total: 0 };
  },

  getKycDetail: async (kycId) => {
    return null;
  },

  approveKyc: async (kycId) => {
    return { success: true };
  },

  rejectKyc: async (kycId, reason) => {
    return { success: true };
  },

  // 4. Rate Management
  getRates: async () => {
    return {
      gold: { active_rate: 14190.00, custom_rate_enabled: false },
      silver: { active_rate: 267.00, custom_rate_enabled: false },
    };
  },

  updateCustomRate: async ({ metal, customRate, customRateEnabled = true }) => {
    return { success: true };
  },

  refreshRates: async () => {
    return { success: true };
  },

  // 5. Purchases & Orders
  getPurchases: async (params = {}) => {
    return { items: [], total: 0 };
  },

  // 6. Withdrawals
  getWithdrawals: async (params = {}) => {
    return { items: [], total: 0 };
  },

  approveWithdrawal: async (withdrawalId) => {
    return { success: true };
  },

  rejectWithdrawal: async (withdrawalId, reason) => {
    return { success: true };
  },

  // 7. Transactions
  getTransactions: async (params = {}) => {
    return { items: [], total: 0 };
  },

  // 8. Notifications
  getNotifications: async (params = {}) => {
    return { items: [], total: 0 };
  },
};

export default adminService;
