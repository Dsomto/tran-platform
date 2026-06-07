const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: "A4",
  layout: "landscape",
  margins: { top: 24, bottom: 24, left: 24, right: 24 },
  autoFirstPage: true,
});

const pageW = doc.page.width;
const chunks = [];
doc.on("data", (c) => chunks.push(c));
doc.on("end", () => {
  const buf = Buffer.concat(chunks);
  fs.writeFileSync('/tmp/test_cert.pdf', buf);
  console.log("PDF written to /tmp/test_cert.pdf");
  
  // Also output measurements
  console.log("\n=== MEASUREMENTS ===");
  console.log("Page width:", pageW);
  testNames.forEach((name) => {
    const height = doc.heightOfString(name, {
      width: pageW,
      fontSize: 42,
      font: "Times-BoldItalic",
    });
    console.log(`"${name}" (${name.length} chars): height=${height.toFixed(1)}pt`);
  });
});

// Test names of increasing length
const testNames = [
  "John Smith",           // 10 chars
  "Alexandra Johnson",    // 17 chars
  "Mpumelelo Thembinkoski", // 24 chars
  "Mpumelelo Thembinkoski Nkosi", // 30 chars
  "Mpumelelo Thembinkoski Nkosi-Mbuyazi", // 38 chars
];

let yPos = 100;

testNames.forEach((name) => {
  // Draw a box showing the width constraint
  doc.rect(50, yPos, pageW - 100, 50).stroke();
  
  // Render the name like in the certificate
  doc
    .fontSize(42)
    .font("Times-BoldItalic")
    .fillColor("#000000")
    .text(name, 50, yPos + 5, {
      align: "center",
      width: pageW - 100,
    });
  
  doc.fontSize(8).fillColor("#999999").text(`${name.length} chars`, 50, yPos + 60);
  
  yPos += 100;
});

doc.end();
