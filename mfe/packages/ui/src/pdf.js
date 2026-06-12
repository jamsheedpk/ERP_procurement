/**
 * Capture a DOM element and download it as a paginated A4 PDF.
 * jspdf + html2canvas are imported on demand so they only load (and only
 * ship in a chunk) for pages that actually offer a PDF download.
 */
export async function downloadElementAsPdf(element, filename) {
  if (!element) return;
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const usableH = pageH - margin * 2;

  // JPEG keeps multi-MB captures down to a few hundred KB; the white page
  // background means there's no transparency to preserve.
  const img = canvas.toDataURL("image/jpeg", 0.92);

  // The capture is one tall image; each page shows a `usableH` window of it,
  // with white rects masking the bleed into the margins.
  let offset = 0;
  let page = 0;
  while (offset < imgH) {
    if (page) pdf.addPage();
    pdf.addImage(img, "JPEG", margin, margin - offset, imgW, imgH);
    pdf.setFillColor("#ffffff");
    pdf.rect(0, 0, pageW, margin, "F");
    pdf.rect(0, pageH - margin, pageW, margin, "F");
    offset += usableH;
    page += 1;
  }
  pdf.save(filename);
}
