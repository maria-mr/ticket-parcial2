// Importa el módulo MySQL para interactuar con la base de datos
const mysql = require('mysql');
const jsPDF = require('jspdf');

// Configura la conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'db_ticket', // Nombre de la base de datos
});

// Conéctate a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos MySQL:', err);
  } else {
    console.log('Conexión a la base de datos MySQL establecida');
  }
});

// Función para insertar un formulario en la base de datos
const insertarFormulario = (req, res) => {
  // Recibe los datos del formulario desde la solicitud
  const { representante, curp, nombre, paterno, materno, telefono, correo, nivel, municipio, asunto } = req.body;

  // Crea una consulta SQL para insertar el formulario en la tabla "formularios"
  const sql = 'INSERT INTO formularios (representante, curp, nombre, paterno, materno, telefono, correo, nivel, municipio, asunto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [representante, curp, nombre, paterno, materno, telefono, correo, nivel, municipio, asunto];

  db.query(sql, values, (error, result) => {
    if (error) {
      console.error('Error al insertar formulario:', error);
      res.status(500).json({ message: 'Error al insertar el formulario en la base de datos' });
    } else {
      console.log('Formulario insertado correctamente');
      const numeroDeTurno = result.insertId; // Obtiene el ID del formulario insertado

      // Genera un PDF con los datos
      generatePDF(numeroDeTurno, req.body);

      res.json({ message: 'Formulario insertado correctamente', turno: numeroDeTurno });
    }
  });
};

// Función para generar un PDF
function generatePDF(numeroDeTurno, formData) {
  const qrSize = 100; // Elige el tamaño que desees para el código QR

  const qrData = `Número de Turno: ${numeroDeTurno}`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`;

  const doc = new jsPDF();

  doc.text("Datos del Formulario", 10, 10);
  doc.text(`Número de Turno: ${numeroDeTurno}`, 10, 20);
  doc.text(`Nombre Completo: ${formData.representante}`, 10, 30);
  doc.text(`Nombre: ${formData.nombre}`, 10, 40);
  doc.text(`Paterno: ${formData.paterno}`, 10, 50);
  doc.text(`Materno: ${formData.materno}`, 10, 60);
  doc.text(`Telefono: ${formData.telefono}`, 10, 70);
  doc.text(`Correo: ${formData.correo}`, 10, 80);
  doc.text(`Nivel: ${formData.nivel}`, 10, 90);
  doc.text(`Municipio: ${formData.municipio}`, 10, 100);
  doc.text(`Asunto: ${formData.asunto}`, 10, 110);

  doc.addImage(qrCodeURL, "PNG", 10, 120, qrSize, qrSize);

  doc.save(`formulario_${numeroDeTurno}.pdf`);
}

module.exports = {
  insertarFormulario,
};
