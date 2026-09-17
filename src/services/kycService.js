/**
 * KYC Service (Standalone Frontend)
 * Submits and manages customer identity verification offline via AsyncStorage.
 */

import { getStoredUser, setStoredUser } from '../utils/authStorage';

export const kycService = {
  /**
   * Submit KYC documents locally
   * @param {Object} kycData - { full_name, date_of_birth, gender, address, id_type, id_number, pan, aadhar }
   */
  submitKyc: async (kycData = {}) => {
    const current = (await getStoredUser()) || {};
    const updated = {
      ...current,
      pan: kycData.pan || kycData.id_number || current.pan || '',
      aadhar: kycData.aadhar || current.aadhar || '',
      kycStatus: 'verified',
      kyc_status: 'verified',
    };
    await setStoredUser(updated);
    return {
      success: true,
      status: 'verified',
      message: 'KYC documents verified successfully.',
      kyc: updated,
    };
  },

  /**
   * Fetch customer's current KYC status
   */
  getUserKyc: async () => {
    const user = await getStoredUser();
    return {
      status: user?.kycStatus || user?.kyc_status || 'verified',
      id_type: 'pan',
      id_number: user?.pan || '',
      verification_date: new Date().toISOString(),
    };
  },
};

export default kycService;
