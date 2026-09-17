/**
 * Notification Service (Standalone Frontend)
 * Manages customer notifications offline.
 */

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'Welcome to SJ Jewelers Vault',
    message: 'Start accumulating 22K Gold and 99.9% Pure Silver with zero locker charges.',
    type: 'welcome',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif_2',
    title: 'Live Rates Updated',
    message: 'Today\'s Gold 22K rate is ₹14,190/gm and Silver is ₹267/gm.',
    type: 'rate_alert',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const notificationService = {
  /**
   * Fetch customer notifications
   */
  getNotifications: async (params = {}) => {
    return { items: MOCK_NOTIFICATIONS, total: MOCK_NOTIFICATIONS.length };
  },

  /**
   * Fetch total unread notifications count
   */
  getUnreadCount: async () => {
    return { unread_count: MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length };
  },

  /**
   * Fetch single notification details by ID
   */
  getNotificationById: async (id) => {
    return MOCK_NOTIFICATIONS.find((n) => n.id === id) || null;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    const item = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (item) item.is_read = true;
    return { success: true };
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    MOCK_NOTIFICATIONS.forEach((n) => { n.is_read = true; });
    return { success: true };
  },
};

export default notificationService;
