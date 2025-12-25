// ==UserScript==
// @name         mx.vendetta.rooms.cost-timer.
// @namespace    mx.vendetta.rooms.cost-timer.
// @version      2.1.2
// @description  Colori costi + tooltip IT con produzione, risorse mancanti e tempo di attesa (Costruibile tra).
// @author       mx.
// @match        *://vendettagame.es/habitaciones*
// @run-at       document-end
// @grant        none
// @updateURL    https://github.com/dani-csg/rooms.costi-timer/raw/refs/heads/main/Rooms.Cost-Timer.user.js
// @downloadURL  https://github.com/dani-csg/rooms.costi-timer/raw/refs/heads/main/Rooms.Cost-Timer.user.js
// ==/UserScript==

(function () {
  'use strict';
  const $ = window.jQuery;
  if (!$) return;

  /* ================= STYLE ================= */
  function ensureStyle() {
    if (document.getElementById('vdRoomsStyle')) return;
    const css = `
      .vd-cost-ok  { color:#14532d !important; font-weight:700; }
      .vd-cost-bad { color:#7f1d1d !important; font-weight:700; }

      .vd-tooltip {
        position:absolute;
        background:rgba(0,0,0,.85);
        color:#fff;
        padding:8px 10px;
        border-radius:6px;
        font-size:11px;
        line-height:1.45;
        z-index:99999;
        white-space:nowrap;
        pointer-events:none;
        box-shadow:0 4px 12px rgba(0,0,0,.45);
      }

      .vd-label { color:#ca8a04; }
      .vd-prod  { color:#15803d; }
      .vd-miss  { color:#b91c1c; }
      .vd-time  { color:#ffffff; }
    `;
    $('<style id="vdRoomsStyle">').text(css).appendTo('head');
  }

  /* ================= HELPERS ================= */
  const parseNum = v => parseInt(String(v).replace(/[^0-9]/g,''),10) || 0;

  const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");

  const fmtTime = s => {
    const h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=s%60;
    return [h,m,sec].map(v=>String(v).padStart(2,'0')).join(':');
  };

  /* ================= TOOLTIP ================= */
  let tip=null;
  const showTip=(e,h)=>{
    if(!tip) tip=$('<div class="vd-tooltip">').appendTo('body');
    tip.html(h).css({top:e.pageY+14,left:e.pageX+14}).show();
  };
  const hideTip=()=>tip&&tip.hide();

  /* ================= RES / PROD ================= */
  const getRes=()=>({
    arm:parseNum($('#recursos-arm').data('cantidad')),
    mun:parseNum($('#recursos-mun').data('cantidad')),
    dol:parseNum($('#recursos-dol').data('cantidad'))
  });

  function getProd(){
    const p={arm:0,mun:0,dol:0};
    $('.dropdown-produccion').each(function(){
      const m=$(this).text().match(/\+([\d\.,]+)\/hora/);
      if(!m) return;
      const v=parseNum(m[1]);
      if(this.id.includes('armas')) p.arm=v;
      else if(this.id.includes('municion')) p.mun=v;
      else if(this.id.includes('dolares')) p.dol=v;
    });
    return p;
  }

  /* ================= TRAINING ================= */
  function processTraining(){
    const r=getRes(), p=getProd();

    $('.entrenamiento-item').each(function(){
      $(this).find('.recursos-container .recurso:not(.tiempo)').each(function(){
        const $r=$(this);
        const span=$r.find('span').first();
        const img=$r.find('img').attr('src')||'';
        if(!span.length) return;

        let t=null;
        if(img.includes('/arm')) t='arm';
        else if(img.includes('/mun')) t='mun';
        else if(img.includes('/dol')) t='dol';
        else return;

        const cost=parseNum(span.text());
        const miss=Math.max(0,cost-r[t]);
        const prod=p[t];

        span.removeClass('vd-cost-ok vd-cost-bad')
            .addClass(miss? 'vd-cost-bad':'vd-cost-ok');

        span.off('.vdtip');
        if(!miss) return;

        let html=`
<span class="vd-label">Produzione/ora:</span> <span class="vd-prod">${fmt(prod)}</span><br>
<span class="vd-label">Mancano:</span> <span class="vd-miss">${fmt(miss)}</span><br>
`;
        html+=prod>0
          ? `<span class="vd-label">Costruibile tra:</span> <span class="vd-time">${fmtTime(Math.ceil(miss/prod*3600))}</span>`
          : `<span class="vd-miss">Produzione assente</span>`;

        span.on('mousemove.vdtip',e=>showTip(e,html))
            .on('mouseleave.vdtip',hideTip);
      });
    });
  }

  /* ================= PAGE ================= */
  const isTraining=()=>location.pathname.includes('/entrenamiento');

  /* ================= BOOT ================= */
  function boot(){
    ensureStyle();
    if(isTraining()) processTraining();
    setInterval(()=>isTraining()&&processTraining(),3000);
  }

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',boot)
    : boot();
})();
