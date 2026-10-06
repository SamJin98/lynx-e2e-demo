// Adapted from lynx-family/lynx-examples (Apache-2.0); see NOTICE.md for modifications.
import { useMainThreadRef } from '@lynx-js/react';
import type { MainThread } from '@lynx-js/types';

export function useUpdateSwiperStyle() {
  const containerRef = useMainThreadRef<MainThread.Element>(null);

  function updateSwiperStyle(offset: number) {
    'main thread';
    containerRef.current?.setStyleProperties({
      transform: `translateX(${offset}px)`,
    });
  }

  return {
    containerRef,
    updateSwiperStyle,
  };
}
