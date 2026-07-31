const resultado = document.querySelector('#resultado')
const btnsemanaatual = document.querySelector('#btnsemanaatual')
const btn4ultimassemanas = document.querySelector('#btn4ultimassemanas')
const btnacumuladoano = document.querySelector('#btnacumuladoano')
const seriehistorica = document.querySelector('#seriehistorica')
const fontedado = document.querySelector('#fonte-dado')

async function dadossemanaatual() {
    resultado.innerText = `Carregando os dados mais recentes...`;
    resultado.classList.remove('erro')
    resultado.classList.add('sucess')

    try {
        let dado;
        const dadoEmCache = sessionStorage.getItem('dadosDengueSantoAmaro');

        if (dadoEmCache) {
            dado = JSON.parse(dadoEmCache);
        } else {
            const urlAPI = 'https://info.dengue.mat.br/api/alertcity?geocode=2928604&disease=dengue&format=json&ew_start=1&ew_end=53&ey_start=2026&ey_end=2026';
            const urlComProxy = `https://corsproxy.io/?${encodeURIComponent(urlAPI)}`;

            const aquisicao = await fetch(urlComProxy);
            if (aquisicao.ok) {
                dado = await aquisicao.json();
                sessionStorage.setItem('dadosDengueSantoAmaro', JSON.stringify(dado));
            } else {
                throw new Error('Erro na comunicação com a API do InfoDengue');
            }
        }

        const dadomaisrecente = String(dado[0].SE);
        const casos = dado[0].casos
        const casosestimados = dado[0].casos_est
        const taxaincidencia100k = dado[0].p_inc100k.toFixed(2)
        const nivel = dado[0].nivel
        const ritmodetransmissao = dado[0].Rt.toFixed(2);

        function verificart() {
            if (Number(ritmodetransmissao) > 1) {
                return `<span class="alerta">RT > 1 | Rápida</span>`
            } else if (Number(ritmodetransmissao) === 1) {
                return `<span class="endemica">RT = 1 | Estável</span>`
            } else if (Number(ritmodetransmissao) < 1) {
                return `<span class="atencao">RT < 1 | Queda</span>`
            }
        }

        function nivelcasos () {
            if (nivel === 1) {
                return `<span class="baixorisco">Nível ${nivel} (Verde)</span>`
            } else if (nivel === 2) {
                return `<span class="atencao">Nível ${nivel} (Amarelo)</span>`
            } else if (nivel === 3) {
                return `<span class="alerta2">Nível ${nivel} (Laranja)</span>`
            } else if (nivel === 4) {
                return `<span class="critico">Nível ${nivel} (Vermelho)</span>`
            }
        }
              
        resultado.innerHTML = `
            <div class="layout-resultado">
                <div class="info-texto">
                    <h3 class="kpi-card-title">Resumo em cards da Semana Atual</h3>
                    
                    <div class="kpi-card">
                        <h4>Casos Notificados / Estimados</h4>
                        <p>${casos} / ${Math.round(casosestimados)}</p>
                    </div>
                    
                    <div class="kpi-card">
                        <h4>Nível de Risco Atual</h4>
                        <p>${nivelcasos()}</p>
                    </div>
                    
                    <div class="kpi-card">
                        <h4>Ritmo de Transmissão (RT)</h4>
                        <p>${verificart()}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Incidência (por 100k hab.)</h4>
                        <p>${taxaincidencia100k}</p>
                    </div>
                </div>

                <div style="width: 100%; border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 25px; text-align: center;">
                    <h3 class="kpi-card-title" style="margin-bottom: 5px; display: inline-block; width: 100%;">Resumo Gráfico das Últimas 12 Semanas</h3>
                    <p style="font-size: 0.9rem; color: #ffffff; background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; margin-bottom: 10px; display: inline-block;">⚠️ O gráfico exibe a tendência histórica recente. <b>Seus dados não se limitam apenas à semana atual dos cartões.</b></p>
                </div>

                <div class="area-grafico">
                    <canvas id="meuGrafico"></canvas>
                </div>
            </div>
        `;
                    
        fontedado.innerText = `Fonte: InfoDengue`;
        resultado.classList.add('sucess');

        const ultimas12Semanas = dado.slice(0, 12).reverse();
        
        const rotulosSemanas = ultimas12Semanas.map(item => `SE ${String(item.SE).slice(-2)}`);
        const dadosCasosEstimados = ultimas12Semanas.map(item => Math.round(item.casos_est));
        const dadosUmidade = ultimas12Semanas.map(item => Number(item.umidmed));
        const dadosTemperatura = ultimas12Semanas.map(item => Number(item.tempmed));

        const ctx = document.getElementById('meuGrafico').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rotulosSemanas, 
                datasets: [
                    {
                        type: 'bar',
                        label: 'Temperatura Média (°C)',
                        data: dadosTemperatura,
                        backgroundColor: '#dc2626', 
                        yAxisID: 'y1',
                    },
                    {
                        type: 'bar',
                        label: 'Casos Estimados',
                        data: dadosCasosEstimados, 
                        backgroundColor: '#2563eb', 
                        yAxisID: 'y',
                    },
                    {
                        type: 'bar',
                        label: 'Umidade Média (%)',
                        data: dadosUmidade,
                        backgroundColor: '#021247', 
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        align: 'start', 
                        labels: { color: 'black' } 
                    } 
                },
                scales: {
                    x: { ticks: { color: 'black' } }, 
                    y: { 
                        type: 'linear',
                        position: 'left', 
                        ticks: { color: 'black' } 
                    },
                    y1: {
                        type: 'linear',
                        position: 'right', 
                        ticks: { color: 'black' },
                        grid: { drawOnChartArea: false } 
                    }
                }
            }
        });

    } catch (error) {
        console.log(error.message);
        resultado.innerText = `Falha: ${error.message}`;
        resultado.classList.add('erro');
    }
}

async function dados4semanas() {
  resultado.innerText = `Carregando os dados mais recentes...`;
  resultado.classList.remove('erro')
  resultado.classList.add('sucess')

    try {
        let dado;
        const dadoEmCache = sessionStorage.getItem('dadosDengueSantoAmaro');

        if (dadoEmCache) {
            dado = JSON.parse(dadoEmCache);
        } else {
            const urlAPI = 'https://info.dengue.mat.br/api/alertcity?geocode=2928604&disease=dengue&format=json&ew_start=1&ew_end=53&ey_start=2026&ey_end=2026';
            const urlComProxy = `https://corsproxy.io/?${encodeURIComponent(urlAPI)}`; 
            
            const aquisicao = await fetch(urlComProxy);
            if (aquisicao.ok) {
                dado = await aquisicao.json();
                sessionStorage.setItem('dadosDengueSantoAmaro', JSON.stringify(dado));
            } else {
                throw new Error('Erro na comunicação com a API do InfoDengue');
            }
        }

        const ultimas4 = dado.slice(0, 4);
        const casos = ultimas4.reduce((acumulador, semana) => acumulador + semana.casos, 0);
        const casosestimados = ultimas4.reduce((acumulador, semana) => acumulador + semana.casos_est, 0);
        const nivel = Math.max(...ultimas4.map(semana => semana.nivel));
        const taxaincidencia100k = ultimas4.reduce((acc, semana) => acc + semana.p_inc100k, 0).toFixed(2);
        const ritmodetransmissao = (ultimas4.reduce((acc, semana) => acc + semana.Rt, 0) / 4).toFixed(2);

        function verificart() {
            if (Number(ritmodetransmissao) > 1) {
                return `<span class="alerta">RT Média > 1 | Rápida</span>`;
            } else if (Number(ritmodetransmissao) === 1) {
                return `<span class="endemica">RT Média = 1 | Estável</span>`;
            } else if (Number(ritmodetransmissao) < 1) {
                return `<span class="atencao">RT Média < 1 | Queda</span>`;
            }
        }
        
        function nivelcasos() {
            if (nivel === 1) {
                return `<span class="baixorisco">Nível ${nivel} (Verde)</span>`;
            } else if (nivel === 2) {
                return `<span class="atencao">Nível ${nivel} (Amarelo)</span>`;
            } else if (nivel === 3) {
                return `<span class="alerta2">Nível ${nivel} (Laranja)</span>`;
            } else if (nivel === 4) {
                return `<span class="critico">Nível ${nivel} (Vermelho)</span>`;
            }
        }

        resultado.innerHTML = `
            <div class="layout-resultado">
                <div class="info-texto">
                    <h3 class="kpi-card-title">Resumo em cards das Últimas 4 Semanas</h3>
                    
                    <div class="kpi-card">
                        <h4>Casos Notificados / Estimados</h4>
                        <p>${casos} / ${Math.round(casosestimados)}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Pico de Risco no Período</h4>
                        <p>${nivelcasos()}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Ritmo de Transmissão Médio no Período</h4>
                        <p>${verificart()}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Incidência Acumulada(por 100k hab.) no Período</h4>
                        <p>${taxaincidencia100k}</p>
                    </div>
                </div>

                <div style="width: 100%; border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 25px; text-align: center;">
                    <h3 class="kpi-card-title" style="margin-bottom: 5px; display: inline-block; width: 100%;">Resumo Gráfico das Últimas 24 Semanas</h3>
                    <p style="font-size: 0.9rem; color: #ffffff; background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; margin-bottom: 10px; display: inline-block;">⚠️ O gráfico exibe uma tendência estendida. <b>A linha do tempo não é restrita ao período de 4 semanas dos cartões.</b></p>
                </div>

                <div class="area-grafico">
                    <canvas id="meuGrafico4Semanas"></canvas>
                </div>
            </div>
        `;   
        fontedado.innerText = `Fonte: InfoDengue`;
        resultado.classList.add('sucess');

        const ultimas24Semanas = dado.slice(0, 24).reverse();
        const rotulosSemanas = ultimas24Semanas.map(item => `SE ${String(item.SE).slice(-2)}`);
        const dadosCasosEstimados = ultimas24Semanas.map(item => Math.round(item.casos_est));
        const dadosUmidade = ultimas24Semanas.map(item => Number(item.umidmed));
        const dadosTemperatura = ultimas24Semanas.map(item => Number(item.tempmed));

        const ctx = document.getElementById('meuGrafico4Semanas').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rotulosSemanas,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Temperatura Média (°C)',
                        data: dadosTemperatura,
                        backgroundColor: '#dc2626', 
                        yAxisID: 'y1',
                    },
                    {
                        type: 'bar',
                        label: 'Casos Estimados',
                        data: dadosCasosEstimados, 
                        backgroundColor: '#2563eb', 
                        yAxisID: 'y',
                    },
                    {
                        type: 'bar',
                        label: 'Umidade Média (%)',
                        data: dadosUmidade,
                        backgroundColor: '#021247', 
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        align: 'start', 
                        labels: { color: 'black' } 
                    } 
                },
                scales: {
                    x: { ticks: { color: 'black' } }, 
                    y: { 
                        type: 'linear',
                        position: 'left', 
                        ticks: { color: 'black' } 
                    },
                    y1: {
                        type: 'linear',
                        position: 'right', 
                        ticks: { color: 'black' },
                        grid: { drawOnChartArea: false } 
                    }
                }
            }
        });

    } catch (error) {
        console.log(error.message);
        resultado.innerText = `Falha: ${error.message}`;
        resultado.classList.add('erro');
    }
}

async function dadosacumuladoano() {
    resultado.innerText = `Carregando os dados do ano...`;
    resultado.classList.remove('erro');
    resultado.classList.add('sucess');

    try {
        let dado;
        const dadoEmCache = sessionStorage.getItem('dadosDengueSantoAmaro');

        if (dadoEmCache) {
            dado = JSON.parse(dadoEmCache);
        } else {
            const urlAPI = 'https://info.dengue.mat.br/api/alertcity?geocode=2928604&disease=dengue&format=json&ew_start=1&ew_end=53&ey_start=2026&ey_end=2026';
            const urlComProxy = `https://corsproxy.io/?${encodeURIComponent(urlAPI)}`; 
            
            const aquisicao = await fetch(urlComProxy);
            if (aquisicao.ok) {
                dado = await aquisicao.json();
                sessionStorage.setItem('dadosDengueSantoAmaro', JSON.stringify(dado));
            } else {
                throw new Error('Erro na comunicação com a API do InfoDengue');
            }
        }

        const totalSemanas = dado.length;

        const casos = dado.reduce((acumulador, semana) => acumulador + semana.casos, 0);
        const casosestimados = dado.reduce((acumulador, semana) => acumulador + semana.casos_est, 0);
        const nivel = Math.max(...dado.map(semana => semana.nivel));
        const taxaincidencia100k = dado.reduce((acc, semana) => acc + semana.p_inc100k, 0).toFixed(2);
        const ritmodetransmissao = (dado.reduce((acc, semana) => acc + semana.Rt, 0) / totalSemanas).toFixed(2);

        function verificart() {
            if (Number(ritmodetransmissao) > 1) {
                return `<span class="alerta">RT Anual > 1 | Rápida</span>`;
            } else if (Number(ritmodetransmissao) === 1) {
                return `<span class="endemica">RT Anual = 1 | Estável</span>`;
            } else if (Number(ritmodetransmissao) < 1) {
                return `<span class="atencao">RT Anual < 1 | Controle</span>`;
            }
        }

        function nivelcasos() {
            if (nivel === 1) {
                return `<span class="baixorisco">Nível ${nivel} (Verde)</span>`;
            } else if (nivel === 2) {
                return `<span class="atencao">Nível ${nivel} (Amarelo)</span>`;
            } else if (nivel === 3) {
                return `<span class="alerta2">Nível ${nivel} (Laranja)</span>`;
            } else if (nivel === 4) {
                return `<span class="critico">Nível ${nivel} (Vermelho)</span>`;
            }
        }

        resultado.innerHTML = `
            <div class="layout-resultado">
                <div class="info-texto">
                    <h3 class="kpi-card-title">Resumo em cards do Ano Vigente</h3>
                    
                    <div class="kpi-card">
                        <h4>Casos Notificados / Estimados</h4>
                        <p>${casos} / ${Math.round(casosestimados)}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Pico de Risco Anual</h4>
                        <p>${nivelcasos()}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Ritmo de Transmissão Médio Anual</h4>
                        <p>${verificart()}</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Incidência Acumulada(por 100k hab.) Anual</h4>
                        <p>${taxaincidencia100k}</p>
                    </div>
                </div>

                <div style="width: 100%; border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 25px; text-align: center;">
                    <h3 class="kpi-card-title" style="margin-bottom: 5px; display: inline-block; width: 100%;">Resumo Gráfico do Ano Vigente</h3>
                    <p style="font-size: 0.9rem; color: #ffffff; background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; margin-bottom: 10px; display: inline-block;">Evolução de casos e clima distribuída por todas as semanas registradas no ano.</p>
                </div>

                <div class="area-grafico">
                    <canvas id="meuGraficoAcumuladoAno"></canvas>
                </div>
            </div>
        `;   
        fontedado.innerText = `Fonte: InfoDengue`;
        resultado.classList.add('sucess');

        const dadosDoAno = [...dado].reverse();
        
        const rotulosSemanas = dadosDoAno.map(item => `SE ${String(item.SE).slice(-2)}`);
        const dadosCasosEstimados = dadosDoAno.map(item => Math.round(item.casos_est));
        const dadosUmidade = dadosDoAno.map(item => Number(item.umidmed));
        const dadosTemperatura = dadosDoAno.map(item => Number(item.tempmed));

        const ctx = document.getElementById('meuGraficoAcumuladoAno').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rotulosSemanas,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Temperatura Média (°C)',
                        data: dadosTemperatura,
                        backgroundColor: '#dc2626', 
                        yAxisID: 'y1',
                    },
                    {
                        type: 'bar',
                        label: 'Casos Estimados',
                        data: dadosCasosEstimados, 
                        backgroundColor: '#2563eb', 
                        yAxisID: 'y',
                    },
                    {
                        type: 'bar',
                        label: 'Umidade Média (%)',
                        data: dadosUmidade,
                        backgroundColor: '#021247', 
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        align: 'start', 
                        labels: { color: 'black' } 
                    } 
                },
                scales: {
                    x: { ticks: { color: 'black' } }, 
                    y: { 
                        type: 'linear',
                        position: 'left', 
                        ticks: { color: 'black' } 
                    },
                    y1: {
                        type: 'linear',
                        position: 'right', 
                        ticks: { color: 'black' },
                        grid: { drawOnChartArea: false } 
                    }
                }
            }
        });

    } catch (error) {
        console.log(error.message);
        resultado.innerText = `Falha: ${error.message}`;
        resultado.classList.add('erro');
    }
}

async function dadoshistoricos() {
    resultado.innerText = `Carregando a série histórica (Isso pode levar alguns segundos)...`;
    resultado.classList.remove('erro');
    resultado.classList.add('sucess');

    try {
        let dado;
        const dadoEmCache = sessionStorage.getItem('dadosDengueHistoricoSantoAmaro');

        if (dadoEmCache) {
            dado = JSON.parse(dadoEmCache);
        } else {
            const urlAPI = 'https://info.dengue.mat.br/api/alertcity?geocode=2928604&disease=dengue&format=json&ew_start=1&ew_end=53&ey_start=2010&ey_end=2026';
            const urlComProxy = `https://corsproxy.io/?${encodeURIComponent(urlAPI)}`; 
            
            const aquisicao = await fetch(urlComProxy);
            if (aquisicao.ok) {
                dado = await aquisicao.json();
                sessionStorage.setItem('dadosDengueHistoricoSantoAmaro', JSON.stringify(dado));
            } else {
                throw new Error('Erro na comunicação com a API do InfoDengue');
            }
        }

        const dadosPorAno = {};

        [...dado].reverse().forEach(semana => {
            const ano = String(semana.SE).slice(0, 4); 

            if (!dadosPorAno[ano]) {
                dadosPorAno[ano] = {
                    casosTotais: 0,
                    casosEstimados: 0,
                    umidades: [],
                    temperaturas: []
                };
            }

            dadosPorAno[ano].casosTotais += semana.casos;
            dadosPorAno[ano].casosEstimados += semana.casos_est;
            dadosPorAno[ano].umidades.push(Number(semana.umidmed));
            dadosPorAno[ano].temperaturas.push(Number(semana.tempmed));
        });

        const rotulosAnos = Object.keys(dadosPorAno);
        
        const dadosCasosAnuais = rotulosAnos.map(ano => Math.round(dadosPorAno[ano].casosEstimados));
        
        const dadosUmidadeAnual = rotulosAnos.map(ano => {
            const somaUmid = dadosPorAno[ano].umidades.reduce((acc, u) => acc + u, 0);
            return (somaUmid / dadosPorAno[ano].umidades.length).toFixed(2);
        });

        const dadosTemperaturaAnual = rotulosAnos.map(ano => {
            const somaTemp = dadosPorAno[ano].temperaturas.reduce((acc, t) => acc + t, 0);
            return (somaTemp / dadosPorAno[ano].temperaturas.length).toFixed(2);
        });

        const totalGeralCasos = dadosCasosAnuais.reduce((acc, val) => acc + val, 0);
        const anoMaisCritico = rotulosAnos[dadosCasosAnuais.indexOf(Math.max(...dadosCasosAnuais))];
        const picoDeCasos = Math.max(...dadosCasosAnuais);

        resultado.innerHTML = `
            <div class="layout-resultado">
                <div class="info-texto">
                    <h3 class="kpi-card-title">Resumo em cards da Série Histórica</h3>
                    
                    <div class="kpi-card">
                        <h4>Total Acumulado</h4>
                        <p>${totalGeralCasos.toLocaleString('pt-BR')} casos</p>
                    </div>

                    <div class="kpi-card">
                        <h4>Ano Mais Crítico</h4>
                        <p>${anoMaisCritico}</p>
                    </div>

                    <div class="kpi-card" style="grid-column: 1 / -1;">
                        <h4>Pico de Casos no Ano Crítico</h4>
                        <p>${picoDeCasos.toLocaleString('pt-BR')} casos estimados</p>
                    </div>
                </div>

                <div style="width: 100%; border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 25px; text-align: center;">
                    <h3 class="kpi-card-title" style="margin-bottom: 5px; display: inline-block; width: 100%;">Resumo Gráfico da Série Histórica</h3>
                    <p style="font-size: 0.9rem; color: #ffffff; background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; margin-bottom: 10px; display: inline-block;">Evolução anual agregada desde o início da coleta de dados.</p>
                </div>

                <div class="area-grafico">
                    <canvas id="meuGraficoSerieHistorica"></canvas>
                </div>
            </div>
        `;   
        fontedado.innerText = `Fonte: InfoDengue`;
        resultado.classList.add('sucess');

        const ctx = document.getElementById('meuGraficoSerieHistorica').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: rotulosAnos,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Temp. Média Anual (°C)',
                        data: dadosTemperaturaAnual,
                        backgroundColor: '#dc2626', 
                        yAxisID: 'y1',
                    },
                    {
                        type: 'bar', 
                        label: 'Casos Estimados (Total do Ano)',
                        data: dadosCasosAnuais, 
                        backgroundColor: '#2563eb', 
                        yAxisID: 'y'
                    },
                    {
                        type: 'bar', 
                        label: 'Umidade Média Anual (%)',
                        data: dadosUmidadeAnual,
                        backgroundColor: '#021247', 
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        align: 'start', 
                        labels: { color: 'black' } 
                    } 
                },
                scales: {
                    x: { ticks: { color: 'black' } }, 
                    y: { 
                        type: 'linear',
                        position: 'left', 
                        ticks: { color: 'black' } 
                    },
                    y1: {
                        type: 'linear',
                        position: 'right', 
                        ticks: { color: 'black' },
                        grid: { drawOnChartArea: false } 
                    }
                }
            }
        });

    } catch (error) {
        console.log(error.message);
        resultado.innerText = `Falha: ${error.message}`;
        resultado.classList.add('erro');
    }
}
