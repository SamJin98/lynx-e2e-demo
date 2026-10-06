interface GestureAudit {
  drags: number[];
  wheels: number;
  paginationClicks: number;
}
interface Window {
  __gestureAudit: GestureAudit;
  __orderGesture: GestureAudit & { durations: number[] };
}
