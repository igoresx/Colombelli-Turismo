let passeios = JSON.parse(localStorage.getItem("passeios")) || [];
let roteiro = [];
let roteirosSalvos = JSON.parse(localStorage.getItem("roteirosSalvos")) || [];

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

function carregarPasseios() {
  selectPasseios.innerHTML = `<option value="">Selecione um passeio</option>`;
  passeios.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = i; opt.textContent = `${p.nome} — R$ ${p.valor.toFixed(2)}`;
    selectPasseios.appendChild(opt);
  });
}

function adicionarPasseio() {
  const i = selectPasseios.value;
  const qtd = parseInt(qtdPessoas.value);
  const data = dataPasseio.value;
  const periodo = periodoPasseio.value;
  if (i === "" || !data || !periodo || qtd <= 0) { alert("Preencha todos os campos."); return; }

  const passeio = passeios[i];
  roteiro.push({ nome: passeio.nome, data, periodo, qtd, total: passeio.valor * qtd });
  atualizarLista();
}

function atualizarLista() {
  listaRoteiro.innerHTML = "";
  roteiro.forEach(i => {
    const li = document.createElement("li");
    li.textContent = `${i.data} | ${i.nome} | ${i.periodo} — ${i.qtd} pessoa(s) — R$ ${i.total.toFixed(2)}`;
    listaRoteiro.appendChild(li);
  });
  calcularTotais();
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



















