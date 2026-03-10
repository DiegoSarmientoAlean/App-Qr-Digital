

const BASE_URL = 'https://diegosarmientoalean.github.io/App-Qr-Digital';


function generarCarnet() {
  const nombre   = document.getElementById('inp-nombre').value.trim();
  const codigo   = document.getElementById('inp-codigo').value.trim();
  const programa = document.getElementById('inp-programa').value.trim();

  if (!nombre || !codigo || !programa) {
    alert('Por favor completa todos los campos: Código, Nombre y Programa.');
    return;
  }

 
  const params = new URLSearchParams({ nombre, codigo, programa });
  const base   = BASE_URL || window.location.href.replace(/index\.html.*$/, '').replace(/\/$/, '');
  const qrURL  = `${base}/carnet.html?${params.toString()}`;

  document.getElementById('qr-string-value').textContent = qrURL;


  document.getElementById('qr-name-badge').textContent = nombre + ' · ' + codigo;

 
  const qrGrande = document.getElementById('qrcode-grande');
  qrGrande.innerHTML = '';
  new QRCode(qrGrande, {
    text:         qrURL,
    width:        256,
    height:       256,
    colorDark:    '#0a1628',
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  
  setTimeout(() => {
    const canvas = qrGrande.querySelector('canvas');
    if (canvas) {
      document.getElementById('btn-download-qr').href = canvas.toDataURL('image/png');
    }
  }, 300);

 
  document.getElementById('form-section').style.display = 'none';
  const output = document.getElementById('carnet-output');
  output.style.display = 'block';
  document.getElementById('qr-grande-section').classList.add('visible');
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


function nuevoCarnet() {
  
  document.getElementById('inp-nombre').value  = '';
  document.getElementById('inp-codigo').value  = '';
  document.getElementById('inp-programa').value = '';


  document.getElementById('carnet-output').style.display = 'none';
  document.getElementById('qr-grande-section').classList.remove('visible');
  document.getElementById('form-section').style.display = 'block';

 
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


document.addEventListener('DOMContentLoaded', () => {
  ['inp-nombre', 'inp-codigo', 'inp-programa'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') generarCarnet();
    });
  });
});




