

const BASE_URL = 'https://diegosarmientoalean.github.io/App-Qr-Digital';


function switchTab(tab, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  btn.classList.add('active');
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
  const partes    = nombre.split(' ');
  const iniciales = (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();

  // Actualizar datos del carnet visual
  document.getElementById('carnet-nombre').textContent   = nombre;
  document.getElementById('carnet-codigo').textContent   = codigo;
  document.getElementById('carnet-programa').textContent = programa;
  document.getElementById('carnet-avatar').textContent   = iniciales;
  document.getElementById('carnet-id-mini').textContent  = 'ID: ' + codigo;

  const anio = new Date().getFullYear();
  document.getElementById('carnet-vigencia').textContent = `Vigencia: ${anio} – ${anio + 1}`;

  // ── Construir URL que irá dentro del QR ──
  // Al escanear, el celular abre: carnet.html?nombre=...&codigo=...&programa=...
  const params = new URLSearchParams({ nombre, codigo, programa });

  // Si BASE_URL está vacío, detectar la ruta actual automáticamente
  let base = BASE_URL;
  if (!base) {
    base = window.location.href.replace(/index\.html.*$/, '').replace(/\/$/, '');
  }
  const qrURL = `${base}/carnet.html?${params.toString()}`;

  // Mostrar la URL generada
  document.getElementById('qr-string-value').textContent = qrURL;

  // ── QR pequeño en el carnet (decorativo) ──
  const qrDiv = document.getElementById('qrcode-display');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: qrURL, width: 80, height: 80,
    colorDark: '#0a1628', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  // ── QR GRANDE para escanear con celular ──
  const qrGrande = document.getElementById('qrcode-grande');
  qrGrande.innerHTML = '';
  new QRCode(qrGrande, {
    text: qrURL, width: 256, height: 256,
    colorDark: '#0a1628', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  // Botón descargar QR
  setTimeout(() => {
    const canvas = qrGrande.querySelector('canvas');
    if (canvas) {
      document.getElementById('btn-download-qr').href = canvas.toDataURL('image/png');
    }
  }, 300);

  document.getElementById('qr-grande-section').classList.add('visible');

  // Mostrar carnet
  const output = document.getElementById('carnet-output');
  output.style.display = 'block';
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


let html5QrCode   = null;
let scannerActivo = false;

function iniciarScan() {
  ocultarError();
  document.getElementById('scan-result').style.display = 'none';

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('reader');
  }

  Html5Qrcode.getCameras()
    .then(cameras => {
      if (!cameras || cameras.length === 0) {
        mostrarError('No se encontró cámara en este dispositivo.');
        return;
      }
      const camId = cameras[cameras.length - 1].id;

      html5QrCode.start(
        camId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          procesarQR(decodedText);
          detenerScan();
        },
        () => {}
      )
      .then(() => {
        scannerActivo = true;
        document.getElementById('btn-start-scan').style.display = 'none';
        document.getElementById('btn-stop-scan').classList.add('visible');
      })
      .catch(err => {
        mostrarError('No se pudo acceder a la cámara. Verifica los permisos o usa el campo manual.');
        console.error(err);
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


function procesarQR(texto) {
  ocultarError();

  let nombre, codigo, programa;


  try {
    const url    = new URL(texto);
    const params = url.searchParams;
    nombre   = params.get('nombre');
    codigo   = params.get('codigo');
    programa = params.get('programa');
  } catch (e) {
    // No es URL: intentar formato texto plano Nombre|Codigo|Carrera
    const partes = texto.split('|');
    if (partes.length >= 3) {
      [nombre, codigo, programa] = partes;
    }
  }

  if (!nombre || !codigo || !programa) {
    mostrarError('QR inválido. Debe ser una URL de carnet o el formato Nombre|Codigo|Carrera');
    return;
  }

  const iniciales = nombre
    .split(' ').slice(0, 2)
    .map(p => p[0] || '').join('').toUpperCase() || '?';

  document.getElementById('result-nombre').textContent   = nombre;
  document.getElementById('result-codigo').textContent   = codigo;
  document.getElementById('result-programa').textContent = programa;
  document.getElementById('result-avatar').textContent   = iniciales;
  document.getElementById('result-raw').textContent      = '🔗 ' + texto;

  const resultDiv = document.getElementById('scan-result');
  resultDiv.style.display = 'block';
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function parsearManual() {
  const valor = document.getElementById('manual-qr').value.trim();
  if (!valor) {
    mostrarError('Ingresa un string QR para parsear.');
    return;
  }
  procesarQR(valor);
}


function mostrarError(msg) {
  const el = document.getElementById('scan-error');
  el.textContent = '⚠ ' + msg;
  el.classList.add('visible');
}

function ocultarError() {
  document.getElementById('scan-error').classList.remove('visible');
}


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('manual-qr').addEventListener('keydown', e => {
    if (e.key === 'Enter') parsearManual();
  });
  ['inp-nombre', 'inp-codigo', 'inp-programa'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') generarCarnet();
    });
  });
});



