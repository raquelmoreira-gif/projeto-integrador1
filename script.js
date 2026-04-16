// --- ESTADO DA APLICAÇÃO (Banco de Dados em Memória) ---
let appData = {
    estoque: [
        { id: 1, nome: "Pulseira", valor: 10.00, qtd: 20, tipo: "Consignado", artesao: "Cristiane" },
        { id: 2, nome: "Bolsa X", valor: 70.00, qtd: 5, tipo: "Próprio", artesao: "-" }
    ],
    vendas: [],
    caixa: [
        // Mock inicial para os gráficos funcionarem
        { data: getTodayDate(-3), entrada: 50, saida: 20 },
        { data: getTodayDate(-2), entrada: 80, saida: 40 },
        { data: getTodayDate(-1), entrada: 40, saida: 50 }
    ]
};

let chartInstance = null;
let currentReportType = 'semanal';

// --- UTILITÁRIOS ---
function getTodayDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- AUTENTICAÇÃO E NAVEGAÇÃO ---
function toggleAuth(type) {
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('register-card').classList.add('hidden');
    document.getElementById(`${type}-card`).classList.remove('hidden');
}

document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
    updateUI();
});

document.getElementById('form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Conta criada com sucesso! Faça login.");
    toggleAuth('login');
});

function logout() {
    document.getElementById('main-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('form-login').reset();
}

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if(viewId === 'relatorio') updateChart();
}

// --- MODAIS E CONDICIONAIS ---
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    if (modalId === 'modal-venda') carregarSelectProdutos();
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.getElementById(modalId === 'modal-venda' ? 'form-venda' : 'form-estoque').reset();
    document.getElementById('venda-id').value = '';
    document.getElementById('est-id').value = '';
    toggleArtesao(modalId === 'modal-venda' ? 'venda' : 'estoque'); // Reseta condicional
}

function toggleArtesao(context) {
    const tipo = document.getElementById(`${context === 'venda' ? 'venda' : 'est'}-tipo`).value;
    const divArtesao = document.getElementById(`div-${context === 'venda' ? 'venda' : 'est'}-artesao`);
    const inputArtesao = document.getElementById(`${context === 'venda' ? 'venda' : 'est'}-artesao`);
    
    if (tipo === 'Consignado') {
        divArtesao.classList.remove('hidden');
        inputArtesao.required = true;
    } else {
        divArtesao.classList.add('hidden');
        inputArtesao.required = false;
        inputArtesao.value = '';
    }
}

function carregarSelectProdutos() {
    const select = document.getElementById('venda-produto');
    select.innerHTML = '<option value="">Selecione um produto...</option>';
    appData.estoque.forEach(prod => {
        if (prod.qtd > 0) {
            select.innerHTML += `<option value="${prod.id}">${prod.nome} (Estoque: ${prod.qtd} | ${formatCurrency(prod.valor)})</option>`;
        }
    });
}

// --- ESTOQUE (CRUD) ---
document.getElementById('form-estoque').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('est-id').value;
    const nome = document.getElementById('est-nome').value;
    const valor = parseFloat(document.getElementById('est-valor').value);
    const qtd = parseInt(document.getElementById('est-qtd').value);
    const tipo = document.getElementById('est-tipo').value;
    const artesao = document.getElementById('est-artesao').value || '-';

    if (id) {
        // Editar
        const index = appData.estoque.findIndex(i => i.id == id);
        appData.estoque[index] = { id: parseInt(id), nome, valor, qtd, tipo, artesao };
    } else {
        // Criar
        appData.estoque.push({ id: Date.now(), nome, valor, qtd, tipo, artesao });
    }
    
    closeModal('modal-estoque');
    updateUI();
});

function editarEstoque(id) {
    const item = appData.estoque.find(i => i.id === id);
    document.getElementById('est-id').value = item.id;
    document.getElementById('est-nome').value = item.nome;
    document.getElementById('est-valor').value = item.valor;
    document.getElementById('est-qtd').value = item.qtd;
    document.getElementById('est-tipo').value = item.tipo;
    document.getElementById('est-artesao').value = item.artesao !== '-' ? item.artesao : '';
    toggleArtesao('estoque');
    document.getElementById('estoque-modal-title').innerText = "Editar Produto";
    openModal('modal-estoque');
}

function excluirEstoque(id) {
    if (confirm("Tem certeza que deseja excluir este produto do estoque?")) {
        appData.estoque = appData.estoque.filter(i => i.id !== id);
        updateUI();
    }
}

// --- VENDAS (CRUD & LÓGICA DE DESCONTO) ---
document.getElementById('form-venda').addEventListener('submit', (e) => {
    e.preventDefault();
    const idVenda = document.getElementById('venda-id').value;
    const prodId = parseInt(document.getElementById('venda-produto').value);
    const qtdVendida = parseInt(document.getElementById('venda-qtd').value);
    const tipo = document.getElementById('venda-tipo').value;
    const artesao = document.getElementById('venda-artesao').value || '-';
    
    const produtoEstoque = appData.estoque.find(p => p.id === prodId);

    if (!produtoEstoque) { alert("Produto inválido!"); return; }

    // Lógica de Novo Registro ou Edição
    if (idVenda) {
        const vendaAntiga = appData.vendas.find(v => v.id == idVenda);
        // Devolve o estoque antigo antes de aplicar o novo
        const prodOriginal = appData.estoque.find(p => p.nome === vendaAntiga.nomeProduto);
        if(prodOriginal) prodOriginal.qtd += vendaAntiga.qtd;

        if (produtoEstoque.qtd < qtdVendida) {
            alert(`Estoque insuficiente! Disponível: ${produtoEstoque.qtd}`);
            if(prodOriginal) prodOriginal.qtd -= vendaAntiga.qtd; // reverte
            return;
        }

        // Aplica nova edição
        produtoEstoque.qtd -= qtdVendida;
        const index = appData.vendas.findIndex(v => v.id == idVenda);
        appData.vendas[index] = {
            id: parseInt(idVenda),
            nomeProduto: produtoEstoque.nome,
            valorTotal: produtoEstoque.valor * qtdVendida,
            qtd: qtdVendida,
            data: getTodayDate(),
            tipo: tipo,
            artesao: artesao
        };
    } else {
        // Nova Venda
        if (produtoEstoque.qtd < qtdVendida) {
            alert(`Estoque insuficiente! Quantidade disponível: ${produtoEstoque.qtd}`);
            return;
        }
        
        // 1. DESCONTA DO ESTOQUE AUTOMATICAMENTE
        produtoEstoque.qtd -= qtdVendida;
        const valorTotal = produtoEstoque.valor * qtdVendida;

        // 2. REGISTRA A VENDA
        appData.vendas.push({
            id: Date.now(),
            nomeProduto: produtoEstoque.nome,
            valorTotal: valorTotal,
            qtd: qtdVendida,
            data: getTodayDate(),
            tipo: tipo,
            artesao: artesao
        });

        // 3. REGISTRA NO CAIXA AUTOMATICAMENTE (Entrada)
        registrarMovimentoCaixa(valorTotal, 0);
    }

    closeModal('modal-venda');
    updateUI();
});

function editarVenda(id) {
    // Edição simplificada: Preenche os dados manuais da venda
    // Na prática, a edição de venda com recálculo de estoque exige controle rígido
    const venda = appData.vendas.find(v => v.id === id);
    document.getElementById('venda-id').value = venda.id;
    document.getElementById('venda-qtd').value = venda.qtd;
    document.getElementById('venda-tipo').value = venda.tipo;
    document.getElementById('venda-artesao').value = venda.artesao !== '-' ? venda.artesao : '';
    toggleArtesao('venda');
    
    // Força a seleção do produto se ele ainda existir
    carregarSelectProdutos();
    const prod = appData.estoque.find(p => p.nome === venda.nomeProduto);
    if(prod) document.getElementById('venda-produto').value = prod.id;

    document.getElementById('venda-modal-title').innerText = "Editar Venda";
    openModal('modal-venda');
}

function excluirVenda(id) {
    if (confirm("Tem certeza que deseja excluir esta venda? O item retornará ao estoque.")) {
        const venda = appData.vendas.find(v => v.id === id);
        // Devolve ao estoque
        const prod = appData.estoque.find(p => p.nome === venda.nomeProduto);
        if (prod) prod.qtd += venda.qtd;
        
        appData.vendas = appData.vendas.filter(v => v.id !== id);
        updateUI();
    }
}

// --- CAIXA ---
function registrarCaixa() {
    const entradaVal = parseFloat(document.getElementById('caixa-entrada-val').value) || 0;
    const saidaVal = parseFloat(document.getElementById('caixa-saida-val').value) || 0;
    
    if(entradaVal === 0 && saidaVal === 0) return alert("Insira um valor.");
    
    registrarMovimentoCaixa(entradaVal, saidaVal);
    
    document.getElementById('caixa-entrada-val').value = '';
    document.getElementById('caixa-saida-val').value = '';
    updateUI();
}

function registrarMovimentoCaixa(entrada, saida) {
    const hoje = getTodayDate();
    // Verifica se já tem registro hoje para somar, ou cria novo
    let registroHoje = appData.caixa.find(c => c.data === hoje);
    if (registroHoje) {
        registroHoje.entrada += entrada;
        registroHoje.saida += saida;
    } else {
        appData.caixa.push({ data: hoje, entrada: entrada, saida: saida });
    }
    updateChart(); // Atualiza gráfico em tempo real se a aba estiver aberta
}

// --- RENDERIZAÇÃO DA INTERFACE (DOM) ---
function updateUI() {
    // Tabela Estoque
    const tbodyEstoque = document.getElementById('tbody-estoque');
    tbodyEstoque.innerHTML = '';
    appData.estoque.forEach(item => {
        tbodyEstoque.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${formatCurrency(item.valor)}</td>
                <td>${item.qtd}</td>
                <td>${item.tipo}</td>
                <td>${item.artesao}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editarEstoque(${item.id})">Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirEstoque(${item.id})">Excluir</button>
                </td>
            </tr>
        `;
    });

    // Tabela Vendas
    const tbodyVendas = document.getElementById('tbody-vendas');
    tbodyVendas.innerHTML = '';
    appData.vendas.forEach(venda => {
        tbodyVendas.innerHTML += `
            <tr>
                <td>${venda.nomeProduto}</td>
                <td>${formatCurrency(venda.valorTotal)}</td>
                <td>${venda.qtd}</td>
                <td>${venda.data}</td>
                <td>${venda.tipo}</td>
                <td>${venda.artesao}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editarVenda(${venda.id})">Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirVenda(${venda.id})">Excluir</button>
                </td>
            </tr>
        `;
    });

    // Tabela Caixa
    const tbodyCaixa = document.getElementById('tbody-caixa');
    tbodyCaixa.innerHTML = '';
    // Ordenar por data mais recente
    const caixaOrdenado = [...appData.caixa].reverse();
    caixaOrdenado.forEach(c => {
        const saldo = c.entrada - c.saida;
        tbodyCaixa.innerHTML += `
            <tr>
                <td>${c.data}</td>
                <td style="color: green;">${formatCurrency(c.entrada)}</td>
                <td style="color: red;">${formatCurrency(c.saida)}</td>
                <td style="font-weight:bold; color: ${saldo >= 0 ? 'green' : 'red'};">${formatCurrency(saldo)}</td>
            </tr>
        `;
    });
}

// --- GRÁFICOS (RELATÓRIO) ---
function setReportType(type) {
    currentReportType = type;
    document.getElementById('btn-rep-semanal').classList.remove('active');
    document.getElementById('btn-rep-mensal').classList.remove('active');
    document.getElementById(`btn-rep-${type}`).classList.add('active');
    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('financeChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    let labels = [];
    let dataEntrada = [];
    let dataSaida = [];

    if (currentReportType === 'semanal') {
        // Pega os últimos 7 dias registrados no caixa
        const ultimosDias = appData.caixa.slice(-7);
        labels = ultimosDias.map(c => c.data.substring(0, 5)); // Ex: "15/04"
        dataEntrada = ultimosDias.map(c => c.entrada);
        dataSaida = ultimosDias.map(c => c.saida);
    } else {
        // Lógica simples para Mensal (Agrupando para exemplo Sem1, Sem2, etc)
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        // Mock simplificado para visualização mensal
        const totalEntrada = appData.caixa.reduce((acc, curr) => acc + curr.entrada, 0);
        const totalSaida = appData.caixa.reduce((acc, curr) => acc + curr.saida, 0);
        dataEntrada = [totalEntrada*0.2, totalEntrada*0.4, totalEntrada*0.1, totalEntrada*0.3];
        dataSaida = [totalSaida*0.1, totalSaida*0.5, totalSaida*0.2, totalSaida*0.2];
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [
                {
                    label: 'Entrada',
                    data: dataEntrada.length ? dataEntrada : [0],
                    borderColor: '#a8f0c6',
                    backgroundColor: 'rgba(168, 240, 198, 0.5)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Saída',
                    data: dataSaida.length ? dataSaida : [0],
                    borderColor: '#ffc2c2',
                    backgroundColor: 'rgba(255, 194, 194, 0.5)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Inicializa a UI
updateUI();