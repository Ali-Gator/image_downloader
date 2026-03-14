import { TargetRect, TooltipPlacement } from './types';

export const SPOTLIGHT_PADDING = 8;
export const TOOLTIP_GAP = 12;
export const OVERLAY_COLOR = 'rgba(26, 26, 24, 0.4)';

export function getTooltipPosition(
  targetRect: TargetRect,
  placement: TooltipPlacement,
  tooltipWidth: number,
  tooltipHeight: number,
) {
  const viewport = { w: window.innerWidth, h: window.innerHeight };
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = targetRect.top + targetRect.height + SPOTLIGHT_PADDING + TOOLTIP_GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = targetRect.top - SPOTLIGHT_PADDING - TOOLTIP_GAP - tooltipHeight;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left + targetRect.width + SPOTLIGHT_PADDING + TOOLTIP_GAP;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - SPOTLIGHT_PADDING - TOOLTIP_GAP - tooltipWidth;
      break;
  }

  // Clamp within viewport
  left = Math.max(8, Math.min(left, viewport.w - tooltipWidth - 8));
  top = Math.max(8, Math.min(top, viewport.h - tooltipHeight - 8));

  return { top, left };
}
