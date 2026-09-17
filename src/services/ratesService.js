/**
 * Metal Rates Service (Standalone Frontend)
 * Provides current Gold & Silver rates locally.
 */

export const ratesService = {
  /**
   * Fetch active Gold & Silver rates
   */
  getLiveRates: async () => {
    return {
      gold: {
        metal: 'gold',
        active_rate: 14190.00,
        updated_at: new Date().toISOString(),
      },
      silver: {
        metal: 'silver',
        active_rate: 267.00,
        updated_at: new Date().toISOString(),
      },
    };
  },
};

export default ratesService;
