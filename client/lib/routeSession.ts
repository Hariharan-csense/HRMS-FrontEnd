const LAST_PROTECTED_ROUTE_KEY = "app:lastProtectedRoute";
const ROUTE_RESTORE_WINDOW_MS = 2 * 60 * 60 * 1000;

type SavedRoute = {
  path: string;
  savedAt: number;
};

const isRestorablePath = (path: string) =>
  path.startsWith("/") &&
  ![
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/features",
    "/about",
    "/contact",
    "/pricing",
  ].includes(path.split("?")[0]);

export const rememberProtectedRoute = (path: string) => {
  if (!isRestorablePath(path)) return;

  const savedRoute: SavedRoute = { path, savedAt: Date.now() };
  localStorage.setItem(LAST_PROTECTED_ROUTE_KEY, JSON.stringify(savedRoute));
};

export const getRecentProtectedRoute = (): string | null => {
  try {
    const raw = localStorage.getItem(LAST_PROTECTED_ROUTE_KEY);
    if (!raw) return null;

    const savedRoute = JSON.parse(raw) as SavedRoute;
    if (
      !savedRoute?.savedAt ||
      Date.now() - savedRoute.savedAt > ROUTE_RESTORE_WINDOW_MS ||
      !isRestorablePath(savedRoute.path)
    ) {
      localStorage.removeItem(LAST_PROTECTED_ROUTE_KEY);
      return null;
    }

    return savedRoute.path;
  } catch {
    localStorage.removeItem(LAST_PROTECTED_ROUTE_KEY);
    return null;
  }
};
