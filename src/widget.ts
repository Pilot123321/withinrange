// Default (web / Android / Expo Go): no-op. The real implementation lives in
// widget.ios.ts and is only bundled on iOS, so other platforms never pull in
// the native widget toolchain. Keeps the Expo Go + web preview working.
export type WidgetState = { open: boolean; nearbyCount: number };

export function publishWidgetState(_state: WidgetState): void {
  // intentionally empty
}
