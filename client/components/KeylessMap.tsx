import { ReactNode, useMemo } from "react";

export type MapPoint = {
  lat: number;
  lng: number;
};

export type KeylessMapMarker = {
  id: string;
  position: MapPoint;
  label?: string;
  title?: string;
  color?: string;
  textColor?: string;
  size?: number;
  pulse?: boolean;
  className?: string;
  popup?: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export type KeylessMapPath = {
  id: string;
  points: MapPoint[];
  color?: string;
  width?: number;
  opacity?: number;
};

export type KeylessMapCircle = {
  id: string;
  center: MapPoint;
  radiusMeters: number;
  color?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
};

type KeylessMapProps = {
  center?: MapPoint | null;
  markers?: KeylessMapMarker[];
  paths?: KeylessMapPath[];
  circles?: KeylessMapCircle[];
  height?: number | string;
  zoomPadding?: number;
  className?: string;
};

const isFinitePoint = (point?: MapPoint | null): point is MapPoint =>
  Boolean(
    point &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180,
  );

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const project = (point: MapPoint, bounds: Bounds) => {
  const x =
    ((point.lng - bounds.left) / Math.max(bounds.right - bounds.left, 0.000001)) *
    100;
  const y =
    ((bounds.top - point.lat) / Math.max(bounds.top - bounds.bottom, 0.000001)) *
    100;
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
};

type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const buildBounds = (
  center: MapPoint | null | undefined,
  markers: KeylessMapMarker[],
  paths: KeylessMapPath[],
  circles: KeylessMapCircle[],
  zoomPadding: number,
): Bounds => {
  const points = [
    ...(isFinitePoint(center) ? [center] : []),
    ...markers.map((marker) => marker.position).filter(isFinitePoint),
    ...paths.flatMap((path) => path.points).filter(isFinitePoint),
    ...circles.map((circle) => circle.center).filter(isFinitePoint),
  ];

  const fallback = isFinitePoint(center) ? center : { lat: 13.0827, lng: 80.2707 };
  const validPoints = points.length ? points : [fallback];
  const lats = validPoints.map((point) => point.lat);
  const lngs = validPoints.map((point) => point.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const padFactor = zoomPadding / 100;

  return {
    left: clamp(minLng - lngSpan * padFactor, -180, 180),
    right: clamp(maxLng + lngSpan * padFactor, -180, 180),
    top: clamp(maxLat + latSpan * padFactor, -90, 90),
    bottom: clamp(minLat - latSpan * padFactor, -90, 90),
  };
};

const metersToLatitudeDegrees = (meters: number) => meters / 111_320;

export default function KeylessMap({
  center,
  markers = [],
  paths = [],
  circles = [],
  height = 400,
  zoomPadding = 55,
  className = "",
}: KeylessMapProps) {
  const bounds = useMemo(
    () => buildBounds(center, markers, paths, circles, zoomPadding),
    [center, markers, paths, circles, zoomPadding],
  );

  const mapUrl = useMemo(() => {
    const { left, right, top, bottom } = bounds;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik`;
  }, [bounds]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}
      style={{ height }}
    >
      <iframe
        title="Map"
        src={mapUrl}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
      />

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {circles.filter((circle) => isFinitePoint(circle.center)).map((circle) => {
          const centerPoint = project(circle.center, bounds);
          const edgePoint = project(
            {
              lat: circle.center.lat + metersToLatitudeDegrees(circle.radiusMeters),
              lng: circle.center.lng,
            },
            bounds,
          );
          const radius = Math.max(Math.abs(centerPoint.y - edgePoint.y), 1.5);
          const color = circle.color || "#10b981";

          return (
            <circle
              key={circle.id}
              cx={`${centerPoint.x}%`}
              cy={`${centerPoint.y}%`}
              r={`${radius}%`}
              fill={color}
              fillOpacity={circle.fillOpacity ?? 0.15}
              stroke={color}
              strokeOpacity={circle.strokeOpacity ?? 0.6}
              strokeWidth="2"
            />
          );
        })}

        {paths
          .filter((path) => path.points.filter(isFinitePoint).length >= 2)
          .map((path) => {
            const points = path.points
              .filter(isFinitePoint)
              .map((point) => {
                const projected = project(point, bounds);
                return `${projected.x},${projected.y}`;
              })
              .join(" ");

            return (
              <polyline
                key={path.id}
                points={points}
                vectorEffect="non-scaling-stroke"
                fill="none"
                stroke={path.color || "#2563eb"}
                strokeOpacity={path.opacity ?? 0.8}
                strokeWidth={path.width || 3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
      </svg>

      {markers.filter((marker) => isFinitePoint(marker.position)).map((marker) => {
        const point = project(marker.position, bounds);
        const size = marker.size || 34;
        const color = marker.color || "#2563eb";

        return (
          <button
            key={marker.id}
            type="button"
            title={marker.title}
            onClick={marker.onClick}
            onMouseEnter={marker.onMouseEnter}
            onMouseLeave={marker.onMouseLeave}
            className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-bold shadow-lg transition-transform hover:scale-110 ${marker.className || ""}`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: size,
              height: size,
              backgroundColor: color,
              color: marker.textColor || "#ffffff",
            }}
          >
            {marker.pulse && (
              <span
                className="absolute inset-[-7px] -z-10 rounded-full opacity-30 animate-ping"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="max-w-full truncate px-1 text-[11px] leading-none">
              {marker.label || ""}
            </span>
            {marker.popup && (
              <div className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs font-normal text-slate-700 shadow-xl">
                {marker.popup}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
