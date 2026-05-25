"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, options = {}) => {
      const {
        type = "success",
        id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        duration = 4500,
        title,
      } = options;

      if (!message) {
        return id;
      }

      setToasts((current) => {
        const rest = current.filter((toast) => toast.id !== id);
        return [...rest, { id, message, type, title }];
      });

      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
      }
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return { toasts, push, dismiss };
}
