import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";
import { RoutePoint } from "../types";

// Fórmula de Haversine: distancia en metros entre dos coordenadas
function haversineDistance(a: RoutePoint, b: RoutePoint) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useLocationTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [distance, setDistance] = useState(0); // metros
  const [duration, setDuration] = useState(0); // segundos
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pointsRef = useRef<RoutePoint[]>([]);

  const start = useCallback(async () => {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Se necesita permiso de ubicación para grabar la ruta.");
      return;
    }

    pointsRef.current = [];
    setPoints([]);
    setDistance(0);
    setDuration(0);
    startTimeRef.current = Date.now();
    setIsTracking(true);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000, // cada 3s
        distanceInterval: 5, // o cada 5m
      },
      (loc) => {
        const newPoint: RoutePoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
          altitude: loc.coords.altitude,
          speed: loc.coords.speed,
        };
        const prev = pointsRef.current;
        if (prev.length > 0) {
          const delta = haversineDistance(prev[prev.length - 1], newPoint);
          setDistance((d) => d + delta);
        }
        pointsRef.current = [...prev, newPoint];
        setPoints(pointsRef.current);
      }
    );

    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsTracking(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    pointsRef.current = [];
    setPoints([]);
    setDistance(0);
    setDuration(0);
    setError(null);
  }, [stop]);

  const averageSpeed = duration > 0 ? distance / duration : 0; // m/s

  return { isTracking, points, distance, duration, averageSpeed, error, start, stop, reset };
}
