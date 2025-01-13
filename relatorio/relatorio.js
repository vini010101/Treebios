// Path: relatorio.js

// Importar prescrições
import { quartisAdultosPrescricoes } from "../prescricoes/quartisAdulto.js";
import { quartisCriancaPrescricoes } from "../prescricoes/quartisCrianca.js";
import { getPrescricoesPorFaixaEtaria } from "./relatorioProcessamento.js";

// Mapeamento de nomes exibidos para os exames
const nomesExames = {
  hemoglobina: "Hemoglobina (g/dL)",
  hemacias: "Hemácias (milhões/mm³)",
  hematocrito: "Hematócrito (%)",
  vcm: "VCM (fL)",
  hcm: "HCM (pg)",
  chcm: "CHCM (g/dL)",
  leucocitos: "Leucócitos (mil/mm³)",
  plaquetas: "Plaquetas (mil/mm³)",
  rdw: "RDW (%)",
  eosinofilos: "Eosinófilos (%)",
  monocitos: "Monócitos (%)",
};

async function saveReport() {
  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const resultados = JSON.parse(localStorage.getItem("resultadosExames"));
    const nome = localStorage.getItem("nome");
    const dataExame = localStorage.getItem("dataExame");

    if (!userData || !resultados || !nome || !dataExame) {
      throw new Error("Dados incompletos para gerar relatório");
    }

    const reportData = {
      user_id: userData.id,
      patient_name: nome,
      exam_date: dataExame,
      results: JSON.stringify(resultados),
    };

    const response = await fetch(
      "https://biosbackend.up.railway.app/api/dashboard/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
        body: JSON.stringify(reportData),
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao salvar relatório");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao salvar relatório:", error);
    throw error;
  }
}

async function generatePDF() {
  const loader = createLoader("Gerando relatório...");
  document.body.appendChild(loader);

  try {
    // Primeiro, salvar o relatório no backend
    await saveReport();

    // Prepara o conteúdo do relatório para impressão
    const containerClone = prepareContentForPrint();

    // Cria o iframe para exibir o conteúdo
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.top = "-10000px";
    printFrame.style.left = "-10000px";
    document.body.appendChild(printFrame);

    // Referência ao documento do iframe
    const printWindow = printFrame.contentWindow;
    const printDocument = printWindow.document;

    // Escreve o conteúdo HTML no iframe
    printDocument.open();
    printDocument.write(buildPrintHTML(containerClone.innerHTML));
    printDocument.close();

    // Aguarda a renderização para chamar o print
    await new Promise((resolve) => {
      printFrame.onload = resolve;
      setTimeout(resolve, 500);
    });

    // Inicia a impressão do conteúdo do iframe
    printWindow.focus();
    printWindow.print();

    // Mostrar notificação de sucesso
    showNotification("Relatório gerado e salvo com sucesso!", "success");
  } catch (error) {
    console.error("Erro:", error);
    showNotification("Erro ao gerar relatório. Tente novamente.", "error");
  } finally {
    loader.remove();
    if (printFrame) {
      document.body.removeChild(printFrame);
    }
  }
}

function getPrintStyles() {
  return `
    @page { 
      size: A4;
      @top-left { content: none; }
     @top-right { content: none; }
     @top-center { content: none; }
     @bottom-left { content: none; }
     @bottom-right { content: none; }
     @bottom-center { content: none; }
    }
    
    html, body {
      margin: 0;
      padding: 0;
      background-color: white;
    }
    
    .print-container {
      transform: scale(0.9);
      transform-origin: top center;
      width: 111.11%;  /* Compensação para escala de 90% (100/0.9) */
      margin: 0 auto;
      padding: 0;
    }
    
    .container { 
      width: 100%;
      margin: 0; 
      padding: 0; 
    }
    
    .therapeutic-guide { 
      page-break-before: always; 
    }
    
    * { 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Ajustes para diferentes navegadores */
    @-moz-document url-prefix() {
      .print-container {
        transform: scale(0.9);
        transform-origin: top center;
      }
    }

    @media print {
      body {
        zoom: 0.9;
      }
      
      @supports (-webkit-appearance:none) {
        body {
          zoom: 0.9;
          -webkit-transform: scale(0.9);
          -webkit-transform-origin: top center;
        }
      }
    }

    /* Ajustes de tamanho para elementos específicos */
    table { width: 100% !important; }
    
    .patient-info,
    .quartil-section {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .assinatura-profissional {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `;
}

// Função para mostrar notificações
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Estilizar a notificação
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 24px",
    borderRadius: "6px",
    color: "white",
    zIndex: "9999",
    animation: "slideIn 0.3s ease-out",
  });

  // Definir cor com base no tipo
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#10B981";
      break;
    case "error":
      notification.style.backgroundColor = "#EF4444";
      break;
    default:
      notification.style.backgroundColor = "#3B82F6";
  }

  document.body.appendChild(notification);

  // Remover após 3 segundos
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Prepara o conteúdo para impressão
function prepareContentForPrint() {
  const container = document.querySelector(".container").cloneNode(true);
  // Remove elementos que não devem aparecer no PDF
  container.querySelectorAll(".nav-bar, footer").forEach((el) => el.remove());

  return container;
}

// Monta o HTML completo para o iframe
function buildPrintHTML(innerContent) {
  return `
    <html>
      <head>
        <title>Relatório TreeBios</title>
        <link rel="stylesheet" href="relatorio.css">
        <style>${getPrintStyles()}</style>
      </head>
      <body style="background-color: #fff;">${innerContent}</body>
    </html>
  `;
}

// Cria um elemento de loader
function createLoader(message) {
  const loader = document.createElement("div");
  Object.assign(loader.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "20px",
    background: "#3B5998",
    color: "white",
    borderRadius: "10px",
    zIndex: "9999",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontFamily: "Arial, sans-serif",
  });

  // Adicionar spinner
  const spinner = document.createElement("div");
  Object.assign(spinner.style, {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTopColor: "white",
    animation: "spin 1s linear infinite",
  });

  // Adicionar texto
  const text = document.createElement("span");
  text.textContent = message;

  loader.appendChild(spinner);
  loader.appendChild(text);

  // Adicionar keyframes para animação do spinner
  const style = document.createElement("style");
  style.textContent = `
      @keyframes spin {
          to { transform: rotate(360deg); }
      }
      @keyframes slideIn {
          from {
              transform: translateX(100%);
              opacity: 0;
          }
          to {
              transform: translateX(0);
              opacity: 1;
          }
      }
  `;
  document.head.appendChild(style);

  return loader;
}

// Preenche a tabela com os resultados dos exames
function preencherTabela(resultados) {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  Object.entries(resultados).forEach(([exame, dados]) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${nomesExames[exame] || exame}</td>
      ${createQuartilCells(dados.quartil)}
    `;
    tabelaCorpo.appendChild(linha);
  });
}

// Cria células para os quartis
function createQuartilCells(quartil) {
  return ["Q0", "Q1", "Q2", "Q3", "Q4", "Q5"]
    .map((q) =>
      quartil === q ? `<td class="marked ${q}">X</td>` : `<td></td>`
    )
    .join("");
}

// Exibe as informações gerais do paciente
function exibirInformacoesPaciente(info) {
  const patientInfo = document.getElementById("patient-info");
  patientInfo.innerHTML = `
    <div class="info-left">
      <h3>Informações do Paciente</h3>
      <p class><span>Paciente: </span>${info.nome}</p>
      <p><span>Data exame: </span> ${info.dataExame}</p>
    </div>
    <div class="info-right">
      <h3>Informações do Avaliador</h3>
      <p><span>Avaliador: </span> ${info.nomeAvaliador}</p>
      <p><span>Telefone: </span> ${info.telefoneAvaliador}</p>
    </div>
  `;
}

function exibirNomePaciente(nome, dataExame) {
  const patientDetails = document.getElementById('patient-details-guide');
  if (patientDetails) {
    patientDetails.innerHTML = `
      <p><span>Paciente: </span>${nome}</p>
      <p><span>Data do exame: </span>${dataExame}</p>
    `;
  }
 }

// Inicializa a aplicação
document.addEventListener("DOMContentLoaded", () => {
  const resultados = JSON.parse(localStorage.getItem("resultadosExames"));
  const nome = localStorage.getItem("nome");
  const dataExame = localStorage.getItem("dataExame");
  const faixaEtaria = localStorage.getItem("faixaEtaria");
  const nomeAvaliador = localStorage.getItem("nomeAvaliador");
  const telefoneAvaliador = localStorage.getItem("telefoneAvaliador");
  const logoUrl = localStorage.getItem("logoUrl");
  if (!AuthService.isLoggedIn()) {
    window.location.href = "../login/Login.html";
    return;
  }
  if (!resultados || !nome || !dataExame || !faixaEtaria) {
    alert("Erro: Informações incompletas!");
    window.location.href = "../exames/exames.html";
    return;
  }

  const logoAssociado = document.getElementById('logo-associado');
  logoAssociado.innerHTML = `
  <img src="${logoUrl}" alt="Logo">
  `;

  // Formata as datas
  const hoje = new Date();
  const dataRelatorio = hoje.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dataExameFormatada = new Date(dataExame).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Exibe informações do paciente e avaliador
  exibirInformacoesPaciente({
    nome,
    dataExame: dataExameFormatada,
    dataRelatorio,
    nomeAvaliador,
    telefoneAvaliador,
  });

  exibirNomePaciente(nome, dataExameFormatada);

  // Exibe a tabela e as prescrições
  const prescricoes = getPrescricoesPorFaixaEtaria(
    faixaEtaria,
    quartisAdultosPrescricoes,
    quartisCriancaPrescricoes
  );
  preencherTabela(resultados);
});

window.generatePDF = generatePDF;
