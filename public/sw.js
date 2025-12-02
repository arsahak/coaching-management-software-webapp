// Empty service worker to prevent 404 errors
// This application does not use a service worker yet
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});
