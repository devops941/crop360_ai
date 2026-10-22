import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateSampleSoilPDFBuffer(): Buffer {
  const content = `
SOIL TESTING LABORATORY
ICAR - KRISHI VIGYAN KENDRA (TNAU)
Soil Health Card / Test Report

Farmer Name: R. Murugesan
Village: Palani, District: Dindigul, State: Tamil Nadu
Sampling Date: 12-10-2026
Test Date: 15-10-2026
Sample Depth: 6 inches
Lab Code: STL-TNAU-2026-8841

TEST RESULTS:
------------------------------------------------------------------------
S.No | Parameter Name                | Test Value | Unit    | Rating
------------------------------------------------------------------------
1.   | Soil Reaction (pH)            | 7.20       | -       | Neutral (6.5-7.5)
2.   | Electrical Conductivity (EC)  | 0.35       | dS/m    | Normal (<1.0)
3.   | Organic Carbon (OC)           | 0.65       | %       | Medium (0.50-0.75)
4.   | Available Nitrogen (N)        | 295        | kg/ha   | Medium (280-560)
5.   | Available Phosphorus (P)      | 24.5       | kg/ha   | Medium (23-56)
6.   | Available Potassium (K)       | 240        | kg/ha   | Medium (140-280)
7.   | Available Sulphur (S)         | 16.0       | ppm     | Sufficient (>10.0)
8.   | Available Zinc (Zn)           | 0.95       | ppm     | Sufficient (>0.60)
9.   | Available Boron (B)           | 0.58       | ppm     | Sufficient (>0.50)
10.  | Available Iron (Fe)           | 6.20       | ppm     | Sufficient (>4.5)
11.  | Available Manganese (Mn)      | 4.10       | ppm     | Sufficient (>2.0)
12.  | Available Copper (Cu)         | 1.40       | ppm     | Sufficient (>0.20)
------------------------------------------------------------------------
Agronomist Notes: Soil is ideal for paddy, sugarcane, and vegetables.
`.trim();

  const lines = content.split('\n');
  let streamContent = 'BT /F1 10 Tf 50 750 Td 14 TL\n';
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamContent += `(${escaped}) Tj T*\n`;
  }
  streamContent += 'ET';

  const streamLen = Buffer.byteLength(streamContent);

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
${streamContent}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000260 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${350 + streamLen}
%%EOF`;

  return Buffer.from(pdf);
}

export async function GET() {
  const pdfBuffer = generateSampleSoilPDFBuffer();

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Sample_ICAR_Soil_Report.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
