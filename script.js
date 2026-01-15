let allFilms = [], allMarketData = [];
let filmChart = null, marketChart = null, detailChart = null;
let currentPage = 1;

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

async function init() {
    try {
        const [resFilms, resMarket] = await Promise.all([
            fetch('get_data.php').then(r => r.json()),
            fetch('get_market_data.php').then(r => r.json())
        ]);
        
        allFilms = resFilms;
        allMarketData = resMarket;

        document.getElementById('fNat').addEventListener('change', updateFilms);
        document.getElementById('fDiff').addEventListener('input', updateFilms);
        document.getElementById('fYear').addEventListener('input', updateMarketChart);
        document.getElementById('fMode').addEventListener('change', updateMarketChart);

        updateFilms();
        updateMarketChart();
    } catch (err) {
        console.error("Acune données disposibles :", err);
    }
}

function switchPage(num) {
    currentPage = num;
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page' + num).classList.add('active');
    document.getElementById('tab' + num).classList.add('active');
}

function toggleInfo() {
    const popup = document.getElementById('infoPopup');
    
    if (!popup.classList.contains('show')) {
        document.querySelectorAll('.info-text-section').forEach(s => s.classList.remove('active'));
        
        document.getElementById('div_texte' + currentPage).classList.add('active');
        popup.classList.add('show');
    } else {
        popup.classList.remove('show');
    }
}

function updateFilms() {
    const nat = document.getElementById('fNat').value;
    const diffMin = parseInt(document.getElementById('fDiff').value);
    document.getElementById('txtDiff').innerText = diffMin;

    const filtered = allFilms.filter(f => {
        const mNat = nat === "ALL" || (f.nat && f.nat.toUpperCase().includes(nat));
        return mNat && parseInt(f.diff) >= diffMin;
    });
    
    const palette = [
    '#38bdf8', '#f43f5e', '#fbbf24', '#10b981', '#8b5cf6',
    '#f97316', '#06b6d4', '#ec4899', '#6366f1', '#2dd4bf'];

    const years = filtered.map(f => parseInt(f.annee));
    if (years.length > 0) {
        document.getElementById('sMed').innerText = math.median(years);
        document.getElementById('sAge').innerText = Math.round(2026 - math.mean(years)) + " ans";
        
        const oldOnes = years.filter(y => y < 1990).length;
        document.getElementById('sProb').innerText = ((oldOnes / years.length) * 100).toFixed(1) + "%";
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    if (filmChart) filmChart.destroy();
    
    filmChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                data: filtered.map(f => ({x: f.annee, y: f.diff, t: f.titre})),
                backgroundColor: filtered.map(f => {
                    let hash = 0;
                    for (let i = 0; i < f.titre.length; i++) {
                        hash = f.titre.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    return palette[Math.abs(hash) % palette.length];
                }),
                pointRadius: 4.5,
                hoverRadius: 6
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                tooltip: { 
                    callbacks: { 
                        label: (c) => [
                            `${c.raw.t} (${c.raw.x})`,
                            `Nombre de diffusions : ${c.raw.y}`
                        ]
                    } 
                },
                legend: { display: false }
            },
            onClick: (e, el) => { 
                if (el.length > 0) showFilmDetails(filmChart.data.datasets[0].data[el[0].index].t); 
            },
            scales: { 
                x: { min: 1939, max: 2020, title: { display: true, text: 'Année de production' } }, 
                y: { min: 25, max: 76, beginAtZero: true, title: { display: true, text: 'Nombres de diffusions' } } 
            }
        }
    });
}

async function showFilmDetails(titre) {
    const f = await fetch(`get_film_details.php?titre=${encodeURIComponent(titre)}`).then(r => r.json());
    
    document.getElementById('filmDetailsOverlay').classList.add('show');
    document.getElementById('detTitre').innerText = f.titre;
    document.getElementById('detList').innerHTML = `
        <p>👤 <b>Réalisateur :</b> ${f.realisateur}</p>
        <p>🌍 <b>Origine :</b> ${f.groupe_de_nationalite2}</p>
        <p>📅 <b>Dernière année de diffusion :</b> ${f.annee_de_derniere_diffusion}</p>
    `;

    const ctx = document.getElementById('detailChart').getContext('2d');
    if (detailChart) detailChart.destroy();
    
    detailChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Diffusion en première partie de soirée', 'Autres'],
            datasets: [{ 
                data: [f.dont_en_premiere_partie_de_soiree, f.nb_de_diffusions - f.dont_en_premiere_partie_de_soiree], 
                backgroundColor: ['#fbbf24', '#38bdf8'] 
            }]
        },
        options: { maintainAspectRatio: false }
    });
}

function closeDetails() { 
    document.getElementById('filmDetailsOverlay').classList.remove('show'); 
}

function updateMarketChart() {
    const startYear = parseInt(document.getElementById('fYear').value);
    const mode = document.getElementById('fMode').value;
    document.getElementById('txtYear').innerText = startYear;

    let data = allMarketData.filter(d => d.annee >= startYear);
    let labels = data.map(d => d.annee);
    let vod = data.map(d => d.vod);
    let tv = data.map(d => d.tv);

    if (mode === "PRED" && data.length > 1) {
        const firstVod = vod[0];
        const lastVod = vod[vod.length - 1];
        const periods = data.length - 1;
        const vodGrowthRate = Math.pow(lastVod / firstVod, 1 / periods);

        const firstTv = tv[0];
        const lastTv = tv[tv.length - 1];
        const tvAnnualDecline = (lastTv - firstTv) / periods;

        let currentVod = lastVod;
        let currentTv = lastTv;
        let lastYear = labels[labels.length - 1];

        for (let y = lastYear + 1; y <= 2030; y++) {
            labels.push(y);
            currentVod *= vodGrowthRate;
            currentTv += tvAnnualDecline;
            
            vod.push(currentVod);
            tv.push(Math.max(0, currentTv));
        }
    }

    const lastIdx = vod.length - 1;
    
    document.getElementById('sGrowth').innerText = "+" + ((vod[lastIdx] - vod[0]) / vod[0] * 100).toFixed(0) + "%";
    document.getElementById('sErosion').innerText = ((tv[lastIdx] - tv[0]) / tv[0] * 100).toFixed(1) + "%";
    document.getElementById('sBascule').innerText = (Math.abs(tv[lastIdx] - tv[0]) / 2).toFixed(1) + "%";

    const ctx = document.getElementById('marketChart').getContext('2d');
    if (marketChart) marketChart.destroy();
    
    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'VOD (M€)', 
                    data: vod, 
                    borderColor: '#38bdf8', 
                    fill: true, 
                    backgroundColor: 'rgba(56,189,248,0.1)', 
                    yAxisID: 'y1' 
                },
                { 
                    label: 'TV (Min/j)', 
                    data: tv, 
                    borderColor: '#f43f5e', 
                    borderDash: [5,5], 
                    yAxisID: 'y2' 
                }
            ]
        },
        options: { 
            maintainAspectRatio: false,
            scales: {
                y1: { title: { display: true, text: 'Chiffre d\'affaires (M€)' } },
                y2: { position: 'right', title: { display: true, text: 'Temps d\'écoute moyen quotidien (min/J)' } }
            }
        }
    });
}

init();