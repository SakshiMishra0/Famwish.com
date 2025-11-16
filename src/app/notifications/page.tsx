// src/app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { BellRing } from "lucide-react";

// Define a type for our notification
interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await res.json();
        setNotifications(data);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-extrabold mb-6 text-[#22163F]">
        Your Notifications
      </h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && notifications.length === 0 && (
        <p>You have no notifications.</p>
      )}

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div 
            key={notif._id} 
            className={`p-4 rounded-lg border flex items-start gap-4 ${
              notif.read ? "bg-white" : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className={`mt-1 ${notif.read ? "text-gray-400" : "text-blue-500"}`}>
              <BellRing size={20} />
            </div>
            <div>
              <p className={notif.read ? "text-gray-600" : "font-semibold text-gray-900"}>
                {notif.message}
              </p>
              <span className="text-xs text-gray-500">
                {new Date(notif.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}