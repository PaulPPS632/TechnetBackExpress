const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit-table");
class ReporteStockPDF {
  constructor() {}
  createPdf(data, res) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    const dir = path.resolve(__dirname, `../../public/documents/cotizaciones`);

    // Crear la carpeta si no existe
    // if (!fs.existsSync(dir)) {
    //   fs.mkdirSync(dir, { recursive: true }); // Crea la carpeta y sus padres si no existen
    // }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=REPORTE-STOCK.pdf");

    data.forEach((categoria) => {
      this.generateTable(doc, categoria);
    });
    //cambiar para despliegue
    // const ruta = `https://${process.env.DB_HOST}/api/cotizaciones/REPORTE-STOCK.pdf`;
    doc.end();
    // doc.pipe(fs.createWriteStream(path.resolve(dir, `REPORTE-STOCK.pdf`)));
    doc.pipe(res);
    //return ruta;
  }

  generateTable(doc, categoria) {
    const rows = categoria.productos.map((producto) => {
      return [
        producto.nombre, // Nombre del producto
        producto.precio,
        producto.stock,
      ];
    });

    const table = {
      title: categoria.nombre,
      headers: [
        {
          label: "Nombre",
          width: 300,
          renderer: null,
        },
        {
          label: "Precio",
          width: 60,
          renderer: null,
          align: "right",
        },
        {
          label: "Stock",
          width: 60,
          renderer: null,
          align: "right",
        },
      ],
      rows: rows,
    };

    doc.table(table); // Espacio entre la etiqueta y el valor
    doc.moveDown();
  }
}
module.exports = new ReporteStockPDF();
