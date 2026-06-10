import { API_BASE } from "@meridian/api";

if (typeof window !== "undefined") {
  window.API = API_BASE;

  // ProjectPage uses Google Maps Places for its location picker. Load the script
  // once (matches the monolith index.html); the page already guards on
  // window.google.maps, so it degrades gracefully if this fails to load.
  const MAPS_KEY = "AIzaSyBwq37HvnCUs22Lpm2etp3X8LIr3QVZtdM";
  if (!window.google && !document.getElementById("gmaps-sdk")) {
    const s = document.createElement("script");
    s.id = "gmaps-sdk";
    s.async = true; s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    document.head.appendChild(s);
  }
}
