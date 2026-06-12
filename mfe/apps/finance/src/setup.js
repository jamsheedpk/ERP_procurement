import { API_BASE, installAuthFetch } from "@meridian/api";
if (typeof window !== "undefined") { window.API = API_BASE; installAuthFetch(); }
