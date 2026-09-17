/**
 * Profile Service (Standalone Frontend)
 * Manages customer personal profile, contact information, nominee, and address details offline.
 */

import { getStoredUser, setStoredUser } from '../utils/authStorage';

export const profileService = {
  /**
   * Fetch authenticated customer's full profile
   */
  getProfile: async () => {
    return (await getStoredUser()) || null;
  },

  /**
   * Create or update customer's profile
   * @param {Object} profileData
   */
  updateProfile: async (profileData = {}) => {
    const current = (await getStoredUser()) || {};
    const updated = {
      ...current,
      ...profileData,
      profileCompleted: true,
      profile_completed: true,
    };
    await setStoredUser(updated);
    return updated;
  },
};

export default profileService;
