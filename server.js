const express = require('express');
const app = express();
const port = 3001;
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jsPDF = require('jspdf');
const cors = require('cors');

// ...
const usuarios = [
  { id: 1, username: 'usuario', password: 'usuario123' },

  // ... otros usuarios ...
];
app.use(cors());

// Definición de tus rutas
// ...

// Configura la conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'db_ticket',
});
const jwt = require('jsonwebtoken'); // Asegúrate de que tengas la librería 'jsonwebtoken' instalada

// Clave secreta para firmar y verificar el token
const claveSecreta = '12345'; // Debes utilizar una clave segura en un entorno de producción

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Conexión a la base de datos MySQL establecida');
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta para insertar un formulario
app.post('/api/insertar-formulario', (req, res) => {
  const formData = req.body;
  const sql = 'INSERT INTO formularios (representante, curp, nombre, paterno, materno, telefono, correo, nivel, municipio, asunto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  db.query(sql, [
    formData.representante,
    formData.curp,
    formData.nombre,
    formData.paterno,
    formData.materno,
    formData.telefono,
    formData.correo,
    formData.nivel,
    formData.municipio,
    formData.asunto
  ], (err, result) => {
    if (err) {
      console.error('Error al insertar el formulario:', err);
      res.status(500).json({ message: 'Error al insertar el formulario' });
    } else {
      const numeroDeTurno = result.insertId;
      console.log('Formulario insertado correctamente');
      res.json({ message: 'Formulario insertado correctamente', insertId: numeroDeTurno });

      // Genera el PDF después de registrar los datos
      generatePDF(numeroDeTurno, formData);
    }
  });
});

// Función para generar un PDF
function generatePDF(numeroDeTurno, formData) {
  const qrSize = 100;
  const qrData = `Número de Turno: ${numeroDeTurno}`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`;

  const doc = new jsPDF();
  doc.text("Datos del Formulario", 10, 10);
  doc.text(`Número de Turno: ${numeroDeTurno}`, 10, 20);
  doc.text(`Nombre Completo: ${formData.representante}`, 10, 30);
  doc.text(`Nombre: ${formData.nombre}`, 10, 40);
  doc.text(`Paterno: ${formData.paterno}`, 10, 50);
  doc.text(`Materno: ${formData.materno}`, 10, 60);
  doc.text(`Teléfono: ${formData.telefono}`, 10, 70);
  doc.text(`Correo: ${formData.correo}`, 10, 80);
  doc.text(`Nivel: ${formData.nivel}`, 10, 90);
  doc.text(`Municipio: ${formData.municipio}`, 10, 100);
  doc.text(`Asunto: ${formData.asunto}`, 10, 110);
  doc.addImage(qrCodeURL, "PNG", 10, 120, qrSize, qrSize);
  doc.save(`formulario_${numeroDeTurno}.pdf`);
}
// Define una ruta para obtener datos de formularios
app.get('/api/formularios', (req, res) => {
  const consultaSQL = `
    SELECT
      id,
      Representante,
      CURP,
      Nombre,
      Paterno,
      Materno,
      Telefono,
      Correo,
      Nivel,
      Municipio,
      Asunto
    FROM formularios`;

  db.query(consultaSQL, (err, result) => {
    if (err) {
      throw err;
    }

    const formularios = result.map((row) => {
      return {
        id: row.id,
        Representante: row.Representante,
        CURP: row.CURP,
        Nombre: row.Nombre,
        Paterno: row.Paterno,
        Materno: row.Materno,
        Telefono: row.Telefono,
        Correo: row.Correo,
        Nivel: row.Nivel,
        Municipio: row.Municipio,
        Asunto: row.Asunto,
      };
    });

    res.json(formularios);
  });
});



// Ruta para obtener opciones de nivel desde la base de datos
app.get('/api/niveles', (req, res) => {
  const sql = 'SELECT * FROM niveles';
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

// Ruta para obtener opciones de municipio desde la base de datos
app.get('/api/municipios', (req, res) => {
  const sql = 'SELECT * FROM municipios';
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

// Ruta para obtener opciones de asunto desde la base de datos
app.get('/api/asuntos', (req, res) => {
  const sql = 'SELECT * FROM asuntos';
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});
// Función para verificar si las credenciales son válidas
function credencialesSonValidas(username, password) {
  const usuario = usuarios.find((u) => u.username === username);

  if (usuario && usuario.password === password) {
    return true;
  }

  return false;
}

// Función para generar un token JWT
function generarTokenDeAutenticacion(usuario) {
  const token = jwt.sign({ usuario }, claveSecreta, { expiresIn: '1h' });
  return token;
}

// Ruta para la autenticación
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (credencialesSonValidas(username, password)) {
    const token = generarTokenDeAutenticacion({ username });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
});
