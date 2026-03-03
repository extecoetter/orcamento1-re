// ===== SERVIÇOS (NOVO - ES5) =====
(function () {
  var itens = []; // fonte única dos serviços

  function qs(id){ return document.getElementById(id); }

  function onlyDigits(s){ return String(s||"").replace(/\D/g,""); }

  // máscara moeda "da direita pra esquerda"
  function formatMoedaFromDigits(digits){
    digits = onlyDigits(digits);
    if (!digits) digits = "0";
    // garante pelo menos 3 chars p/ cortar centavos
    while (digits.length < 3) digits = "0" + digits;
    var cent = digits.slice(-2);
    var intp = digits.slice(0, -2);
    // separador milhar
    var out = "";
    while (intp.length > 3) {
      out = "." + intp.slice(-3) + out;
      intp = intp.slice(0, -3);
    }
    out = intp + out;
    return out + "," + cent;
  }

  function moedaToNumber(m){
    m = String(m||"0").replace(/\./g,"").replace(",",".");
    var n = parseFloat(m);
    return isNaN(n) ? 0 : n;
  }

  function fmtBR(n){
    var s = (Math.round(n*100)/100).toFixed(2);
    s = s.replace(".",",");
    // milhar
    var parts = s.split(",");
    var intp = parts[0];
    var cent = parts[1];
    var out = "";
    while (intp.length > 3) {
      out = "." + intp.slice(-3) + out;
      intp = intp.slice(0, -3);
    }
    return intp + out + "," + cent;
  }

  function calcTotal(){
    var total = 0;
    for (var i=0;i<itens.length;i++){
      total += itens[i].total;
    }
    return total;
  }

  function renderItens(){
    var box = qs("listaItens");
    if (!box) return;

    var html = "";
    for (var i=0;i<itens.length;i++){
      var it = itens[i];
      html += ''
        + '<div class="card" style="margin:8px 0;">'
        +   '<div style="display:flex;justify-content:space-between;gap:10px;">'
        +     '<b>' + (it.desc || "") + '</b>'
        +     '<button type="button" data-del="'+i+'" style="width:auto;padding:10px 12px;background:#e11d48;">X</button>'
        +   '</div>'
        +   '<div style="margin-top:6px;font-size:14px;">'
        +     'Qtd: <b>'+it.qtd+'</b> · Valor: <b>R$ '+fmtBR(it.valor)+'</b> · Desc: <b>R$ '+fmtBR(it.desconto)+'</b>'
        +   '</div>'
        +   '<div style="margin-top:6px;"><b>Subtotal: R$ '+fmtBR(it.total)+'</b></div>'
        + '</div>';
    }

    if (!html) html = '<div style="opacity:.7;">Nenhum item ainda.</div>';
    box.innerHTML = html;

    var lbl = qs("lblTotal");
    if (lbl) lbl.textContent = "Total: R$ " + fmtBR(calcTotal());
  }

  function addItemFromForm(){
    var desc = (qs("inpDesc").value || "").trim();
    var qtd = parseInt(onlyDigits(qs("inpQtd").value),10);
    if (!qtd || qtd < 1) qtd = 1;

    var v = moedaToNumber(qs("inpValor").value);
    var d = moedaToNumber(qs("inpDescR").value);

    if (!desc){
      alert("Preencha a descrição.");
      return;
    }

    var total = (qtd * v) - d;
    if (total < 0) total = 0;

    itens.push({ desc: desc, qtd: qtd, valor: v, desconto: d, total: total });

    // limpa só descrição (mantém qtd 1)
    qs("inpDesc").value = "";
    qs("inpQtd").value = "1";
    qs("inpValor").value = "0,00";
    qs("inpDescR").value = "0,00";

    renderItens();
  }

  function toggleForm(){
    var form = qs("servicoForm");
    if (!form) return;
    var show = (form.style.display === "none");
    form.style.display = show ? "block" : "none";
    if (show) {
      try { qs("inpDesc").focus(); } catch(e){}
    }
  }

  function aplicarPreset(){
    var sel = qs("selPreset");
    if (!sel) return;
    if (!sel.value) { alert("Selecione um serviço pronto."); return; }
    qs("inpDesc").value = sel.value;
    // abre form e foca
    var form = qs("servicoForm");
    if (form && form.style.display === "none") form.style.display = "block";
    try { qs("inpValor").focus(); } catch(e){}
  }

  function initMascaras(){
    function attachMoneyMask(id){
      var el = qs(id);
      if (!el) return;
      el.value = "0,00";
      el.addEventListener("input", function(){
        el.value = formatMoedaFromDigits(el.value);
      });
      el.addEventListener("focus", function(){
        if (!el.value) el.value = "0,00";
      });
    }
    attachMoneyMask("inpValor");
    attachMoneyMask("inpDescR");
  }

  function initEventos(){
    // botões diretos
    qs("btnToggleForm").addEventListener("click", toggleForm);
    qs("btnAddItem").addEventListener("click", addItemFromForm);
    qs("btnAplicarPreset").addEventListener("click", aplicarPreset);

    // delete por delegação
    qs("listaItens").addEventListener("click", function(e){
      var t = e.target;
      var idx = t && t.getAttribute ? t.getAttribute("data-del") : null;
      if (idx === null) return;
      idx = parseInt(idx,10);
      if (isNaN(idx)) return;
      itens.splice(idx,1);
      renderItens();
    });
  }

  // Boot
  function boot(){
    if (!qs("servicosCard")) return; // se você colar em outro lugar, não quebra
    initMascaras();
    initEventos();
    renderItens();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
