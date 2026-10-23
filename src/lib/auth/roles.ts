export const ROLES = ["etudiant", "employe", "gerant", "admin"] as const;
export type AppRole = (typeof ROLES)[number];

export const LOGIN_PATH = "/connexion";

export const ROLE_LABELS: Record<AppRole, string> = {
  etudiant: "Étudiant",
  employe: "Employé",
  gerant: "Gérant",
  admin: "Administrateur",
};

// Espace d'arrivée de chaque rôle après connexion.
export const ROLE_HOME: Record<AppRole, string> = {
  etudiant: "/espace",
  employe: "/employe",
  gerant: "/gerant",
  admin: "/admin",
};

// Qui peut ouvrir chaque espace. Le personnel peut aussi commander comme un client.
const AREA_ACCESS: Record<string, readonly AppRole[]> = {
  "/espace": ROLES,
  "/employe": ["employe", "gerant", "admin"],
  "/gerant": ["gerant", "admin"],
  "/admin": ["admin"],
};

function areaOf(pathname: string): string | null {
  for (const area of Object.keys(AREA_ACCESS)) {
    if (pathname === area || pathname.startsWith(`${area}/`)) return area;
  }
  return null;
}

export function isProtectedPath(pathname: string): boolean {
  return areaOf(pathname) !== null;
}

export function canAccess(pathname: string, role: AppRole): boolean {
  const area = areaOf(pathname);
  return area === null || AREA_ACCESS[area].includes(role);
}

export function allowedRolesFor(area: keyof typeof AREA_ACCESS): readonly AppRole[] {
  return AREA_ACCESS[area];
}

// Destination après connexion : la page demandée si elle est sûre et autorisée,
// sinon l'espace du rôle.
export function redirectAfterLogin(role: AppRole, requested?: string | null): string {
  if (
    requested &&
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.startsWith("/\\") &&
    canAccess(requested.split("?")[0], role)
  ) {
    return requested;
  }
  return ROLE_HOME[role];
}
