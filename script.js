let passeios = JSON.parse(localStorage.getItem("passeios")) || [];
let roteiro = [];
let roteirosSalvos = JSON.parse(localStorage.getItem("roteirosSalvos")) || [];
let passeiosOS = [];

function salvarPasseio() {
  const nome = nomePasseio.value.trim();
  const valor = parseFloat(valorPasseio.value);
  if (!nome || isNaN(valor) || valor <= 0) { alert("Informe corretamente o passeio e o valor."); return; }

  passeios.push({ nome, valor });
  localStorage.setItem("passeios", JSON.stringify(passeios));
  nomePasseio.value = ""; valorPasseio.value = "";
  carregarPasseios();
}

function apagarPasseio() {
  const index = selectPasseios.value;
  if (index === "") { alert("Selecione um passeio."); return; }
  const nome = passeios[index].nome;
  if (!confirm(`Excluir o passeio "${nome}"?`)) return;
  passeios.splice(index, 1);
  localStorage.setItem("passeios", JSON.stringify(passeios));
  roteiro = roteiro.filter(p => p.nome !== nome);
  carregarPasseios(); atualizarLista();
  
}

function carregarPasseiosOS() {
  const tbody = document.getElementById("tabelaPasseiosOS");
  if (!tbody) {
    console.warn("tabelaPasseiosOS não encontrada");
    return;
  }

  tbody.innerHTML = "";

  if (!passeios.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" style="text-align:center; color:#777">
          Nenhum passeio cadastrado
        </td>
      </tr>
    `;
    return;
  }

  passeios.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td style="text-align:center">
        <input type="checkbox" class="os-passeio" value="${p.nome}">
      </td>
      <td>${p.nome}</td>
    `;

    tbody.appendChild(tr);
  });
}


function adicionarPasseioOS() {
  const nome = document.getElementById("osNomePasseio").value.trim();
  const periodo = document.getElementById("osPeriodoPasseio").value;

  if (!nome || !periodo) {
    alert("Informe o nome do passeio e o turno.");
    return;
  }

  passeiosOS.push({ nome, periodo });

  document.getElementById("osNomePasseio").value = "";
  document.getElementById("osPeriodoPasseio").value = "";

  atualizarPasseiosOS();
}


function atualizarLista() {
  listaRoteiro.innerHTML = "";
  roteiro.forEach(i => {
    const li = document.createElement("li");
    li.textContent = `${i.data} | ${i.nome} | ${i.periodo} — ${i.qtd} pessoa(s) — R$ ${i.total.toFixed(2)}`;
    listaRoteiro.appendChild(li);
  });
  calcularTotais();
  carregarPasseiosOS();
}

function calcularTotais() {
  const subtotal = roteiro.reduce((s, i) => s + i.total, 0);
  const perc = parseFloat(descontoPercentual.value) || 0;
  const val = parseFloat(descontoValor.value) || 0;
  let desconto = subtotal * perc / 100 + val;
  if (desconto > subtotal) desconto = subtotal;
  totalFinal.textContent = (subtotal - desconto).toFixed(2);
}

function salvarRoteiro() {
  if (!roteiro.length) { alert("Nenhum passeio no roteiro."); return; }
  const passageiro = nomePassageiro.value.trim();
  if (!passageiro) { alert("Informe o passageiro."); return; }

  roteirosSalvos.push({
    passageiro,
    dataCriacao: new Date().toLocaleString(),
    itens: roteiro,
    total: totalFinal.textContent
  });

  localStorage.setItem("roteirosSalvos", JSON.stringify(roteirosSalvos));
  roteiro = []; nomePassageiro.value = ""; atualizarLista(); listarRoteiros();
  alert("Roteiro salvo!");
}

function listarRoteiros() {
  listaRoteirosSalvos.innerHTML = "";
  if (!roteirosSalvos.length) { listaRoteirosSalvos.innerHTML = "<li>Nenhum roteiro salvo.</li>"; return; }

  roteirosSalvos.forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${r.passageiro}</strong><br>
      ${r.dataCriacao}<br>
      Valor total: R$ ${r.total}<br><br>
      <button onclick="verDetalhesRoteiro(${i})">Ver</button>
      <button onclick="exportarPDF(${i})">PDF</button>
      <button onclick="excluirRoteiro(${i})" style="background:#e53935">Excluir</button>
    `;
    listaRoteirosSalvos.appendChild(li);
  });
}

function verDetalhesRoteiro(i) {
  const r = roteirosSalvos[i];
  let txt = `Passageiro: ${r.passageiro}\n\n`;
  r.itens.forEach(p => { txt += `${p.data} | ${p.nome} | ${p.periodo} — R$ ${p.total}\n`; });
  txt += `\nValor total: R$ ${r.total}`; alert(txt);
}

function excluirRoteiro(i) {
  if (!confirm("Excluir este roteiro?")) return;
  roteirosSalvos.splice(i, 1);
  localStorage.setItem("roteirosSalvos", JSON.stringify(roteirosSalvos));
  listarRoteiros();
}

// PDF
function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function textoNegrito(doc, texto, x, y, options = {}) {
  doc.text(texto, x, y, options);
  doc.text(texto, x + 0.3, y, options);
}

function exportarPDF(index) {
  const doc = new jspdf.jsPDF("p", "mm", "a4");
  const r = roteirosSalvos[index];

  let y = 20;

  /* =========================
     LOGO (JPG local)
  ========================= */
  const img = document.getElementById("logoColombelli");
if (img && img.src) {
  const larguraLogo = 40;
  const proporcao = img.height / img.width;
  const alturaLogo = larguraLogo * proporcao;
  doc.addImage(img, "JPEG", 20, y, larguraLogo, alturaLogo);
}


  /* =========================
     TÍTULO
  ========================= */
  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ROTEIRO", 105, y, { align: "center" });

  y += 6;
  doc.setDrawColor(25, 169, 116);
  doc.setLineWidth(0.6);
  doc.line(20, y, 190, y);

  /* =========================
     PASSAGEIRO
  ========================= */
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Passageiro: ${r.passageiro}`, 20, y);

  /* =========================
     TABELA — CABEÇALHO
  ========================= */
  y += 10;
  doc.setFillColor(25, 169, 116);
  doc.rect(20, y - 6, 170, 8, "F");

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("Data", 30, y, { align: "center" });
  doc.text("Passeio", 55, y);
  doc.text("Período", 120, y, { align: "center" });
  doc.text("Pessoas", 145, y, { align: "center" });
  doc.text("Valor (R$)", 170, y, { align: "center" });

  /* =========================
     TABELA — LINHAS
  ========================= */
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  r.itens.forEach((item, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    if (i % 2 === 0) {
      doc.setFillColor(245);
      doc.rect(20, y - 5, 170, 7, "F");
    }

    doc.text(formatarDataBR(item.data), 30, y, { align: "center" });
    doc.text(item.nome, 55, y);
    doc.text(item.periodo, 120, y, { align: "center" });
    doc.text(String(item.qtd), 145, y, { align: "center" });
    doc.text(item.total.toFixed(2), 170, y, { align: "right" });

    y += 7;
  });

  /* =========================
   TOTAIS (CONDICIONAIS)
========================= */
const subtotal = r.itens.reduce((s, i) => s + i.total, 0);

const perc = parseFloat(descontoPercentual.value) || 0;
const val = parseFloat(descontoValor.value) || 0;

let desconto = subtotal * perc / 100 + val;
if (desconto > subtotal) desconto = subtotal;

const totalFinal = subtotal - desconto;

const xValor = 170;
y += 8;

doc.setFont("helvetica", "bold");
doc.setFontSize(12);

// 🔹 Só mostra Subtotal e Desconto se houver desconto
if (desconto > 0) {
  doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, xValor, y, { align: "right" });

  y += 6;
  doc.text(`Desconto: R$ ${desconto.toFixed(2)}`, xValor, y, { align: "right" });

  y += 6;
}

// 🔹 Valor final sempre aparece
doc.text(`Valor Total: R$ ${totalFinal.toFixed(2)}`, xValor, y, { align: "right" });

  /* =========================
     RODAPÉ
  ========================= */
  doc.setFontSize(11);
  doc.setTextColor(25, 169, 116);
  doc.text(
    "Colombelli Turismo, você é o nosso destino.",
    105,
    288,
    { align: "center" }
  );

  doc.save(`Roteiro_${r.passageiro}.pdf`);
}
/* =========================
   INICIALIZAÇÃO
========================= */
document.addEventListener("DOMContentLoaded", () => {
  carregarPasseios();
  listarRoteiros();
});

/* =========================
   ORDEM DE SERVIÇO
========================= */
function adicionarPassageiroOS() {
  const tbody = document.getElementById("tabelaPassageirosOS");

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="text" placeholder="Nome"></td>
    <td><input type="text" placeholder="CPF"></td>
    <td><input type="date"></td>
    <td>
      <button 
        type="button" 
        style="background:#e53935; color:#fff; padding:6px 10px; border-radius:6px;"
        onclick="excluirPassageiroOS(this)">
        Excluir
      </button>
    </td>
  `;

  tbody.appendChild(tr);
}

function excluirPassageiroOS(botao) {
  const linha = botao.closest("tr");
  if (!linha) return;

  if (confirm("Deseja excluir este passageiro?")) {
    linha.remove();
  }
}


function carregarPasseiosOrdemServico() {
  const container = document.getElementById("listaPasseiosOS");
  if (!container) return;

  container.innerHTML = "";

  // Usa os passeios já salvos no site
  const passeiosSalvos = JSON.parse(localStorage.getItem("passeios")) || [];

  if (passeiosSalvos.length === 0) {
    container.innerHTML = "<p>Nenhum passeio cadastrado.</p>";
    return;
  }

  passeiosSalvos.forEach((passeio, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "6px";

    div.innerHTML = `
      <label style="display:flex; align-items:center; gap:8px">
        <input type="checkbox" class="passeio-os" value="${passeio.nome}">
        ${passeio.nome}
      </label>
    `;

    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarPasseiosOrdemServico();
});



function gerarOrdemServico() {
  if (!passeiosOS.length) {
    alert("Adicione ao menos um passeio.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  let y = 20;
  const linha = 7;

  // LOGO
  const img = document.getElementById("logoColombelli");
  if (img && img.src) {
    const w = 40;
    const h = (img.height / img.width) * w;
    doc.addImage(img, "JPEG", 20, y, w, h);
  }

  // TÍTULO
y += 30;
doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("ORDEM DE SERVIÇO", 105, y, { align: "center" });

// espaçamento correto após o título
y += 12;

doc.setFontSize(11);
doc.setFont("helvetica", "normal");

// DADOS DO SERVIÇO (UM EMBAIXO DO OUTRO)
doc.text(
  `Data do Serviço: ${formatarDataBR(osData.value) || "-"}`,
  15,
  y
);
y += 6;

doc.text(`Guia: ${osGuia.value || "-"}`, 15, y);
y += 6;

doc.text(`Veículo: ${osVeiculo.value || "-"}`, 15, y);
y += 6;

doc.text(`Hotel: ${osHotel.value || "-"}`, 15, y);
y += 6;

doc.text(`Contato do Titular: ${osContato.value || "-"}`, 15, y);
y += 8;


/* =========================
   PASSAGEIROS
========================= */
const passageirosOS = obterPassageirosOS();

y += 10;
doc.setFont("helvetica", "bold");
doc.text("PASSAGEIROS", 15, y);
y += 6;

// Cabeçalho verde (igual roteiro)
doc.setFillColor(25, 169, 116);
doc.rect(15, y - 5, 180, 8, "F");

doc.setFontSize(11);
doc.setTextColor(255);
doc.text("Nome", 18, y);
doc.text("CPF", 110, y);
doc.text("Nascimento", 160, y);

y += 6;
doc.setFont("helvetica", "normal");
doc.setTextColor(0);

if (!passageirosOS.length) {
  doc.text("Nenhum passageiro informado.", 18, y);
  y += 6;
} else {
  passageirosOS.forEach((p, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // zebra
    if (i % 2 === 0) {
      doc.setFillColor(245);
      doc.rect(15, y - 5, 180, 7, "F");
    }

    doc.text(p.nome, 18, y);
    doc.text(p.cpf || "-", 110, y);
    doc.text(p.nascimento || "-", 160, y);

    y += 7;
  });
}


 /* =========================
   PASSEIOS DO SERVIÇO
========================= */
y += 10;
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.setTextColor(0);
doc.text("PASSEIOS", 15, y);
y += 6;

// Cabeçalho verde
doc.setFillColor(25, 169, 116);
doc.rect(15, y - 5, 180, 8, "F");

doc.setTextColor(255);
doc.text("Passeio", 18, y);
doc.text("Turno", 160, y);

y += 6;
doc.setFont("helvetica", "normal");
doc.setTextColor(0);

if (!passeiosOS.length) {
  doc.text("Nenhum passeio informado.", 18, y);
  y += 6;
} else {
  passeiosOS.forEach((p, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // zebra
    if (i % 2 === 0) {
      doc.setFillColor(245);
      doc.rect(15, y - 5, 180, 7, "F");
    }

    doc.text(p.nome, 18, y);
    doc.text(p.periodo || "-", 160, y);

    y += 7;
  });
}


 

  // RODAPÉ
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text(
    "Colombelli Turismo • Você é o nosso destino",
    105,
    285,
    { align: "center" }
  );

  doc.save("Ordem_de_Servico.pdf");
}



function getPassageirosOS() {
  const tbody = document.getElementById("tabelaPassageirosOS");
  const passageiros = [];

  if (!tbody) return passageiros;

  const linhas = tbody.querySelectorAll("tr");

  linhas.forEach(tr => {
    const nomeInput = tr.querySelector("input[type='text']");
    const cpfInput = tr.querySelectorAll("input[type='text']")[1];
    const dataInput = tr.querySelector("input[type='date']");

    if (!nomeInput) return;

    const nome = nomeInput.value.trim();
    const cpf = cpfInput ? cpfInput.value.trim() : "";
    const nascimento = dataInput ? dataInput.value : "";

    if (nome !== "") {
      passageiros.push({
        nome,
        cpf,
        nascimento
      });
    }
  });

  return passageiros;
}

function atualizarPasseiosOS() {
  const tbody = document.getElementById("tabelaPasseiosOS");
  if (!tbody) return;

  tbody.innerHTML = "";

  passeiosOS.forEach((p, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.periodo}</td>
      <td>
        <button 
          type="button"
          style="background:#e53935; color:#fff"
          onclick="excluirPasseioOS(${i})">
          Excluir
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function obterPassageirosOS() {
  const linhas = document.querySelectorAll("#tabelaPassageirosOS tr");
  const passageiros = [];

  linhas.forEach(tr => {
    const inputs = tr.querySelectorAll("input");
    if (inputs.length >= 3) {
      const nome = inputs[0].value.trim();
      const cpf = inputs[1].value.trim();
      const nascimento = inputs[2].value;

      if (nome) {
        passageiros.push({
          nome,
          cpf,
          nascimento: formatarDataBR(nascimento)
        });
      }
    }
  });

  return passageiros;
}


function visualizarOrdemServico() {
  document.getElementById("previewOS").style.display = "block";



 // =========================
// DADOS DO SERVIÇO
// =========================
y += 15; // <<< ESSA LINHA É O QUE ESTAVA FALTANDO

doc.setFont("helvetica", "normal");
doc.setFontSize(11);

// LINHA 1
doc.text(`Data do Serviço: ${formatarDataBR(osData.value)}`, 15, y);
doc.text(`Guia: ${osGuia.value || "-"}`, 110, y);
y += 8;

// LINHA 2
doc.text(`Veículo: ${osVeiculo.value || "-"}`, 15, y);
doc.text(`Hotel: ${osHotel.value || "-"}`, 110, y);
y += 8;

// LINHA 3
doc.text(`Contato do Titular: ${osContato.value || "-"}`, 15, y);
y += 10;



  /* =========================
     PASSAGEIROS
  ========================= */
  prevPassageiros.innerHTML = "";

  const linhas = document.querySelectorAll("#tabelaPassageirosOS tr");

  linhas.forEach(linha => {
    const inputs = linha.querySelectorAll("input");
    if (!inputs.length) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${inputs[0].value || "-"}</td>
      <td>${inputs[1].value || "-"}</td>
      <td>${formatarDataBR(inputs[2].value)}</td>
    `;
    prevPassageiros.appendChild(tr);
  });

  /* =========================
     PASSEIOS
  ========================= */
  prevPasseios.innerHTML = "";

  passeiosOS.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.periodo}</td>
    `;
    prevPasseios.appendChild(tr);
  });

  // rolar até a prévia
  previewOS.scrollIntoView({ behavior: "smooth" });
}


function excluirPasseioOS(index) {
  if (!confirm("Excluir este passeio da Ordem de Serviço?")) return;
  passeiosOS.splice(index, 1);
  atualizarPasseiosOS();
}















