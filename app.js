(function () {
  "use strict";

  var APP_VERSION = "v25-fixes-logo-moeda-layout";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function showBootError(err) {
    try {
      var box = document.getElementById("bootError");
      var txt = document.getElementById("bootErrorText");
      var btn = document.getElementById("btnBootReload");
      if (btn) btn.onclick = function(){ location.reload(); };
      if (txt) txt.textContent = String(err && err.stack ? err.stack : err);
      if (box) box.style.display = "block";
    } catch(e) {}
  }

  window.onerror = function (msg, src, line, col, error) {
    showBootError((error && error.stack) ? error.stack : (msg + " @ " + line + ":" + col));
    return false;
  };

  var state = {
    items: [],
    totalGeral: 0,
    lastPdfBlob: null,
    lastPdfFilename: "Orcamento.pdf"
  };

  var SERVICOS_PRE = [
    { nome: "Selecione um serviço...", desc: "", qtd: 1 },
    { nome: "Instalação Split 9.000 a 12.000 BTU", desc: "Instalação Split 9.000 a 12.000 BTU ", qtd: 1 },
    { nome: "Instalação Split 18.000 a 24000 BTU", desc: "Instalação Split 18.000 a 24000 BTU", qtd: 1 },
    { nome: "Limpeza e e higienização", desc: "Limpeza preventiva / higienização de Split", qtd: 1 },
    { nome: "Visita Técnica p/ Diagnostico", desc: "Visita Técnica p/ Diagnostico", qtd: 1 },
    { nome: "Teste de estanqueidade com Nitrogenio", desc: "Teste de estanqueidade com Nitrogenio", qtd: 1 },
    { nome: "Aplicaçao de Vacuo no Sistema", desc: "Aplicaçao de Vacuo no Sistema", qtd: 1 },
    { nome: "Recarga de gás + teste de pressão", desc: "Recarga de gás + teste de pressão", qtd: 1 },
    { nome: "Reparo em Componente Eletronico", desc: "Reparo em Componente Eletronico", qtd: 1 }
  ];

  var dom = {
    cliente: function(){ return qs("#cliente"); },
    telefone: function(){ return qs("#telefoneCliente"); },
    endereco: function(){ return qs("#enderecoCliente"); },
    pagamento: function(){ return qs("#pagamento"); },
    observacoes: function(){ return qs("#observacoes"); },

    servicoPronto: function(){ return qs("#servicoPronto"); },
    btnAplicarServico: function(){ return qs("#btnAplicarServico"); },

    addForm: function(){ return qs("#addForm"); },

    descricao: function(){ return qs("#descricao"); },
    quantidade: function(){ return qs("#quantidade"); },
    valorUnitario: function(){ return qs("#valorUnitario"); },
    descontoServico: function(){ return qs("#descontoServico"); },
    btnAddServico: function(){ return qs("#btnAddServico"); },

    tabelaBody: function(){ return qs("#tabela tbody"); },
    itensCards: function(){ return qs("#itensCards"); },
    totalSpan: function(){ return qs("#total"); },

    btnGerarPDF: function(){ return qs("#btnGerarPDF"); },
    shareArea: function(){ return qs("#shareArea"); },
    btnShare: function(){ return qs("#btnShare"); },
    btnWhatsAppFallback: function(){ return qs("#btnWhatsAppFallback"); },

    jsStatus: function(){ return qs("#jsStatus"); },
    appVersion: function(){ return qs("#appVersion"); }
  };

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(4);
  }

  function isMobile() {
    try { return window.matchMedia && window.matchMedia("(max-width: 768px)").matches; } catch(e) { return false; }
  }

  function onlyDigits(s){ return String(s || "").replace(/\D/g, ""); }

  function formatMoedaFromDigits(digits){
    digits = onlyDigits(digits);
    if (!digits) digits = "0";
    while (digits.length < 3) digits = "0" + digits;
    var cent = digits.slice(-2);
    var intp = digits.slice(0, -2);
    var out = "";
    while (intp.length > 3) {
      out = "." + intp.slice(-3) + out;
      intp = intp.slice(0, -3);
    }
    out = intp + out;
    return out + "," + cent;
  }

  function moedaToNumber(m){
    m = String(m || "0").replace(/\./g, "").replace(",", ".");
    var n = parseFloat(m);
    return isNaN(n) ? 0 : n;
  }

  function fmtBR(n){
    try {
      return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch(e){
      var s = (Math.round((Number(n)||0)*100)/100).toFixed(2);
      return s.replace(".", ",");
    }
  }

  function attachCurrencyMask(el, opts){
    if (!el) return;
    var def = (opts && opts.defaultValue) ? opts.defaultValue : "0,00";
    var digits = "";

    function setFromDigits(d){
      digits = onlyDigits(d);
      if (!digits) digits = "0";
      el.value = formatMoedaFromDigits(digits);
      try { el.setAttribute("data-digits", digits); } catch(e){}
    }

    // inicia
    setFromDigits(el.value || def);

    el.addEventListener("keydown", function(ev){
      ev = ev || window.event;
      var k = ev.key;

      if (k === "Tab" || k === "ArrowLeft" || k === "ArrowRight" || k === "Home" || k === "End") return;

      if (k === "Backspace") {
        if (ev.preventDefault) ev.preventDefault();
        else ev.returnValue = false;

        digits = onlyDigits(el.getAttribute("data-digits") || digits);
        digits = digits.slice(0, -1);
        if (!digits) digits = "0";
        setFromDigits(digits);
        return;
      }

      if (k === "Delete") {
        if (ev.preventDefault) ev.preventDefault();
        else ev.returnValue = false;
        setFromDigits("0");
        return;
      }

      if (k && k.length === 1 && k >= "0" && k <= "9") {
        if (ev.preventDefault) ev.preventDefault();
        else ev.returnValue = false;

        digits = onlyDigits(el.getAttribute("data-digits") || digits);
        if (digits === "0") digits = "";
        digits += k;
        setFromDigits(digits);
        return;
      }

      if (ev.preventDefault) ev.preventDefault();
      else ev.returnValue = false;
    });

    el.addEventListener("paste", function(ev){
      ev = ev || window.event;
      if (ev.preventDefault) ev.preventDefault();
      var text = "";
      try { text = (ev.clipboardData || window.clipboardData).getData("text"); } catch(e){}
      setFromDigits(text);
    });

    el.addEventListener("focus", function(){
      if (!el.value) setFromDigits(def);
      try { el.select(); } catch(e){}
    });

    el.addEventListener("input", function(){
      setFromDigits(el.value);
    });
  }


  function recalcTotal(){
    var total = 0;
    for (var i=0;i<state.items.length;i++){
      var it = state.items[i];
      var bruto = it.qtd * it.unit;
      var liquido = bruto - it.desconto;
      if (liquido < 0) liquido = 0;
      total += liquido;
    }
    state.totalGeral = total;
    var span = dom.totalSpan();
    if (span) span.textContent = (Math.round(total*100)/100).toFixed(2);
  }

  function renderTable(){
    var tbody = dom.tabelaBody();
    if (!tbody) return;
    tbody.innerHTML = "";
    for (var i=0;i<state.items.length;i++){
      var it = state.items[i];
      var bruto = it.qtd * it.unit;
      var liquido = bruto - it.desconto;
      if (liquido < 0) liquido = 0;

      var tr = document.createElement("tr");

      var td0 = document.createElement("td");
      td0.className = "desc";
      td0.textContent = it.desc;
      tr.appendChild(td0);

      var td1 = document.createElement("td"); td1.textContent = String(it.qtd); tr.appendChild(td1);
      var td2 = document.createElement("td"); td2.textContent = (Math.round(it.unit*100)/100).toFixed(2); tr.appendChild(td2);
      var td3 = document.createElement("td"); td3.textContent = (Math.round(bruto*100)/100).toFixed(2); tr.appendChild(td3);
      var td4 = document.createElement("td"); td4.textContent = (Math.round(it.desconto*100)/100).toFixed(2); tr.appendChild(td4);
      var td5 = document.createElement("td"); td5.textContent = (Math.round(liquido*100)/100).toFixed(2); tr.appendChild(td5);

      var td6 = document.createElement("td");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-remove";
      btn.textContent = "Remover";
      btn.setAttribute("data-del", it.id);
      td6.appendChild(btn);
      tr.appendChild(td6);

      tbody.appendChild(tr);
    }
  }

  function escapeHtml(s){
    s = String(s || "");
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function renderCards(){
    var box = dom.itensCards();
    if (!box) return;
    if (!isMobile()) { box.innerHTML = ""; return; }

    var html = "";
    for (var i=0;i<state.items.length;i++){
      var it = state.items[i];
      var bruto = it.qtd * it.unit;
      var liquido = bruto - it.desconto;
      if (liquido < 0) liquido = 0;

      html += ''
        + '<div class="card" style="margin:10px 0;">'
        +   '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">'
        +     '<b style="flex:1;">'+ escapeHtml(it.desc) +'</b>'
        +     '<button type="button" class="btn-remove" data-del="'+ it.id +'" style="width:auto;">X</button>'
        +   '</div>'
        +   '<div style="margin-top:6px;font-size:14px;">Qtd: <b>'+ it.qtd +'</b> · Unit: <b>R$ '+ fmtBR(it.unit) +'</b></div>'
        +   '<div style="margin-top:6px;font-size:14px;">Desc: <b>R$ '+ fmtBR(it.desconto) +'</b> · Líquido: <b>R$ '+ fmtBR(liquido) +'</b></div>'
        + '</div>';
    }
    if (!html) html = '<div class="muted">Nenhum item ainda.</div>';
    box.innerHTML = html;
  }

  function recalcAndRender(){
    recalcTotal();
    renderTable();
    renderCards();
  }

  function addServicoFromForm(){
    var desc = (dom.descricao().value || "").trim();
    var qtd = parseInt(dom.quantidade().value, 10);
    if (!qtd || qtd < 1) qtd = 1;

    var unit = moedaToNumber(dom.valorUnitario().value);
    var desconto = moedaToNumber(dom.descontoServico().value);

    if (!desc) { alert("Preencha a descrição."); return; }

    state.items.push({ id: uid(), desc: desc, qtd: qtd, unit: unit, desconto: desconto });

    dom.descricao().value = "";
    dom.quantidade().value = "1";
    dom.valorUnitario().value = "0,00";
    dom.descontoServico().value = "0,00";

    recalcAndRender();
  }

  function aplicarServicoPronto(){
    var sel = dom.servicoPronto();
    if (!sel) return;
    var idx = parseInt(sel.value, 10);
    if (isNaN(idx) || idx <= 0) { alert("Selecione um serviço."); return; }
    var s = SERVICOS_PRE[idx];

    dom.descricao().value = s.desc || "";
    dom.quantidade().value = String(s.qtd || 1);

    var form = dom.addForm();
    if (form && isMobile()) form.classList.add("open");

    try { dom.valorUnitario().focus(); } catch(e) {}
  }
  }

  function gerarPdf(){
    if (!state.items.length) { alert("Adicione pelo menos um serviço."); return; }
    if (!(window.jspdf && window.jspdf.jsPDF)) { alert("jsPDF não carregou."); return; }

    var logoEl = document.getElementById("logoPdf");

    loadImageAsDataURL(logoEl, function(logoData){
      try {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ unit:"mm", format:"a4" });
        var margin = 15;
        var pageW = doc.internal.pageSize.getWidth();
        var y = 18;

        if (logoData) {
          try {
            doc.addImage(logoData, "PNG", margin, 10, 30, 30);
            y = 46;
          } catch(eImg) {}
        }

        doc.setFont("helvetica","bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 119, 204);
        doc.text("PROPOSTA COMERCIAL", margin, y);
        y += 10;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);

        var cliente = (dom.cliente().value || "").trim();
        var tel = (dom.telefone().value || "").trim();
        var end = (dom.endereco().value || "").trim();
        var pag = (dom.pagamento().value || "").trim();
        var obs = (dom.observacoes().value || "").trim();

        if (cliente) { doc.text("Cliente: " + cliente, margin, y); y += 6; }
        if (tel) { doc.text("Telefone: " + tel, margin, y); y += 6; }
        if (end) { doc.text("Endereço: " + end, margin, y); y += 6; }
        if (pag) { doc.text("Pagamento: " + pag, margin, y); y += 6; }
        y += 4;

        var head = [["Descrição", "Qtd", "Unit (R$)", "Desc (R$)", "Líquido (R$)"]];
        var body = [];
        for (var i=0;i<state.items.length;i++){
          var it = state.items[i];
          var bruto = it.qtd * it.unit;
          var liquido = bruto - it.desconto;
          if (liquido < 0) liquido = 0;
          body.push([ it.desc, String(it.qtd), fmtBR(it.unit), fmtBR(it.desconto), fmtBR(liquido) ]);
        }

        try {
          doc.autoTable({
            startY: y,
            head: head,
            body: body,
            styles: { font: "helvetica", fontSize: 10 },
            headStyles: { fillColor: [210,225,245], textColor: 20 },
            margin: { left: margin, right: margin }
          });
          y = doc.lastAutoTable.finalY + 8;
        } catch(e){
          doc.text("Itens:", margin, y); y += 6;
          for (var j=0;j<body.length;j++){
            doc.text("- " + body[j][0] + " (Qtd " + body[j][1] + ")", margin, y);
            y += 6;
          }
        }

        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text("Total: R$ " + fmtBR(state.totalGeral), margin, y);
        y += 8;

        if (obs) {
          doc.setFont("helvetica","normal");
          doc.setFontSize(10);
          doc.setTextColor(90,90,90);
          var linhas = doc.splitTextToSize("Obs: " + obs, pageW - (margin*2));
          doc.text(linhas, margin, y);
        }

        var nomeArq = "Orcamento_" + (cliente ? cliente.replace(/[^\w\-]+/g,"_") : "Cliente") + ".pdf";
        state.lastPdfFilename = nomeArq;
        try { state.lastPdfBlob = doc.output("blob"); } catch(e2) { state.lastPdfBlob = null; }

        doc.save(nomeArq);

        var sa = dom.shareArea();
        if (sa) sa.style.display = "block";
      } catch(err) {
        showBootError(err);
      }
    });
  }

  function sharePdf(){
    if (!state.lastPdfBlob) { alert("Gere o PDF antes de compartilhar."); return; }

    var file;
    try { file = new File([state.lastPdfBlob], state.lastPdfFilename, { type:"application/pdf" }); } catch(e){ file = null; }

    if (navigator.share && file) {
      navigator.share({ files:[file], title:"Orçamento", text:"Segue o orçamento em PDF." })["catch"](function(){});
      return;
    }
    openWhatsAppFallback();
  }

  function openWhatsAppFallback(){
    var msg = "Olá! Segue o orçamento.";
    var url = "https://wa.me/?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
  }

  function popularServicosProntos(){
    var sel = dom.servicoPronto();
    if (!sel) return;
    sel.innerHTML = "";
    for (var i=0;i<SERVICOS_PRE.length;i++){
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = SERVICOS_PRE[i].nome;
      sel.appendChild(o);
    }
  }

  function initMobileDefaults(){
    var form = dom.addForm();
    if (!form) return;
    // Form sempre visível
    form.classList.add("open");
  }

  function bindEvents(){
    var el;
el = dom.btnAddServico();
    if (el) el.addEventListener("click", addServicoFromForm);

    el = dom.btnAplicarServico();
    if (el) el.addEventListener("click", aplicarServicoPronto);

    document.addEventListener("click", function(e){
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var id = t.getAttribute("data-del");
      if (!id) return;
      for (var i=0;i<state.items.length;i++){
        if (state.items[i].id === id) { state.items.splice(i,1); break; }
      }
      recalcAndRender();
    });

    el = dom.btnGerarPDF();
    if (el) el.addEventListener("click", gerarPdf);

    el = dom.btnShare();
    if (el) el.addEventListener("click", sharePdf);

    el = dom.btnWhatsAppFallback();
    if (el) el.addEventListener("click", openWhatsAppFallback);
  }

  function init(){
    try { if (dom.appVersion()) dom.appVersion().textContent = APP_VERSION; } catch(e) {}
    try { if (dom.jsStatus()) dom.jsStatus().textContent = "JS: OK (v25-fixes-logo-moeda-layout)"; } catch(e2) {}

    popularServicosProntos();
    initMobileDefaults();

    attachCurrencyMask(dom.valorUnitario(), { defaultValue:"0,00" });
    attachCurrencyMask(dom.descontoServico(), { defaultValue:"0,00" });

    bindEvents();
    recalcAndRender();
  }

  function boot(){
    try { init(); } catch(err){ showBootError(err); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
