import React, { useEffect } from "react";
import "../styles/popup.css";

export default function PopupNotification({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!message) return null;

  return (
    <div className="popup-notification">
      <p>{message}</p>
    </div>
  );
}
