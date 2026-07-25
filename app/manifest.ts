import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MechaFix AI",
    short_name: "MechaFix",
    description:
      "AI-assisted troubleshooting for robotics and educational electronics.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6FA",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
