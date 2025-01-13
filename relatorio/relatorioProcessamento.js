function selecionarRecomendacoesAleatorias(quartis) {
    const resultado = {};
    
    for (const [quartil, recomendacoes] of Object.entries(quartis)) {
      if (recomendacoes && recomendacoes.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * recomendacoes.length);
        resultado[quartil] = recomendacoes[indiceAleatorio];
      }
    }
    
    return resultado;
  }
  
  // Função para formatar a recomendação em HTML
  function formatarRecomendacaoHTML(recomendacao) {
    if (!recomendacao) return '';
  
    let html = `<div class="recomendacao">`;
    html += `<h3 class="recomendacao-titulo">${recomendacao.titulo}</h3>`;
  
    if (recomendacao.preparo) {
      html += `<div class="preparo">`;
      if (Array.isArray(recomendacao.preparo)) {
        html += `<p>${recomendacao.preparo.join('</p><p>')}</p>`;
      } else {
        html += `<p>${recomendacao.preparo}</p>`;
      }
      html += `</div>`;
    }
  
    if (recomendacao.objetivo) {
      html += `<div class="objetivo"> 
        <p><strong>OBJETIVO:   </strong>${recomendacao.objetivo}</p>
      </div>`;
    }
  
    if (recomendacao.sugestao) {
      html += `<div class="sugestao">
        <p><strong>SUGESTÃO:</strong>   ${recomendacao.sugestao}</p>
      </div>`;
    }
  
    if (recomendacao.componentes) {
      html += `<div class="componentes">
        <strong>COMPONENTES:</strong>`;
      
      recomendacao.componentes.forEach(comp => {
        html += `
          <div class="componente-linha">
            <span class="componente-nome">${comp.nome}</span>
            <span class="componente-linha-pontilhada"></span>
            <span class="componente-quantidade">${comp.quantidade}</span>
          </div>`;
      });
      
      html += `</div>`;
    }
  
    if (recomendacao.observacao) {
      html += `<div class="observacao">
        <p><strong>OBSERVAÇÃO:</strong>   ${recomendacao.observacao}</p>
      </div>`;
    }
  
    if (recomendacao.onde_comprar) {
      html += `<div class="onde-comprar">
        <strong>ONDE COMPRAR:</strong>
        <p>${recomendacao.onde_comprar}</p>
      </div>`;
    }
  
    html += `</div>`;
    return html;
  }
  
  // Função para atualizar o conteúdo das prescrições no DOM
  function atualizarPrescricoesDOM(prescricoes) {
    const prescricoesDiv = document.getElementById('prescricoes');
    if (!prescricoesDiv) return;
  
    let conteudoHTML = '';
    
    for (const [quartil, recomendacao] of Object.entries(prescricoes)) {
      if (recomendacao) {
        conteudoHTML += `
          <div class="quartil-section">
            ${formatarRecomendacaoHTML(recomendacao)}
          </div>`;
      }
    }
  
    prescricoesDiv.innerHTML = conteudoHTML;
  }
  
  export function processarPrescricoes(quartis) {
    const prescricoesAleatorias = selecionarRecomendacoesAleatorias(quartis);
    
    atualizarPrescricoesDOM(prescricoesAleatorias);
    
    return prescricoesAleatorias;
  }
  
  export function getPrescricoesPorFaixaEtaria(faixaEtaria, quartisAdultos, quartisCriancas) {
    const quartis = faixaEtaria === "crianca" ? quartisCriancas : quartisAdultos;
    return processarPrescricoes(quartis);
  }