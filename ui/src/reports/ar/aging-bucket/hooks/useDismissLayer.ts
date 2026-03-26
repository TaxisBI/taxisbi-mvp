import { useEffect, type RefObject } from 'react';

type UseDismissLayerOptions = {
  isOpen: boolean;
  refs: Array<RefObject<HTMLElement | null>>;
  onClose: () => void;
  canClose?: () => boolean;
};

export function useDismissLayer({ isOpen, refs, onClose, canClose }: UseDismissLayerOptions) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const canDismiss = () => (canClose ? canClose() : true);

    const onPointerDown = (event: MouseEvent) => {
      if (!canDismiss()) {
        return;
      }

      const target = event.target as Node;
      const clickedInside = refs.some((ref) => ref.current?.contains(target));
      if (clickedInside) {
        return;
      }

      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!canDismiss()) {
        return;
      }

      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canClose, isOpen, onClose, refs]);
}
