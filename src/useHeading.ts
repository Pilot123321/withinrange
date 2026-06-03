import { Accelerometer, Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

// Tilt-compensated compass ("eCompass").
//
// A magnetometer alone only reads a correct heading when the phone is held flat.
// The instant you tilt it — e.g. raising it to point at someone, which is
// exactly when the finder is used — the device axes mix and a naive
// atan2(my, mx) drifts badly. We compensate by reading the accelerometer's
// gravity vector to recover the phone's pitch & roll, then de-rotating the
// magnetic vector back into the horizontal plane before taking the heading.
//
// Algorithm: the standard tilt-compensated eCompass from the NXP/Freescale
// application notes:
//   • AN4248 — "Implementing a Tilt-Compensated eCompass" (T. Ozyagcilar, 2012)
//   • AN3461 — "Tilt Sensing Using a Three-Axis Accelerometer"
// A gyro-fused AHRS filter (Madgwick 2010) would cut jitter further; this
// accel+mag version is the right baseline and needs no gyro.

// If the pointing axis ends up 90°/180° off on a real device (axis sign
// conventions vary by platform), nudge this offset — it's the one knob.
const AXIS_OFFSET_DEG = 0;

type Vec3 = { x: number; y: number; z: number };

export function useHeading(active: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const gravity = useRef<Vec3>({ x: 0, y: 0, z: 1 });
  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const subs: { remove: () => void }[] = [];

    Promise.all([Accelerometer.isAvailableAsync(), Magnetometer.isAvailableAsync()]).then(
      ([hasAccel, hasMag]) => {
        if (cancelled || !hasMag) return; // no magnetometer (e.g. web) → null

        Accelerometer.setUpdateInterval(60);
        Magnetometer.setUpdateInterval(60);

        // Keep the latest gravity estimate. When roughly still (the usual case
        // while pointing), raw acceleration ≈ gravity, which is all we need.
        if (hasAccel) {
          subs.push(Accelerometer.addListener((data) => {
            gravity.current = data;
          }));
        }

        subs.push(Magnetometer.addListener((m) => {
          const heading = tiltCompensatedHeading(gravity.current, m, hasAccel);
          if (heading == null) return;
          smoothed.current = lowPassDegrees(smoothed.current, heading, 0.25);
          setHeading(smoothed.current);
        }));
      }
    );

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
    };
  }, [active]);

  return heading;
}

// Returns the horizontal heading (0–360°, 0 = North) of the phone's +Y axis
// (its top edge) after removing tilt. Falls back to the flat-phone formula if no
// accelerometer is present.
function tiltCompensatedHeading(g: Vec3, m: Vec3, hasAccel: boolean): number | null {
  if (!hasAccel) {
    const flat = Math.atan2(m.y, m.x) * (180 / Math.PI);
    return normalize(flat + AXIS_OFFSET_DEG);
  }

  // Normalize gravity; skip during free-fall / violent motion (|g| ≈ 0).
  const gn = norm(g);
  if (gn < 1e-3) return null;
  const ax = g.x / gn;
  const ay = g.y / gn;
  const az = g.z / gn;

  // Pitch (θ) and roll (φ) from the gravity vector (AN3461).
  const roll = Math.atan2(ay, az);
  const pitch = Math.atan2(-ax, ay * Math.sin(roll) + az * Math.cos(roll));

  // De-rotate the magnetic vector into the horizontal plane (AN4248).
  const sinR = Math.sin(roll);
  const cosR = Math.cos(roll);
  const sinP = Math.sin(pitch);
  const cosP = Math.cos(pitch);

  const Yh = m.z * sinR - m.y * cosR;
  const Xh = m.x * cosP + m.y * sinP * sinR + m.z * sinP * cosR;

  const deg = Math.atan2(Yh, Xh) * (180 / Math.PI);
  return normalize(deg + AXIS_OFFSET_DEG);
}

function norm(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// Low-pass filter that interpolates the *short way* around the 360° wrap.
function lowPassDegrees(prev: number | null, next: number, alpha: number): number {
  if (prev == null) return next;
  let diff = next - prev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return normalize(prev + diff * alpha);
}
