import { useState, useCallback, useRef } from "react";

export function useNotification() {
  const [notif, setNotif] = useState(null);
  const timer = useRef(null);
  const showNotif = useCallback((msg, type = "success") => {
    setNotif({ msg, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotif(null), 4500);
  }, []);
  return { notif, showNotif, clearNotif: () => setNotif(null) };
}

