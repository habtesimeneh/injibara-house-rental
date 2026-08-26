import axios from 'axios';

const API_BASE = '/api';

const getAuthHeaders = () => ({});

const handleError = (error, context = 'API call') => {
  if (error.response) {
    return {
      message: error.response.data?.error || `Server error: ${error.response.status}`,
      status: error.response.status
    };
  } else if (error.request) {
    return {
      message: 'Network error. Please check your connection.',
      status: 0
    };
  } else {
    return {
      message: error.message || `Failed to ${context}`,
      status: -1
    };
  }
};

export const adminApi = {
  // Stats & Analytics
  getStats: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/stats`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch statistics');
    }
  },

  getAnalytics: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/analytics`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch analytics');
    }
  },

  // Hero Slides
  getHeroSlides: async () => {
    try {
      const response = await axios.get(`${API_BASE}/hero-slides/admin`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch hero slides');
    }
  },

  createHeroSlide: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/hero-slides`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create hero slide');
    }
  },

  updateHeroSlide: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/hero-slides/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update hero slide');
    }
  },

  deleteHeroSlide: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/hero-slides/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete hero slide');
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/categories`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch categories');
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/categories`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create category');
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/categories/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update category');
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/categories/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete category');
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch users');
    }
  },

  createUser: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/users`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create user');
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/users/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update user');
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/users/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete user');
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/users/${id}/role`, { role }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update user role');
    }
  },

  // Houses
  getHouses: async () => {
    try {
      const response = await axios.get(`${API_BASE}/houses`);
      return response.data?.data || [];
    } catch (error) {
      throw handleError(error, 'fetch houses');
    }
  },

  createHouse: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/houses`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create house');
    }
  },

  updateHouse: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/houses/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update house');
    }
  },

  deleteHouse: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/houses/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete house');
    }
  },

  // Messages
  getConversations: async () => {
    try {
      const response = await axios.get(`${API_BASE}/messages/admin/all-conversations`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch conversations');
    }
  },

  getThread: async (userId1, userId2) => {
    try {
      const response = await axios.get(`${API_BASE}/messages/admin/thread/${userId1}/${userId2}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch thread');
    }
  },

  // AI Logs
  getAiLogs: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/ai-logs`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch AI logs');
    }
  },

  markAiLogRead: async (id) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/ai-logs/${id}/read`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'mark AI log as read');
    }
  },

  markAllAiLogsRead: async () => {
    try {
      const response = await axios.put(`${API_BASE}/admin/ai-logs/read-all`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'mark all AI logs as read');
    }
  },

  deleteAiLog: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/ai-logs/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete AI log');
    }
  },

  // Payments
  getPayments: async () => {
    try {
      const response = await axios.get(`${API_BASE}/payments/admin/all`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch payments');
    }
  },

  updatePaymentStatus: async (id, status, notes = '') => {
    try {
      const response = await axios.put(`${API_BASE}/payments/admin/${id}/status`, {
        status,
        admin_notes: notes
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update payment status');
    }
  },

  // Announcements
  getAnnouncements: async () => {
    try {
      const response = await axios.get(`${API_BASE}/announcements`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch announcements');
    }
  },

  createAnnouncement: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/announcements`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create announcement');
    }
  },

  updateAnnouncement: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/announcements/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update announcement');
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/announcements/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete announcement');
    }
  },

  // Testimonials
  getTestimonials: async () => {
    try {
      const response = await axios.get(`${API_BASE}/testimonials/admin`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      // Fallback to public endpoint
      try {
        const fallback = await axios.get(`${API_BASE}/testimonials`);
        return fallback.data;
      } catch (fallbackError) {
        throw handleError(error, 'fetch testimonials');
      }
    }
  },

  approveTestimonial: async (id, isApproved) => {
    try {
      const response = await axios.put(`${API_BASE}/testimonials/${id}/approve`, { is_approved: isApproved ? 1 : 0 }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'approve testimonial');
    }
  },

  deleteTestimonial: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/testimonials/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete testimonial');
    }
  },

  // Settings
  getSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE}/settings`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch settings');
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/settings`, settings, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update settings');
    }
  },

  getAdminSettingsGrouped: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/settings`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch grouped settings');
    }
  },

  getAdminSettingByKey: async (key) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/settings/${encodeURIComponent(key)}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch setting');
    }
  },

  // FAQs
  updateFaq: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/about/faqs/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update faq');
    }
  },

  // Locations
  getLocations: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/locations`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch locations');
    }
  },

  createLocation: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/locations`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create location');
    }
  },

  updateLocation: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/locations/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update location');
    }
  },

  deleteLocation: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/locations/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete location');
    }
  },

  // Fees
  getFees: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/fees`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch fees');
    }
  },

  updateFees: async (fees) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/fees`, fees, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update fees');
    }
  },

  // Payment Config & Accounts
  getPaymentConfig: async () => {
    try {
      const response = await axios.get(`${API_BASE}/payments/config`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch payment config');
    }
  },

  getPaymentAccounts: async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/payment-accounts`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch payment accounts');
    }
  },

  createPaymentAccount: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/payment-accounts`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create payment account');
    }
  },

  updatePaymentAccount: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/payment-accounts/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update payment account');
    }
  },

  deletePaymentAccount: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/payment-accounts/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete payment account');
    }
  },

  // About & Contact
  getAbout: async () => {
    try {
      const response = await axios.get(`${API_BASE}/about`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch about page');
    }
  },

  saveAbout: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/about`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'save about page');
    }
  },

  getContact: async () => {
    try {
      const response = await axios.get(`${API_BASE}/contact`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch contact page');
    }
  },

  saveContact: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/contact`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'save contact page');
    }
  },

  // Auth Page
  getAuthSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth-page/settings`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch auth settings');
    }
  },

  saveAuthSettings: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/auth-page/settings`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'save auth settings');
    }
  },

  getAuthSlides: async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth-page/slides/admin`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch auth slides');
    }
  },

  createAuthSlide: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/auth-page/slides`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create auth slide');
    }
  },

  updateAuthSlide: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/auth-page/slides/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update auth slide');
    }
  },

  deleteAuthSlide: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/auth-page/slides/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete auth slide');
    }
  },

  // Image Upload
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post(`${API_BASE}/admin/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.image_url;
    } catch (error) {
      throw handleError(error, 'upload image');
    }
  },

  // House Media
  getHouseImages: async (houseId) => {
    try {
      const response = await axios.get(`${API_BASE}/houses/${houseId}/images`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch house images');
    }
  },

  addHouseImages: async (houseId, images) => {
    try {
      const formData = new FormData();
      images.forEach(img => formData.append('images', img));
      const response = await axios.post(`${API_BASE}/houses/${houseId}/images`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'add house images');
    }
  },

  updateHouseImage: async (houseId, imageId, data) => {
    try {
      const response = await axios.put(`${API_BASE}/houses/images/${imageId}?houseId=${houseId}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update house image');
    }
  },

  deleteHouseImage: async (houseId, imageId) => {
    try {
      const response = await axios.delete(`${API_BASE}/houses/images/${imageId}?houseId=${houseId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete house image');
    }
  },

  getHouseVideos: async (houseId) => {
    try {
      const response = await axios.get(`${API_BASE}/houses/${houseId}/videos`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch house videos');
    }
  },

  addHouseVideo: async (houseId, video) => {
    try {
      const formData = new FormData();
      formData.append('video', video);
      const response = await axios.post(`${API_BASE}/houses/${houseId}/videos`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'add house video');
    }
  },

  deleteHouseVideo: async (houseId, videoId) => {
    try {
      const response = await axios.delete(`${API_BASE}/houses/videos/${videoId}?houseId=${houseId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete house video');
    }
  },

  // Profile
  updateProfile: async (formData) => {
    try {
      const response = await axios.put(`${API_BASE}/auth/profile`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update profile');
    }
  },

  // Contact Offices
  getOffices: async () => {
    try {
      const response = await axios.get(`${API_BASE}/contact/offices`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch offices');
    }
  },

  createOffice: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/contact/offices`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create office');
    }
  },

  updateOffice: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/contact/offices/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update office');
    }
  },

  deleteOffice: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/contact/offices/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete office');
    }
  },

  // Contact Phones
  getPhones: async () => {
    try {
      const response = await axios.get(`${API_BASE}/contact/phones`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch phones');
    }
  },

  createPhone: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/contact/phones`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create phone');
    }
  },

  updatePhone: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/contact/phones/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update phone');
    }
  },

  deletePhone: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/contact/phones/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete phone');
    }
  },

  // Payments
  deletePayment: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/payments/admin/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete payment');
    }
  },

  addManualPayment: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE}/payments/admin/add`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'add manual payment');
    }
  },

  // SEO
  getSeoMeta: async () => {
    try {
      const response = await axios.get(`${API_BASE}/settings/seo`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch SEO meta');
    }
  },

  updateSeo: async (data) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/seo`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update SEO');
    }
  },

  deleteSeo: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/admin/seo/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete SEO');
    }
  },

  // FAQs
  getAboutFaqs: async () => {
    try {
      const response = await axios.get(`${API_BASE}/about/faqs`);
      return response.data;
    } catch (error) {
      throw handleError(error, 'fetch FAQs');
    }
  },

  createFaq: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/about/faqs`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create FAQ');
    }
  },

  deleteFaq: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/about/faqs/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'delete FAQ');
    }
  },

  // Testimonials
  createTestimonial: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/testimonials`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'create testimonial');
    }
  },

  updateTestimonial: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/testimonials/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw handleError(error, 'update testimonial');
    }
  }
};

export default adminApi;
