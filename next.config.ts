import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Open Library (public book covers by ISBN)
      { protocol: "https", hostname: "covers.openlibrary.org" },
      // Amazon product images
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images.amazon.com" },
      // Google Books
      { protocol: "https", hostname: "books.google.com" },
    ],
  },
};

export default nextConfig;
