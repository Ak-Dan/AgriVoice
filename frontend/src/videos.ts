type MaizeVideoInfo = {
  id: string;
  title: string;
  description: string;
  type: string;
  src: string;
  poster?: string;
};

// Example video catalog with a default and a few specific videos by diagnosis
export const MAIZE_VIDEO_CATALOG: Record<string, MaizeVideoInfo> = {
  "blight": {
    id: "blight",
    title: "Learn About Maize Leaf Blight",
    description: "See expert insights on identifying, preventing, and treating maize leaf blight in your crop.",
    type: "youtube",
    src: "https://www.youtube.com/embed/q9i0U_1F8AM", // Swap this for an actual video relevant to blight
    poster: "", // optional
  },
  "rust": {
    id: "rust",
    title: "Maize Rust: Symptoms and Solutions",
    description: "Learn how to recognize rust disease and best practices to reduce impact.",
    type: "youtube",
    src: "https://www.youtube.com/embed/LN8mK1L_t5A", // Example; use a real video
  },
  "cercospora": {
    id: "cercospora",
    title: "Managing Gray Leaf Spot (Cercospora)",
    description: "Understanding how to manage and prevent gray leaf spot in maize fields.",
    type: "youtube",
    src: "https://www.youtube.com/embed/3bt6ZjDI-3I", // Example; use a real video
  },
  "healthy": {
    id: "healthy",
    title: "How to Keep Your Maize Healthy",
    description: "Tips for maintaining healthy maize crops throughout the season.",
    type: "youtube",
    src: "https://www.youtube.com/embed/dZ_c_9u0dTY", // Example general crop care video
  },
  "default": {
    id: "default",
    title: "About Maize Diseases",
    description: "Watch how to recognize key maize diseases and protect your crops.",
    type: "youtube",
    src: "https://www.youtube.com/embed/vw_Pe6LwHus",  // Replace with your own video if you wish
  },
};
