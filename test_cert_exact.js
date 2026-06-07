const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: "A4",
  layout: "landscape",
  margins: { top: 24, bottom: 24, left: 24, right: 24 },
  autoFirstPage: true,
});

const pageW = doc.page.width;
const pageH = doc.page.height;
const chunks = [];
doc.on("data", (c) => chunks.push(c));
doc.on("end", () => {
  const buf = Buffer.concat(chunks);
  fs.writeFileSync('/tmp/test_cert_exact.pdf', buf);
  console.log("PDF written");
});

console.log("=== PAGE DIMENSIONS ===");
console.log("Page width:", pageW);
console.log("Page height:", pageH);

// Exact names from the finding
const testNames = [
  "Mpumelelo Thembinkoski Nkosi-Mbuyazi",
  "Ayokunle Adeyemi Ologundudu-Okonkwo",
  "Chidiebere Amara Ifeanyichukwu-Olugbile",
];

console.log("\n=== NAME HEIGHT MEASUREMENTS ===");

// Mimic the exact certificate rendering
let yPos = 50;
testNames.forEach((fullName) => {
  // Draw the "AWARDED TO" label
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#1538A6")
    .text("AWARDED TO", 0, yPos, {
      align: "center",
      width: pageW,
      characterSpacing: 5,
    });
  
  yPos += 20;
  
  // Draw the name with EXACT options from the certificate code
  doc
    .fontSize(42)
    .font("Times-BoldItalic")
    .fillColor("#061732")
    .text(fullName, 0, yPos, {
      align: "center",
      width: pageW,
      // NOTE: NO lineBreak option specified here!
    });
  
  // Measure height AFTER rendering
  const heightMeasured = doc.heightOfString(fullName, {
    width: pageW,
    fontSize: 42,
    font: "Times-BoldItalic",
    align: "center",
  });
  
  console.log(`\nName: "${fullName}"`);
  console.log(`  Length: ${fullName.length} chars`);
  console.log(`  Measured height: ${heightMeasured.toFixed(1)}pt`);
  console.log(`  Rendered at y=${yPos}`);
  console.log(`  Would extend to y=${yPos + heightMeasured}`);
  console.log(`  Rules positioned at y=298, stage at y=314`);
  
  yPos += 100;
});

doc.end();
