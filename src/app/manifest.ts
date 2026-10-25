import type { MetadataRoute } from "next";

// Application installable : s'ouvre directement sur l'espace étudiant.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mon Miam Miam · ZeDuc@Space",
    short_name: "Miam Miam",
    description: "Commande au ZeDuc@Space, suis ta commande et cumule des points.",
    id: "/",
    start_url: "/espace",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    background_color: "#17110f",
    theme_color: "#17110f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
