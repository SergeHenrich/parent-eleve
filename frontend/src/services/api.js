import axios from "axios";
import toast from "react-hot-toast";

// Configuration de base d'Axios
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Instance Axios principale
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes pour les connexions 3G
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("edusmart_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem("edusmart_token");

      // Rediriger vers la page de connexion si pas déjà sur cette page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
        toast.error("Session expirée, veuillez vous reconnecter");
      }
    }

    // Gestion des erreurs réseau
    if (!error.response) {
      toast.error("Erreur de connexion. Vérifiez votre connexion internet.");
    }

    return Promise.reject(error);
  },
);

// Services d'authentification
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  verifyToken: () => api.get("/auth/verify"),
  changePassword: (data) => api.post("/auth/change-password", data),
};

// Services pour les élèves
export const studentsAPI = {
  getAll: () => api.get("/students"),
  getStudents: () => api.get("/students"),
  getById: (studentId) => api.get(`/students/${studentId}`),
  getDashboard: (studentId) => api.get(`/students/${studentId}/dashboard`),
};

// Services pour les notes
export const gradesAPI = {
  getByStudent: (studentId, params = {}) =>
    api.get(`/grades/eleve/${studentId}`, { params }),
  getGrades: (studentId, params = {}) =>
    api.get(`/grades/eleve/${studentId}`, { params }),
  getAverages: (studentId, params = {}) =>
    api.get(`/grades/eleve/${studentId}/moyennes`, { params }),
  getBulletin: (studentId, trimestre) =>
    api.get(`/grades/eleve/${studentId}/bulletin/${trimestre}`),
  getSubjects: () => api.get("/grades/matieres"),
};

// Services pour les absences
export const absencesAPI = {
  getByStudent: (studentId, params = {}) =>
    api.get(`/absences/eleve/${studentId}`, { params }),
  getAbsences: (studentId, params = {}) =>
    api.get(`/absences/eleve/${studentId}`, { params }),
  getById: (absenceId) => api.get(`/absences/${absenceId}`),
  getStatistics: (studentId, params = {}) =>
    api.get(`/absences/eleve/${studentId}/statistiques`, { params }),
  getMonthlyReport: (studentId, year, month) =>
    api.get(`/absences/eleve/${studentId}/recapitulatif/${year}/${month}`),
  justify: (absenceId, data) =>
    api.put(`/absences/${absenceId}/justifier`, data),
};

// Services pour les messages
export const messagesAPI = {
  getAll: (params = {}) => api.get("/messages", { params }),
  getMessages: (params = {}) => api.get("/messages", { params }),
  getById: (messageId) => api.get(`/messages/${messageId}`),
  send: (data) => api.post("/messages", data),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/marquer-lu`),
  delete: (messageId) => api.delete(`/messages/${messageId}`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getContacts: () => api.get("/messages/contacts/liste"),
  getConversations: () => api.get("/messages/conversations"),
};

// Services pour les notifications
export const notificationsAPI = {
  getAll: (params = {}) => api.get("/notifications", { params }),
  getNotifications: (params = {}) => api.get("/notifications", { params }),
  getById: (notificationId) => api.get(`/notifications/${notificationId}`),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/marquer-lue`),
  markAllAsRead: () => api.put("/notifications/marquer-toutes-lues"),
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
  getSummary: () => api.get("/notifications/resume/statistiques"),
  createTest: (data) => api.post("/notifications/test", data),
};

// Services pour les utilisateurs
export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.patch("/users/profile", data),
};

// Service de santé de l'API
export const healthAPI = {
  check: () => api.get("/health"),
};

// Utilitaires pour la gestion des erreurs
export const handleAPIError = (
  error,
  defaultMessage = "Une erreur est survenue",
) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

// Utilitaire pour formater les paramètres de requête
export const formatQueryParams = (params) => {
  const filtered = {};

  Object.keys(params).forEach((key) => {
    if (
      params[key] !== undefined &&
      params[key] !== null &&
      params[key] !== ""
    ) {
      filtered[key] = params[key];
    }
  });

  return filtered;
};

// Utilitaire pour les requêtes avec retry (pour les connexions instables)
export const apiWithRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Ne pas retry sur les erreurs 4xx (erreurs client)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Attendre avant le prochain essai
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

// Export de l'instance principale pour les cas spéciaux
export default api;
