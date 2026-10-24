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
  employe: "/employe/commandes",
  gerant: "/gerant",
  admin: "/admin",
};

// Pages réservées aux visiteurs : une fois connecté, on file vers son espace.
export const GUEST_ONLY_PATHS = ["/connexion", "/inscription"];

const STAFF: readonly AppRole[] = ["employe", "gerant", "admin"];
const MANAGERS: readonly AppRole[] = ["gerant", "admin"];

// Matrice des droits : qui peut faire quoi. La base applique les mêmes règles
// (RLS et fonctions SQL) ; cette copie sert à protéger les pages et à n'afficher
// que les liens utiles.
export const PERMISSIONS = {
  // Seul un étudiant passe commande ; le personnel voit le menu sans commander.
  commander: ["etudiant"],
  voirCommandes: STAFF,
  // Accepter une commande (la lancer en cuisine) ou l'annuler.
  validerCommande: MANAGERS,
  voirMenu: STAFF,
  // Créer, supprimer un plat ou changer son prix. L'employé ne change que la disponibilité.
  modifierMenu: MANAGERS,
  tableauDeBord: MANAGERS,
  reclamations: MANAGERS,
  statistiques: MANAGERS,
  parametres: MANAGERS,
  promotions: MANAGERS,
  // Questions du quiz et réglages des mini-jeux ; seuls les étudiants jouent.
  jeux: MANAGERS,
  personnel: ["admin"],
} as const satisfies Record<string, readonly AppRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: AppRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly AppRole[]).includes(role);
}

// Qui peut ouvrir chaque espace. L'espace étudiant (commander, panier, fidélité)
// est réservé aux étudiants ; chaque page vérifie ensuite sa permission.
const AREA_ACCESS: Record<string, readonly AppRole[]> = {
  "/espace": PERMISSIONS.commander,
  "/compte": ROLES,
  "/employe": STAFF,
  "/gerant": MANAGERS,
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
