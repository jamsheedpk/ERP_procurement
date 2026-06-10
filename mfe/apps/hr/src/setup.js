// The ported HR pages read `window.API` directly; point it at the shared backend.
import { API_BASE } from "@meridian/api";
if (typeof window !== "undefined") window.API = API_BASE;
