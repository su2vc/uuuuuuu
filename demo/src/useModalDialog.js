import { useLayoutEffect, useRef } from 'react';

// Modal components are mounted only while open. Capture the element itself so
// cleanup still works after React clears its ref, including StrictMode remounts.
export function useModalDialog(initialFocus) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const previousFocus = document.activeElement;
    element.showModal();
    initialFocus?.current?.focus({
      preventScroll: true
    });
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus({
        preventScroll: true
      });
    };
  }, [initialFocus]);
  return ref;
}
