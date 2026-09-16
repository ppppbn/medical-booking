import { useState, useEffect } from 'react';
import { axiosInstance as api } from '../services/auth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export const useNotifications = (intervalMs = 30000) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchNotifications();

    // Poll every X milliseconds
    const intervalId = setInterval(fetchNotifications, intervalMs);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [intervalMs]);

  return { notifications, unreadCount, markAsRead, fetchNotifications };
};
