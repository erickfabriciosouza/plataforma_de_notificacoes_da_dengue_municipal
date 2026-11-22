const areaMapa = document.querySelector('#mapa');
const botaoLocalizacao = document.querySelector('#usar-localizacao');
const campoLatitude = document.querySelector('#latitude');
const campoLongitude = document.querySelector('#longitude');
const estadoLocal = document.querySelector('#estado-local');
let mapa;
let pontoSelecionado;

function mostrarPonto(latitude, longitude, atualizarCampos = true) {
    if (atualizarCampos) {
        campoLatitude.value = latitude.toFixed(6);
        campoLongitude.value = longitude.toFixed(6);
    }
    estadoLocal.textContent = `Ponto selecionado: ${campoLatitude.value}, ${campoLongitude.value}.`;
    if (!mapa) return;

    if (!pontoSelecionado) {
        pontoSelecionado = L.marker([latitude, longitude], {
            draggable: true,
            title: 'Local do novo registro',
            alt: 'Local do novo registro'
        }).addTo(mapa);
        pontoSelecionado.on('dragend', () => {
            const { lat, lng } = pontoSelecionado.getLatLng();
            mostrarPonto(lat, lng);
        });
    } else {
        pontoSelecionado.setLatLng([latitude, longitude]);
    }
}

function selecionarCoordenadasDigitadas() {
    const latitude = Number(campoLatitude.value.trim().replace(',', '.'));
    const longitude = Number(campoLongitude.value.trim().replace(',', '.'));
    if (!campoLatitude.value.trim() || !campoLongitude.value.trim() ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;

    mostrarPonto(latitude, longitude, false);
    mapa?.panTo([latitude, longitude]);
}

function montarMapa() {
    const centro = [Number(areaMapa.dataset.centroLat), Number(areaMapa.dataset.centroLon)];
    mapa = L.map(areaMapa).setView(centro, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapa);

    const iconeFoco = L.divIcon({ className: 'marcador-foco', iconSize: [20, 20], iconAnchor: [10, 10] });
    for (const item of document.querySelectorAll('.item-foco')) {
        const ponto = [Number(item.dataset.lat), Number(item.dataset.lon)];
        const descricao = item.querySelector('.nome-foco').textContent;
        const marcador = L.marker(ponto, { icon: iconeFoco, title: descricao, alt: descricao }).addTo(mapa);
        const popup = document.createElement('div');
        const texto = document.createElement('strong');
        texto.textContent = descricao;
        const tipo = document.createElement('p');
        tipo.textContent = item.querySelector('.tipo-foco').textContent;
        popup.append(texto, tipo);
        marcador.bindPopup(popup);
        item.addEventListener('click', () => {
            mapa.setView(ponto, 16);
            marcador.openPopup();
        });
    }

    mapa.on('click', ({ latlng }) => mostrarPonto(latlng.lat, latlng.lng));
    selecionarCoordenadasDigitadas();
}

campoLatitude.addEventListener('change', selecionarCoordenadasDigitadas);
campoLongitude.addEventListener('change', selecionarCoordenadasDigitadas);

if (navigator.geolocation && window.isSecureContext) {
    botaoLocalizacao.hidden = false;
    botaoLocalizacao.addEventListener('click', () => {
        estadoLocal.textContent = 'Buscando sua localização…';
        botaoLocalizacao.disabled = true;
        navigator.geolocation.getCurrentPosition(({ coords }) => {
            botaoLocalizacao.disabled = false;
            mostrarPonto(coords.latitude, coords.longitude);
            mapa?.setView([coords.latitude, coords.longitude], 16);
        }, () => {
            botaoLocalizacao.disabled = false;
            estadoLocal.textContent = 'Não foi possível obter sua localização. Selecione um ponto ou informe as coordenadas.';
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
}

if (typeof L !== 'undefined') {
    montarMapa();
} else {
    areaMapa.textContent = 'Mapa indisponível. Você pode preencher as coordenadas no formulário.';
    document.querySelectorAll('.item-foco').forEach(item => { item.disabled = true; });
}
