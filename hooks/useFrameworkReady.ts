import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Only call frameworkReady in web environment
    if (typeof window !== 'undefined' && window.frameworkReady) {
      window.frameworkReady();
    }
  });
}
