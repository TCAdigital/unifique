"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, Users, Info, ChevronDown, ChevronUp } from "lucide-react";

// ─── Modelo ──────────────────────────────────────────────────────────────────

const BLK = {
  B1: { nome: "Cadastro / Base", base: 20 },
  B2: { nome: "Pipeline",        base: 45 },
  B3: { nome: "Atividades",      base: 35 },
} as const;
type BlkKey = "B1" | "B2" | "B3";

interface Ind {
  c: string; b: BlkKey; n: string; u: string;
  meta: number; w: number; dir: "max" | "min"; src?: string;
  tip: string; // how it's calculated
}

const IND: Ind[] = [
  { c:"1.1",b:"B1",n:"IQC — Qualidade de Cadastro",     u:"idx",  meta:85,   w:8,  dir:"max", tip:"Completude média das empresas da carteira (CNPJ, porte, cidade, contato, segmento)" },
  { c:"1.2",b:"B1",n:"Novas contas qualificadas",        u:"qtd",  meta:25,   w:5,  dir:"max", tip:"Empresas criadas nos últimos 30 dias atribuídas a este consultor" },
  { c:"1.3",b:"B1",n:"Cobertura de carteira",            u:"pct",  meta:60,   w:5,  dir:"max", tip:"% de empresas com ao menos 1 atividade registrada nos últimos 90 dias" },
  { c:"1.4",b:"B1",n:"Higiene da base",                  u:"pct",  meta:3,    w:2,  dir:"min", tip:"% de empresas sem nenhuma atividade nos últimos 180 dias (órfãs)" },
  { c:"2.1",b:"B2",n:"Pipeline coverage",                u:"mult", meta:3.5,  w:7,  dir:"max", src:"cov",   tip:"Soma do pipeline aberto ÷ meta do período" },
  { c:"2.2",b:"B2",n:"Taxa de conversão global",         u:"pct",  meta:22,   w:8,  dir:"max", src:"conv",  tip:"Negócios Ganhos ÷ (Ganhos + Perdidos)" },
  { c:"2.3",b:"B2",n:"Gates vs. baseline do time",       u:"pct",  meta:90,   w:8,  dir:"max", src:"gbase", tip:"Média de conversão entre etapas deste consultor ÷ média do time" },
  { c:"2.4",b:"B2",n:"Sales velocity (R$/dia)",          u:"brl",  meta:6000, w:6,  dir:"max", src:"vel",   tip:"(Oportunidades × Ticket médio × Conversão) ÷ Ciclo médio em dias" },
  { c:"2.5",b:"B2",n:"Higiene do funil",                 u:"pct",  meta:90,   w:7,  dir:"max", tip:"% de oportunidades abertas com valor > 0 e data de fechamento futura preenchida" },
  { c:"2.6",b:"B2",n:"Acurácia de forecast",             u:"pct",  meta:90,   w:5,  dir:"max", tip:"% de negócios Ganhos cuja data prevista de fechamento estava dentro de 30 dias do encerramento real" },
  { c:"2.7",b:"B2",n:"Disciplina de perda",              u:"pct",  meta:100,  w:4,  dir:"max", tip:"% de negócios Perdidos que possuem ao menos 1 concorrente registrado" },
  { c:"3.1",b:"B3",n:"Atividades de alto impacto",       u:"qtd",  meta:40,   w:10, dir:"max", tip:"Reuniões e Calls realizadas nos últimos 30 dias nas empresas da carteira" },
  { c:"3.2",b:"B3",n:"Cadência ativa",                   u:"pct",  meta:95,   w:8,  dir:"max", tip:"% de oportunidades abertas com ao menos 1 atividade pendente e prazo futuro agendada" },
  { c:"3.3",b:"B3",n:"Efetividade da atividade",         u:"pct",  meta:25,   w:7,  dir:"max", tip:"% de Reuniões e Calls dos últimos 30 dias com status Concluída" },
  { c:"3.4",b:"B3",n:"Densidade de toque",               u:"ratio",meta:4,    w:5,  dir:"max", src:"dens",  tip:"Total de atividades no mês ÷ oportunidades abertas" },
  { c:"3.5",b:"B3",n:"SLA de 1º contato",                u:"hrs",  meta:24,   w:5,  dir:"min", tip:"Tempo médio (horas) entre criação da empresa e o 1º registro de atividade" },
];

const ETAPAS = [
  {k:"prosp",n:"Prospecção"},{k:"qual",n:"Qualificação"},{k:"prop",n:"Proposta"},
  {k:"neg",n:"Negociação"},{k:"fech",n:"Fechamento"},
] as const;
type EtapaK = (typeof ETAPAS)[number]["k"];

const GATES = [
  {id:"G1",de:"prosp",para:"qual"},{id:"G2",de:"qual",para:"prop"},
  {id:"G3",de:"prop",para:"neg"},{id:"G4",de:"neg",para:"fech"},
  {id:"G5",de:"fech",para:"ganho"},
] as const;

const PESOS: Record<BlkKey,number> = { B1: 20, B2: 45, B3: 35 };

const NIVEL_LABEL = ["—","Crítico","Em desenvolvimento","Consistente","Alta Performance"];
const NIVEL_CLS   = ["","bg-red-500","bg-amber-500","bg-unifique-primary","bg-emerald-500"];
const NIVEL_TEXT  = ["","text-red-600","text-amber-600","text-unifique-primary","text-emerald-600"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunilData { prosp:number; qual:number; prop:number; neg:number; fech:number; ganho:number; perdido:number }
interface VendState {
  id:string; nome:string; perfil:string;
  f: FunilData;
  v: { pipe:number; meta:number; ticket:number; ciclo:number };
  ind: Record<string,number>; // all 16 indicators, fully computed
  receita: number;            // % of meta achieved (ganho_total / meta)
  ativos_total: number;       // total atividades in 30d (for density src)
}
interface Computed {
  v: VendState;
  gates: Array<{id:string;de:string;para:string;pct:number;leak:number}>;
  mediaG:number; conv:number; cov:number; vel:number; dens:number; gbase:number;
  real:Record<string,number>; pts:Record<string,number>;
  blk:Record<BlkKey,number>; ipc:number;
  nivel0:number; travas:string[]; quad:string; baseline:number;
}

// ─── Cálculos ─────────────────────────────────────────────────────────────────

const sd = (a:number, b:number) => (b && isFinite(b)) ? a/b : 0;

function calcGates(f: FunilData) {
  return GATES.map(g => {
    const de   = f[g.de as EtapaK];
    const para = g.para === "ganho" ? f.ganho : f[g.para as EtapaK];
    return { id:g.id, de:g.de, para:g.para, pct:sd(para,de), leak:Math.max(de-para,0) };
  });
}

function calcIPC(v: VendState, pesos: Record<BlkKey,number>, teto: number, baseline: number): Omit<Computed,"v"> {
  const gates  = calcGates(v.f);
  const mediaG = gates.reduce((s,g)=>s+g.pct,0) / gates.length;
  const conv   = sd(v.f.ganho, v.f.ganho+v.f.perdido);
  const cov    = sd(v.v.pipe, v.v.meta);
  const vel    = sd(v.f.prosp * v.v.ticket * conv, v.v.ciclo);
  const openCnt= v.f.prosp+v.f.qual+v.f.prop+v.f.neg+v.f.fech;
  const dens   = sd(v.ativos_total, Math.max(openCnt,1));
  const gbase  = sd(mediaG, baseline||1);

  const real:Record<string,number> = {};
  const pts: Record<string,number> = {};
  const blk: Record<BlkKey,number> = {B1:0,B2:0,B3:0};

  IND.forEach(i => {
    let r: number;
    switch(i.src) {
      case "cov":   r = cov; break;
      case "conv":  r = conv*100; break;
      case "gbase": r = gbase*100; break;
      case "vel":   r = vel; break;
      case "dens":  r = dens; break;
      default:      r = v.ind[i.c] ?? 0; break;
    }
    real[i.c] = r;
    const peso  = i.w * (pesos[i.b] / BLK[i.b].base);
    const razao = i.dir==="max" ? sd(r,i.meta) : sd(i.meta,r);
    pts[i.c]    = Math.min(razao, teto) * peso;
    blk[i.b]  += pts[i.c];
  });

  const ipc    = blk.B1+blk.B2+blk.B3;
  const nivel0 = ipc>=90?4 : ipc>=75?3 : ipc>=60?2 : 1;
  const travas: string[] = [];
  if ((v.ind["1.1"]??0) < 70) travas.push("IQC baixo");
  if ((v.ind["2.5"]??0) < 60) travas.push("funil sujo");
  if (v.receita < 70)          travas.push("receita <70%");
  const pctB2 = sd(blk.B2, pesos.B2);
  const pctB3 = sd(blk.B3, pesos.B3);
  const quad  = (pctB3>=0.8?"A":"B")+(pctB2>=0.8?"A":"B");
  return { gates, mediaG, conv, cov, vel, dens, gbase, real, pts, blk, ipc, nivel0, travas, quad, baseline };
}

function fmtVal(val:number, u:string): string {
  if (!isFinite(val)) val=0;
  const n=(x:number,d:number)=>x.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
  switch(u) {
    case "pct":   return n(val,1)+"%";
    case "mult":  return n(val,2)+"x";
    case "brl":   return "R$ "+Math.round(val).toLocaleString("pt-BR");
    case "hrs":   return Math.round(val)+" h";
    case "ratio": return n(val,1);
    default:      return n(val,1);
  }
}

function pctOfMeta(real:number, meta:number, dir:"max"|"min"): number {
  const r = dir==="max" ? sd(real,meta) : sd(meta,real);
  return Math.min(r*100, 120);
}

// ─── DB types ──────────────────────────────────────────────────────────────────

type NRow={id:string;responsavel:string|null;fase:string;valor:number|null;prev_fechamento:string|null;updated_at:string|null;created_at:string};
type ERow={id:string;consultor_id:string|null;cnpj:string|null;segmento:string;porte:string|null;cidade:string|null;contato:string|null;email_contato:string|null;created_at:string};
type TRow={id:string;empresa_id:string|null;negocio_id:string|null;tipo:string;prazo:string;status:string;created_at:string};
type URow={id:string;nome:string;perfil:string};
type CRow={id:string;negocio_id:string};

function buildVend(u:URow, negs:NRow[], emps:ERow[], tars:TRow[], concs:CRow[], meta:number): VendState {
  const myNeg = negs.filter(n=>n.responsavel===u.nome);
  const f:FunilData = {
    prosp: myNeg.filter(n=>n.fase==="Prospecção").length,
    qual:  myNeg.filter(n=>n.fase==="Qualificação").length,
    prop:  myNeg.filter(n=>n.fase==="Proposta").length,
    neg:   myNeg.filter(n=>n.fase==="Negociação").length,
    fech:  myNeg.filter(n=>["Fechamento","Contrato"].includes(n.fase)).length,
    ganho:   myNeg.filter(n=>n.fase==="Ganho").length,
    perdido: myNeg.filter(n=>n.fase==="Perdido").length,
  };
  const openNeg  = myNeg.filter(n=>!["Ganho","Perdido"].includes(n.fase));
  const pipe     = openNeg.reduce((s,n)=>s+(n.valor??0),0);
  const comValor = myNeg.filter(n=>(n.valor??0)>0);
  const ticket   = comValor.length ? comValor.reduce((s,n)=>s+(n.valor??0),0)/comValor.length : 30000;

  const myEmp    = emps.filter(e=>e.consultor_id===u.id);
  const myEmpIds = new Set(myEmp.map(e=>e.id));
  const myNegIds = new Set(openNeg.map(n=>n.id));

  const now=new Date(); const d30=new Date(now); d30.setDate(d30.getDate()-30);
  const d90=new Date(now); d90.setDate(d90.getDate()-90);
  const d180=new Date(now); d180.setDate(d180.getDate()-180);

  // 1.1 IQC — completude média
  const iqc = myEmp.length===0 ? 0 : Math.round(
    myEmp.reduce((s,e)=>{
      let sc=0;
      if (e.cnpj)                       sc+=25;
      if (e.segmento?.trim())           sc+=20;
      if (e.porte)                      sc+=20;
      if (e.cidade)                     sc+=20;
      if (e.contato||e.email_contato)   sc+=15;
      return s+sc;
    },0)/myEmp.length
  );

  // 1.2 Novas contas (30d)
  const novas = myEmp.filter(e=>new Date(e.created_at)>=d30).length;

  // 1.3 Cobertura carteira (90d)
  const empComAtiv90 = new Set(
    tars.filter(t=>t.empresa_id&&myEmpIds.has(t.empresa_id)&&new Date(t.created_at)>=d90).map(t=>t.empresa_id)
  );
  const cobertura = myEmp.length ? Math.round((empComAtiv90.size/myEmp.length)*100) : 0;

  // 1.4 Higiene base — órfãs (sem atividade 180d)
  const empComAtiv180 = new Set(
    tars.filter(t=>t.empresa_id&&myEmpIds.has(t.empresa_id)&&new Date(t.created_at)>=d180).map(t=>t.empresa_id)
  );
  const orfas = myEmp.length ? Math.round(((myEmp.length-empComAtiv180.size)/myEmp.length)*100) : 0;

  // 2.5 Higiene funil
  const higieneOk = openNeg.filter(n=>(n.valor??0)>0&&n.prev_fechamento&&new Date(n.prev_fechamento)>now).length;
  const higiene   = openNeg.length ? Math.round((higieneOk/openNeg.length)*100) : 90;

  // 2.6 Acurácia forecast: ganho deals com prev_fechamento ≤ 30d do updated_at
  const ganhoComPrev = myNeg.filter(n=>n.fase==="Ganho"&&n.prev_fechamento&&n.updated_at);
  let acuracia = 85;
  if (ganhoComPrev.length>0) {
    const ok = ganhoComPrev.filter(n=>{
      const diff = Math.abs(new Date(n.prev_fechamento!).getTime()-new Date(n.updated_at!).getTime());
      return diff <= 30*24*3600*1000;
    }).length;
    acuracia = Math.round((ok/ganhoComPrev.length)*100);
  }

  // 2.7 Disciplina de perda: perdido com ≥1 concorrente registrado
  const perdidoIds = new Set(myNeg.filter(n=>n.fase==="Perdido").map(n=>n.id));
  const perdidoComConc = new Set(concs.filter(c=>perdidoIds.has(c.negocio_id)).map(c=>c.negocio_id));
  const disciplina = perdidoIds.size>0 ? Math.round((perdidoComConc.size/perdidoIds.size)*100) : 100;

  // 3.1 Atividades alto impacto (30d)
  const myTars30 = tars.filter(t=>t.empresa_id&&myEmpIds.has(t.empresa_id)&&new Date(t.created_at)>=d30);
  const altoImpacto = myTars30.filter(t=>["Reunião","Call"].includes(t.tipo)).length;

  // 3.2 Cadência ativa: open negocios com tarefa pendente futura
  const negComNext = new Set(
    tars.filter(t=>t.negocio_id&&myNegIds.has(t.negocio_id)&&t.status==="Pendente"&&new Date(t.prazo)>=now).map(t=>t.negocio_id)
  );
  const cadencia = openNeg.length ? Math.round((negComNext.size/openNeg.length)*100) : 0;

  // 3.3 Efetividade: Reunião/Call concluídas / total Reunião/Call (30d)
  const altoTotal   = myTars30.filter(t=>["Reunião","Call"].includes(t.tipo)).length;
  const altoConcl   = myTars30.filter(t=>["Reunião","Call"].includes(t.tipo)&&t.status==="Concluída").length;
  const efetividade = altoTotal>0 ? Math.round((altoConcl/altoTotal)*100) : 0;

  // 3.4 via src:"dens" → ativos_total / openCnt (calculated in calcIPC)
  const allAtiv = myTars30.length;

  // 3.5 SLA 1º contato: média de horas entre criação empresa e 1ª tarefa
  const slaHrs = (() => {
    const diffs: number[] = [];
    myEmp.forEach(e => {
      const first = tars
        .filter(t=>t.empresa_id===e.id)
        .sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime())[0];
      if (first) {
        const h = (new Date(first.created_at).getTime()-new Date(e.created_at).getTime())/3600000;
        if (h>=0) diffs.push(h);
      }
    });
    return diffs.length ? Math.round(diffs.reduce((s,d)=>s+d,0)/diffs.length) : 48;
  })();

  // Receita %: ganho total / meta × 100
  const ganhoTotal = myNeg.filter(n=>n.fase==="Ganho").reduce((s,n)=>s+(n.valor??0),0);
  const receitaPct = meta>0 ? Math.round((ganhoTotal/meta)*100) : 100;

  // Ciclo médio: dias entre created_at e updated_at nos deals fechados
  const fechados = myNeg.filter(n=>["Ganho","Perdido"].includes(n.fase)&&n.updated_at&&n.created_at);
  const ciclo    = fechados.length
    ? Math.round(fechados.reduce((s,n)=>{
        const d=(new Date(n.updated_at!).getTime()-new Date(n.created_at).getTime())/86400000;
        return s+Math.max(d,1);
      },0)/fechados.length)
    : 75;

  return {
    id:u.id, nome:u.nome, perfil:u.perfil, f,
    v:{ pipe, meta, ticket:Math.round(ticket), ciclo },
    ind:{"1.1":iqc,"1.2":novas,"1.3":cobertura,"1.4":orfas,"2.5":higiene,"2.6":acuracia,"2.7":disciplina,"3.1":altoImpacto,"3.2":cadencia,"3.3":efetividade,"3.5":slaHrs},
    receita: receitaPct,
    ativos_total: allAtiv,
  };
}

// ─── Metodologia fixa (só leitura) ───────────────────────────────────────────

function MetodologiaCard() {
  const segs=[{k:"B1" as BlkKey,label:"Cadastro",pts:PESOS.B1,color:"#8E9DBE"},{k:"B2" as BlkKey,label:"Pipeline",pts:PESOS.B2,color:"#0057B8"},{k:"B3" as BlkKey,label:"Atividades",pts:PESOS.B3,color:"#00C8F0"}];
  return (
    <div className="glass-card p-5">
      <h2 className="text-sm font-bold text-slate-700 mb-0.5">Metodologia IPC — distribuição dos 100 pontos</h2>
      <p className="text-xs text-slate-400 mb-4">Pesos fixos aplicados automaticamente sobre os dados reais de cada consultor no CRM.</p>
      <div className="h-12 rounded-lg overflow-hidden flex">
        {segs.map(s=>(
          <div key={s.k} className="flex flex-col justify-center pl-4 overflow-hidden" style={{width:`${s.pts}%`,background:s.color}}>
            <span className="text-white font-bold text-lg leading-none">{s.pts}</span>
            <span className="text-white/80 text-[9px] uppercase tracking-wider font-mono">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-6 mt-3 flex-wrap">
        {segs.map(s=>(
          <div key={s.k} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:s.color}}/>
            <strong className="font-mono text-slate-700">{s.pts} pts</strong> {s.label}
          </div>
        ))}
        <p className="ml-auto text-[10px] text-slate-400">4 indicadores · 3 blocos · 16 KPIs</p>
      </div>
    </div>
  );
}

// ─── FunilView ────────────────────────────────────────────────────────────────

function FunilView({o}:{o:Computed}) {
  const f=o.v.f; const max=f.prosp||1;
  const piorIdx=o.gates.reduce((bi,g,i)=>g.pct<o.gates[bi].pct?i:bi,0);
  return (
    <div className="space-y-0.5 text-sm">
      {ETAPAS.map((e,idx)=>{const q=f[e.k];const g=o.gates[idx];return(
        <React.Fragment key={e.k}>
          <div className="grid items-center gap-2" style={{gridTemplateColumns:"110px 1fr 32px"}}>
            <div className="text-xs text-slate-600"><span className="font-mono text-slate-400 mr-1">{idx+1}</span>{e.n}</div>
            <div className="h-5 rounded bg-unifique-primary" style={{width:`${Math.max(sd(q,max)*100,1)}%`,transition:"width .3s"}}/>
            <div className="text-right font-mono text-xs font-bold text-slate-700">{q}</div>
          </div>
          {g&&(<div className="grid items-center gap-2 mb-1 text-[10px] font-mono text-slate-400" style={{gridTemplateColumns:"110px 1fr 32px"}}>
            <div className="text-right text-slate-300">{g.id}</div>
            <div className={cn("border-l-2 border-dotted border-slate-200 pl-2 flex gap-2 flex-wrap",idx===piorIdx&&"border-red-300")}>
              <span className={cn("font-bold",idx===piorIdx?"text-red-500":"text-slate-600")}>{(g.pct*100).toFixed(1)}%</span>
              <span className="text-red-400">−{g.leak}</span>
              {idx===piorIdx&&<span className="bg-red-500 text-white px-1 rounded text-[9px] uppercase">Gargalo</span>}
            </div><div/>
          </div>)}
        </React.Fragment>
      );})}
      <div className="border-t border-slate-100 pt-2 mt-1 space-y-0.5">
        {([{k:"ganho",n:"✓ Ganho",color:"bg-emerald-500"},{k:"perdido",n:"✕ Perdido",color:"bg-red-400"}] as const).map(e=>(
          <div key={e.k} className="grid items-center gap-2" style={{gridTemplateColumns:"110px 1fr 32px"}}>
            <div className="text-xs text-slate-600">{e.n}</div>
            <div className={cn("h-5 rounded",e.color)} style={{width:`${Math.max(sd(f[e.k],max)*100,1)}%`,transition:"width .3s"}}/>
            <div className="text-right font-mono text-xs font-bold text-slate-700">{f[e.k]}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 pt-2 mt-1 flex flex-wrap gap-4 text-[10px] font-mono text-slate-500">
        <span>Conv. <strong className="text-slate-700">{(o.conv*100).toFixed(1)}%</strong></span>
        <span>Coverage <strong className="text-slate-700">{o.cov.toFixed(2)}x</strong></span>
        <span>Média gates <strong className="text-slate-700">{(o.mediaG*100).toFixed(1)}%</strong></span>
        <span>Ciclo médio <strong className="text-slate-700">{o.v.v.ciclo} dias</strong></span>
      </div>
    </div>
  );
}

// ─── MatrixView ───────────────────────────────────────────────────────────────

const QUAD_CFG={AA:{label:"Alta performance real",desc:"Processo e resultado alinhados. Replicar o padrão.",cls:"good"},AB:{label:"Esforço sem direção",desc:"Volume alto, funil fraco. Atacar ICP e pitch.",cls:"bad"},BA:{label:"Herança de carteira",desc:"Vive de base instalada. Exigir prospecção nova.",cls:"warn"},BB:{label:"Disciplina e capacidade",desc:"Cadência e gestão de tempo. Acompanhamento semanal.",cls:"bad"}} as const;
const QUAD_CLS={good:"bg-emerald-50 border-emerald-200",bad:"bg-red-50 border-red-200",warn:"bg-amber-50 border-amber-200"};

function MatrixCell({q,byQuad,travasOn}:{q:keyof typeof QUAD_CFG;byQuad:Record<string,Computed[]>;travasOn:boolean}) {
  const cfg=QUAD_CFG[q]; const items=byQuad[q]??[];
  return(
    <div className={cn("rounded border p-3 min-h-20",QUAD_CLS[cfg.cls])}>
      <h3 className="font-bold text-xs text-slate-700 mb-0.5">{cfg.label}</h3>
      <p className="text-[11px] text-slate-500 mb-2 leading-snug">{cfg.desc}</p>
      <div className="flex flex-wrap gap-1">
        {items.map(o=>{const nivel=travasOn&&o.travas.length?Math.min(o.nivel0,3):o.nivel0;return(<span key={o.v.id} className={cn("text-white text-[10px] font-mono px-1.5 py-0.5 rounded",NIVEL_CLS[nivel])}>{o.v.nome.split(" ")[0]} · {o.ipc.toFixed(0)}{travasOn&&o.travas.length>0&&" ▲"}</span>);})}
        {!items.length&&<span className="text-[10px] text-slate-400 italic">Nenhum</span>}
      </div>
    </div>
  );
}

function MatrixView({computed,travasOn}:{computed:Computed[];travasOn:boolean}) {
  const byQuad:Record<string,Computed[]>={AA:[],AB:[],BA:[],BB:[]};
  computed.forEach(o=>{if(byQuad[o.quad])byQuad[o.quad].push(o);});
  return(
    <div className="grid gap-1" style={{gridTemplateColumns:"68px 1fr 1fr"}}>
      <div/><div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-wider py-1">Pipeline baixo</div>
      <div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-wider py-1">Pipeline alto</div>
      <div className="flex items-center justify-end pr-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Atv. alta</div>
      <MatrixCell q="AB" byQuad={byQuad} travasOn={travasOn}/>
      <MatrixCell q="AA" byQuad={byQuad} travasOn={travasOn}/>
      <div className="flex items-center justify-end pr-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Atv. baixa</div>
      <MatrixCell q="BB" byQuad={byQuad} travasOn={travasOn}/>
      <MatrixCell q="BA" byQuad={byQuad} travasOn={travasOn}/>
    </div>
  );
}

// ─── Scorecard read-only ──────────────────────────────────────────────────────

function Scorecard({computed}:{computed:Computed[]}) {
  const [open, setOpen] = useState(false);
  if (!computed.length) return null;
  return (
    <div className="glass-card overflow-hidden">
      <button className="w-full px-5 py-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50 transition-all" onClick={()=>setOpen(v=>!v)}>
        <div>
          <h2 className="text-sm font-bold text-slate-700 text-left">Detalhamento dos 16 indicadores</h2>
          <p className="text-xs text-slate-400 mt-0.5 text-left">Todos calculados automaticamente a partir do CRM — nenhum campo manual.</p>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-56">Indicador</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta</th>
                {computed.map(o=>(
                  <th key={o.v.id} className="px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">{o.v.nome.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(["B1","B2","B3"] as BlkKey[]).map(b=>(
                <React.Fragment key={b}>
                  <tr className="bg-slate-100/80">
                    <td colSpan={2+computed.length} className="px-4 py-2 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {BLK[b].nome} — {PESOS[b]} pts
                    </td>
                  </tr>
                  {IND.filter(i=>i.b===b).map(i=>(
                    <tr key={i.c} className="hover:bg-slate-50" title={i.tip}>
                      <td className="px-4 py-2 text-slate-700">
                        <span className="font-mono text-slate-400 mr-2">{i.c}</span>{i.n}
                        <Info size={10} className="inline ml-1 text-slate-300"/>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-slate-500">{fmtVal(i.meta,i.u)}</td>
                      {computed.map(o=>{
                        const r=o.real[i.c]; const p=o.pts[i.c];
                        const pct=pctOfMeta(r,i.meta,i.dir);
                        const colorCls=pct>=90?"text-emerald-600":pct>=60?"text-amber-600":"text-red-500";
                        return(
                          <td key={o.v.id} className="px-3 py-2 text-center">
                            <span className={cn("font-mono font-bold text-xs",colorCls)}>{fmtVal(r,i.u)}</span>
                            <br/><span className="text-[10px] text-slate-400">{p.toFixed(1)} pts</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-4 py-2 font-bold text-slate-700">Subtotal {BLK[b].nome}</td>
                    <td className="px-3 py-2 text-center font-mono text-slate-600">{PESOS[b]}</td>
                    {computed.map(o=>(
                      <td key={o.v.id} className="px-3 py-2 text-center font-mono font-bold text-slate-800">{o.blk[b].toFixed(1)}</td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
              <tr className="bg-unifique-primary/5 border-t-2 border-slate-300">
                <td className="px-4 py-3 font-bold text-slate-800">IPC total</td>
                <td className="px-3 py-3 text-center font-mono text-slate-600">100</td>
                {computed.map(o=>(
                  <td key={o.v.id} className="px-3 py-3 text-center font-mono font-bold text-unifique-primary text-sm">{o.ipc.toFixed(1)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [rawUsers, setRawUsers] = useState<URow[]>([]);
  const [rawNegs,  setRawNegs]  = useState<NRow[]>([]);
  const [rawEmps,  setRawEmps]  = useState<ERow[]>([]);
  const [rawTars,  setRawTars]  = useState<TRow[]>([]);
  const [rawConcs, setRawConcs] = useState<CRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [teto,     setTeto]     = useState(1.20);
  const [travasOn, setTravasOn] = useState(true);
  const [funilSel, setFunilSel] = useState(0);
  const [meta,     setMeta]     = useState(500000);

  useEffect(()=>{
    async function load(){
      const [{ data:users },{ data:negs },{ data:emps },{ data:tars },{ data:concs }] = await Promise.all([
        supabase.from("usuarios").select("id,nome,perfil").in("perfil",["consultor","preVenda"]).eq("ativo",true),
        supabase.from("negocios").select("id,responsavel,fase,valor,prev_fechamento,updated_at,created_at"),
        supabase.from("empresas").select("id,consultor_id,cnpj,segmento,porte,cidade,contato,email_contato,created_at"),
        supabase.from("tarefas").select("id,empresa_id,negocio_id,tipo,prazo,status,created_at"),
        supabase.from("concorrentes").select("id,negocio_id"),
      ]);
      setRawUsers((users??[]) as URow[]);
      setRawNegs((negs??[])   as NRow[]);
      setRawEmps((emps??[])   as ERow[]);
      setRawTars((tars??[])   as TRow[]);
      setRawConcs((concs??[]) as CRow[]);
      setLoading(false);
    }
    load();
  },[]);

  const vendedores = useMemo(()=>
    rawUsers.map(u=>buildVend(u,rawNegs,rawEmps,rawTars,rawConcs,meta))
  ,[rawUsers,rawNegs,rawEmps,rawTars,rawConcs,meta]);

  const computed = useMemo(():Computed[]=>{
    if (!vendedores.length) return [];
    const gs=vendedores.map(v=>{const g=calcGates(v.f);return g.reduce((s,x)=>s+x.pct,0)/g.length;});
    const baseline=gs.reduce((s,x)=>s+x,0)/(gs.length||1);
    return vendedores.map(v=>({v,...calcIPC(v,PESOS,teto,baseline)}));
  },[vendedores,teto]);

  const ranked  = useMemo(()=>[...computed].sort((a,b)=>b.ipc-a.ipc),[computed]);
  const avgIpc  = computed.length ? computed.reduce((s,o)=>s+o.ipc,0)/computed.length : 0;
  const altaPerf= computed.filter(o=>{const n=travasOn&&o.travas.length?Math.min(o.nivel0,3):o.nivel0;return n===4;}).length;
  const selComp = computed[Math.min(funilSel,computed.length-1)];

  if (loading) return(
    <Shell><div className="flex items-center justify-center h-64 text-slate-400"><Loader2 className="animate-spin mr-3" size={24}/>Carregando dados de performance...</div></Shell>
  );
  if (!vendedores.length) return(
    <Shell><div className="glass-card p-12 text-center text-slate-400"><Users className="mx-auto mb-3 opacity-40" size={36}/><p className="font-medium">Nenhum consultor encontrado.</p><p className="text-sm mt-1">Cadastre usuários com perfil "consultor" ou "preVenda".</p></div></Shell>
  );

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Performance Comercial — IPC</h1>
            <p className="text-sm text-slate-500 mt-0.5">100% automático · {IND.length} indicadores · alimentado por Empresas, Pipeline e Atividades do CRM</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            {[{label:"Consultores",value:computed.length},{label:"IPC médio",value:avgIpc.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})},{label:"Alta perf.",value:`${altaPerf}/${computed.length}`}].map(s=>(
              <div key={s.label} className="border-l-2 border-slate-200 pl-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                <p className="text-2xl font-bold font-mono text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="glass-card p-5 flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meta por consultor (R$/período)</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">R$</span>
              <input type="number" value={meta} step={50000} min={0}
                onChange={e=>setMeta(parseFloat(e.target.value)||0)}
                className="w-36 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-700 outline-none focus:border-unifique-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={travasOn} onChange={e=>setTravasOn(e.target.checked)} className="accent-blue-600 w-4 h-4"/>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Travas de integridade</span>
          </label>
        </div>

        {/* Metodologia fixa */}
        <MetodologiaCard/>

        {/* Ranking */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-0.5">Ranking e classificação</h2>
          <p className="text-xs text-slate-400 mb-4">Travas rebaixam a classificação sem alterar o IPC. Score reflete atividade real no CRM.</p>
          <div className="space-y-2">
            {ranked.map((o,i)=>{
              const nivel=travasOn&&o.travas.length?Math.min(o.nivel0,3):o.nivel0;
              const maxIpc=Math.max(...ranked.map(x=>x.ipc),100);
              return(
                <div key={o.v.id} className="grid gap-3 items-center py-1" style={{gridTemplateColumns:"28px 1.4fr 2.4fr 56px 1fr"}}>
                  <span className="font-mono text-xs text-slate-400">{String(i+1).padStart(2,"0")}</span>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{o.v.nome}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{o.v.perfil} · receita {o.v.receita}%</p>
                  </div>
                  <div className="h-6 rounded overflow-hidden bg-slate-100 flex" title={`Cadastro ${o.blk.B1.toFixed(1)} · Pipeline ${o.blk.B2.toFixed(1)} · Atividades ${o.blk.B3.toFixed(1)}`}>
                    <div style={{width:`${o.blk.B1/maxIpc*100}%`,background:"#8E9DBE"}} className="transition-all duration-300"/>
                    <div style={{width:`${o.blk.B2/maxIpc*100}%`,background:"#0057B8"}} className="transition-all duration-300"/>
                    <div style={{width:`${o.blk.B3/maxIpc*100}%`,background:"#00C8F0"}} className="transition-all duration-300"/>
                  </div>
                  <p className="text-right font-bold text-lg font-mono text-slate-800">{o.ipc.toFixed(1)}</p>
                  <div>
                    <span className={cn("inline-block px-2 py-1 rounded text-[10px] font-mono uppercase text-white tracking-wider",NIVEL_CLS[nivel])}>{NIVEL_LABEL[nivel]}</span>
                    {travasOn&&o.travas.length>0&&<p className="text-[10px] font-mono text-red-500 mt-0.5">▲ {o.travas.join(" · ")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 flex-wrap items-center">
            {[{label:"Cadastro",color:"#8E9DBE"},{label:"Pipeline",color:"#0057B8"},{label:"Atividades",color:"#00C8F0"}].map(l=>(
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{background:l.color}}/>{l.label}
              </div>
            ))}
            <p className="ml-auto text-[10px] text-slate-400">Travas: IQC &lt; 70 · Higiene funil &lt; 60% · Receita &lt; 70%</p>
          </div>
        </div>

        {/* Funnel + Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-0.5">Funil e gates de conversão</h2>
            <p className="text-xs text-slate-400 mb-3">Ganho e Perdido são estados terminais. Gargalo = menor conversão entre etapas.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {computed.map((o,i)=>(
                <button key={o.v.id} onClick={()=>setFunilSel(i)}
                  className={cn("px-2.5 py-1 text-[11px] font-mono border rounded transition-all",
                    funilSel===i?"bg-slate-800 border-slate-800 text-white":"border-slate-200 text-slate-500 hover:border-slate-400"
                  )}>
                  {o.v.nome.split(" ")[0]}
                </button>
              ))}
            </div>
            {selComp&&<FunilView o={selComp}/>}
          </div>
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-0.5">Diagnóstico: Atividade × Pipeline</h2>
            <p className="text-xs text-slate-400 mb-4">Alto = ≥ 80% dos pontos do bloco. Separa esforço de eficácia.</p>
            <MatrixView computed={computed} travasOn={travasOn}/>
          </div>
        </div>

        {/* Scorecard colapsável */}
        <Scorecard computed={computed}/>
      </div>
    </Shell>
  );
}
