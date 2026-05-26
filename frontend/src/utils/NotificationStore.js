// src/utils/NotificationStore.js

const STORAGE_KEY = "admin_notifications";

// Listeners → components subscribed for updates
let listeners = [];

// ---------------- Load from localStorage ----------------
const loadNotifications = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// ---------------- Save to localStorage ----------------
const saveNotifications = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save notifications");
  }
};

// Local in-memory notification list
let notifications = loadNotifications();

export const NotificationStore = {
  // Subscribe UI (AdminDashboard, EmployeeList, etc.)
  subscribe(callback) {
    listeners.push(callback);

    // Send initial data immediately
    callback(notifications);

    // Return unsubscribe function
    return () => {
      listeners = listeners.filter((cb) => cb !== callback);
    };
  },

  // Add a new notification
  push(message) {
    const item = {
      message,
      time: new Date().toLocaleString(),
    };

    notifications.unshift(item);
    saveNotifications(notifications);

    // Notify all subscribed components
    listeners.forEach((cb) => cb(notifications));
  },

  // Return current list
  list() {
    return notifications;
  },

  // Clear all notifications
  clear() {
    notifications = [];
    localStorage.removeItem(STORAGE_KEY);

    // Notify subscribers UI to update
    listeners.forEach((cb) => cb(notifications));
  },
};
