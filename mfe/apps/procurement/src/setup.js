/**
 * Compatibility shims for the wholesale-ported ProcurementPage.
 *
 * The monolith page reads `window.API` and `window.jspdf` directly. Rather than
 * rewrite ~3,500 lines, we satisfy those globals here so the file runs verbatim
 * inside the bundled remote.
 */
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // augments jsPDF.prototype.autoTable
import { API_BASE } from "@meridian/api";

if (typeof window !== "undefined") {
  window.API = API_BASE;
  window.jspdf = window.jspdf || { jsPDF };
}
