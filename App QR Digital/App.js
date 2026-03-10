
function switchTab(tab, btn) {
  // Ocultar todos los paneles y desactivar todos los botones
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  // Activar panel y botón seleccionados
  document.getElementById('panel-' + tab).classList.add('active');
  btn.classList.add('active');

  // Detener escáner si se sale del panel de escaneo
  if (tab !== 'escanear') detenerScan();
}


function generarCarnet() {
  const nombre   = document.getElementById('inp-nombre').value.trim();
  const codigo   = document.getElementById('inp-codigo').value.trim();
  const programa = document.getElementById('inp-programa').value.trim();

  if (!nombre || !codigo || !programa) {
    alert('Por favor completa todos los campos: Código, Nombre y Programa.');
    return;
  }

  // Iniciales para el avatar
  const partes   = nombre.split(' ');
  const iniciales = (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();

  // Actualizar datos del carnet
  document.getElementById('carnet-nombre').textContent  = nombre;
  document.getElementById('carnet-codigo').textContent  = codigo;
  document.getElementById('carnet-programa').textContent = programa;
  document.getElementById('carnet-avatar').textContent  = iniciales;
  document.getElementById('carnet-id-mini').textContent = 'ID: ' + codigo;

  const año = new Date().getFullYear();
  document.getElementById('carnet-vigencia').textContent = `Vigencia: ${año} – ${año + 1}`;

  // ── Construir string QR: Nombre|Codigo|Carrera ──
  const qrString = `${nombre}|${codigo}|${programa}`;
  document.getElementById('qr-string-value').textContent = qrString;

  // ── Generar imagen QR con qrcode.js ──
  const qrDiv = document.getElementById('qrcode-display');
  qrDiv.innerHTML = ''; // limpiar QR anterior

  new QRCode(qrDiv, {
    text:           qrString,
    width:          80,
    height:         80,
    colorDark:      '#0a1628',
    colorLight:     '#ffffff',
    correctLevel:   QRCode.CorrectLevel.H
  });

  // Mostrar carnet y hacer scroll suave
  const output = document.getElementById('carnet-output');
  output.style.display = 'block';
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


let html5QrCode  = null;
let scannerActivo = false;

function iniciarScan() {
  ocultarError();
  document.getElementById('scan-result').style.display = 'none';

  // Instanciar escáner si no existe
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('reader');
  }

  Html5Qrcode.getCameras()
    .then(cameras => {
      if (!cameras || cameras.length === 0) {
        mostrarError('No se encontró cámara en este dispositivo.');
        return;
      }

      // Preferir cámara trasera (última de la lista en la mayoría de dispositivos)
      const camId = cameras[cameras.length - 1].id;

      html5QrCode.start(
        camId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // QR detectado: parsear y detener cámara
          procesarQR(decodedText);
          detenerScan();
        },
        () => { /* errores de frame ignorados */ }
      )
      .then(() => {
        scannerActivo = true;
        document.getElementById('btn-start-scan').style.display = 'none';
        document.getElementById('btn-stop-scan').classList.add('visible');
      })
      .catch(err => {
        mostrarError('No se pudo acceder a la cámara. Verifica los permisos o usa el campo manual.');
        console.error('html5QrCode.start error:', err);
      });
    })
    .catch(() => {
      mostrarError('No se pudo acceder a la cámara. Verifica los permisos o usa el campo manual.');
    });
}

function detenerScan() {
  if (html5QrCode && scannerActivo) {
    html5QrCode.stop().catch(() => {});
    scannerActivo = false;
  }
  document.getElementById('btn-start-scan').style.display = 'block';
  document.getElementById('btn-stop-scan').classList.remove('visible');
}

/* ────────────────────────────────────────────
   PARSEAR STRING QR → Nombre|Codigo|Carrera
   ──────────────────────────────────────────── */
function procesarQR(texto) {
  ocultarError();

  const partes = texto.split('|');

  if (partes.length < 3) {
    mostrarError('QR inválido. Formato esperado: Nombre|Codigo|Carrera');
    return;
  }

  const [nombre, codigo, programa] = partes;

  // Generar iniciales para el avatar
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map(p => p[0] || '')
    .join('')
    .toUpperCase() || '?';

  // Mostrar datos parseados
  document.getElementById('result-nombre').textContent  = nombre  || '—';
  document.getElementById('result-codigo').textContent  = codigo  || '—';
  document.getElementById('result-programa').textContent = programa || '—';
  document.getElementById('result-avatar').textContent  = iniciales;
  document.getElementById('result-raw').textContent     = '🔗 ' + texto;

  // Animar y mostrar resultado
  const resultDiv = document.getElementById('scan-result');
  resultDiv.style.display = 'block';
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ────────────────────────────────────────────
   PARSEAR MANUALMENTE (campo de texto)
   ──────────────────────────────────────────── */
function parsearManual() {
  const valor = document.getElementById('manual-qr').value.trim();
  if (!valor) {
    mostrarError('Ingresa un string QR para parsear. Ej: Nombre|Codigo|Carrera');
    return;
  }
  procesarQR(valor);
}

/* ────────────────────────────────────────────
   HELPERS: mensajes de error
   ──────────────────────────────────────────── */
function mostrarError(msg) {
  const el = document.getElementById('scan-error');
  el.textContent = '⚠ ' + msg;
  el.classList.add('visible');
}

function ocultarError() {
  document.getElementById('scan-error').classList.remove('visible');
}

/* ────────────────────────────────────────────
   EVENT LISTENERS
   ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Enter en campo manual de escaneo
  document.getElementById('manual-qr').addEventListener('keydown', e => {
    if (e.key === 'Enter') parsearManual();
  });

  // Enter en campos del formulario de generación
  ['inp-nombre', 'inp-codigo', 'inp-programa'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') generarCarnet();
    });
  });
});