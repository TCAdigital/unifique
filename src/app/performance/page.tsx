"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Loader2, Users, AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";

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
}

const IND: Ind[] = [
  { c:"1.1",b:"B1",n:"IQC — Índice de Qualidade de Cadastro",   u:"idx",  meta:85,   w:8,  dir:"max" },
  { c:"1.2",b:"B1",n:"Novas contas qualificadas (30 d)",         u:"qtd",  meta:25,   w:5,  dir:"max" },
  { c:"1.3",b:"B1",n:"Cobertura de carteira",                    u:"pct",  meta:60,   w:5,  dir:"max" },
  { c:"1.4",b:"B1",n:"Higiene da base (órfãs + duplicadas)",     u:"pct",  meta:3,    w:2,  dir:"min" },
  { c:"2.1",b:"B2",n:"Pipeline coverage",                        u:"mult", meta:3.5,  w:7,  dir:"max", src:"cov"   },
  { c:"2.2",b:"B2",n:"Taxa de conversão global",                 u:"pct",  meta:22,   w:8,  dir:"max", src:"conv"  },
  { c:"2.3",b:"B2",n:"Gates vs. baseline do time",               u:"pct",  meta:90,   w:8,  dir:"max", src:"gbase" },
  { c:"2.4",b:"B2",n:"Sales velocity (R$/dia)",                  u:"brl",  meta:6000, w:6,  dir:"max", src:"vel"   },
  { c:"2.5",b:"B2",n:"Higiene do funil",                         u:"pct",  meta:90,   w:7,  dir:"max" },
  { c:"2.6",b:"B2",n:"Acurácia de forecast",                     u:"pct",  meta:90,   w:5,  dir:"max" },
  { c:"2.7",b:"B2",n:"Disciplina de perda",                      u:"pct",  meta:100,  w:4,  dir:"max" },
  { c:"3.1",b:"B3",n:"Atividades de alto impacto (30 d)",        u:"qtd",  meta:40,   w:10, dir:"max" },
  { c:"3.2",b:"B3",n:"Cadência ativa",                           u:"pct",  meta:95,   w:8,  dir:"max" },
  { c:"3.3",b:"B3",n:"Efetividade da atividade",                 u:"pct",  meta:25,   w:7,  dir:"max" },
  { c:"3.4",b:"B3",n:"Densidade de toque",                       u:"ratio",meta:4,    w:5,  dir:"max", src:"dens"  },
  { c:"3.5",b:"B3",n:"SLA de 1º contato",                        u:"hrs",  meta:24,   w:5,  dir:"min" },
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

const NIVEL_LABEL = ["—","Crítico","Em desenvolvimento","Consistente","Alta Performance"];
const NIVEL_CLS   = ["","bg-red-500","bg-amber-500","bg-unifique-primary","bg-emerald-500"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunilData { prosp:number; qual:number; prop:number; neg:number; fech:number; ganho:number; perdido:number }
interface VendState {
  id:string; nome:string; perfil:string;
  f: FunilData;
  v: { pipe:number; meta:number; ticket:number; ciclo:number };
  m: Record<string,number>;
  receita:number;
  ativos_total:number;
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
  const mediaG = gates.reduce((s,g) => s+g.pct, 0) / gates.length;
  const conv   = sd(v.f.ganho, v.f.ganho + v.f.perdido);
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
      default:      r = v.m[i.c] ?? 0; break;
    }
    real[i.c] = r;
    const peso  = i.w * (pesos[i.b] / BLK[i.b].base);
    const razao = i.dir === "max" ? sd(r,i.meta) : sd(i.meta,r);
    pts[i.c]    = Math.min(razao, teto) * peso;
    blk[i.b]  += pts[i.c];
  });

  const ipc    = blk.B1+blk.B2+blk.B3;
  const nivel0 = ipc>=90?4 : ipc>=75?3 : ipc>=60?2 : 1;
  const travas: string[] = [];
  if ((v.m["1.1"]??0) < 70) travas.push("IQC baixo");
  if ((v.m["2.5"]??0) < 60) travas.push("funil sujo");
  if (v.receita < 70)        travas.push("receita <70%");
  const pctB2 = sd(blk.B2, pesos.B2);
  const pctB3 = sd(blk.B3, pesos.B3);
  const quad  = (pctB3>=0.8?"A":"B") + (pctB2>=0.8?"A":"B");
  return { gates, mediaG, conv, cov, vel, dens, gbase, real, pts, blk, ipc, nivel0, travas, quad, baseline };
}

function fmtVal(val:number, u:string): string {
  if (!isFinite(val)) val = 0;
  const n = (x:number,d:number) => x.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
  switch(u) {
    case "pct":   return n(val,1)+"%";
    case "mult":  return n(val,2)+"x";
    case "brl":   return "R$ "+Math.round(val).toLocaleString("pt-BR");
    case "hrs":   return Math.round(val)+" h";
    case "ratio": return n(val,1);
    default:      return n(val,1);
  }
}

// ─── DB rows ──────────────────────────────────────────────────────────────────

type NRow = {id:string;responsavel:string|null;fase:string;valor:number|null;prev_fechamento:string|null;created_at:string};
type ERow = {id:string;consultor_id:string|null;cnpj:string|null;segmento:string;porte:string|null;cidade:string|null;contato:string|null;email_contato:string|null;created_at:string};
type TRow = {id:string;empresa_id:string|null;negocio_id:string|null;tipo:string;prazo:string;status:string;created_at:string};
type URow = {id:string;nome:string;perfil:string};

function buildVend(u:URow, negs:NRow[], emps:ERow[], tars:TRow[]): VendState {
  const myNeg = negs.filter(n => n.responsavel === u.nome);
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

  const iqc = myEmp.length===0 ? 75 : Math.round(
    myEmp.reduce((s,e)=>{
      let sc=0;
      if (e.cnpj)                       sc+=25;
      if (e.segmento?.trim())           sc+=20;
      if (e.porte)                      sc+=20;
      if (e.cidade)                     sc+=20;
      if (e.contato||e.email_contato)   sc+=15;
      return s+sc;
    },0) / myEmp.length
  );

  const now=new Date();
  const d30=new Date(now); d30.setDate(d30.getDate()-30);
  const d90=new Date(now); d90.setDate(d90.getDate()-90);

  const novas = myEmp.filter(e=>new Date(e.created_at)>=d30).length;
  const empComAtiv = new Set(
    tars.filter(t=>t.empresa_id&&myEmpIds.has(t.empresa_id)&&new Date(t.created_at)>=d90).map(t=>t.empresa_id)
  );
  const cobertura = myEmp.length ? Math.round((empComAtiv.size/myEmp.length)*100) : 0;
  const higieneOk = openNeg.filter(n=>(n.valor??0)>0&&n.prev_fechamento&&new Date(n.prev_fechamento)>now).length;
  const higiene   = openNeg.length ? Math.round((higieneOk/openNeg.length)*100) : 90;
  const altoImpacto = tars.filter(t=>
    t.empresa_id&&myEmpIds.has(t.empresa_id)&&["Reunião","Call"].includes(t.tipo)&&new Date(t.created_at)>=d30
  ).length;
  const allAtiv = tars.filter(t=>t.empresa_id&&myEmpIds.has(t.empresa_id)&&new Date(t.created_at)>=d30).length;
  const negComNext = new Set(
    tars.filter(t=>t.negocio_id&&myNegIds.has(t.negocio_id)&&t.status==="Pendente"&&new Date(t.prazo)>=now).map(t=>t.negocio_id)
  );
  const cadencia = openNeg.length ? Math.round((negComNext.size/openNeg.length)*100) : 0;

  return {
    id:u.id, nome:u.nome, perfil:u.perfil, f,
    v:{pipe, meta:500000, ticket:Math.round(ticket), ciclo:75},
    m:{"1.1":iqc,"1.2":novas,"1.3":cobertura,"1.4":3,"2.5":higiene,"2.6":85,"2.7":90,"3.1":altoImpacto,"3.2":cadencia,"3.3":20,"3.5":24},
    receita:100, ativos_total:allAtiv,
  };
}

// ─── WeightSimulator ──────────────────────────────────────────────────────────

function WeightSimulator({ pesos, setPesos }:{pesos:Record<BlkKey,number>; setPesos:(p:Record<BlkKey,number>)=>void}) {
  const trackRef  = useRef<HTMLDivElement>(null);
  const dragging  = useRef<"h1"|"h2"|null>(null);
  const MIN = 5;

  function setFromPct(h1:number, h2:number) {
    const b1  = Math.round(Math.max(MIN, Math.min(h1, 100-2*MIN)));
    const b2t = Math.round(Math.max(b1+MIN, Math.min(h2, 100-MIN)));
    setPesos({ B1:b1, B2:b2t-b1, B3:100-b2t });
  }
  function getPct(cx:number) {
    if (!trackRef.current) return 0;
    const r = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((cx-r.left)/r.width)*100));
  }

  const PRESETS:[string,[number,number,number]][] = [
    ["Padrão 20/45/35",[20,45,35]], ["Hunter 25/40/35",[25,40,35]],
    ["Farmer 15/50/35",[15,50,35]], ["Resultado 10/70/20",[10,70,20]],
  ];
  const segs = [
    {k:"B1" as BlkKey, label:"Cadastro",   color:"#8E9DBE", left:0,               w:pesos.B1},
    {k:"B2" as BlkKey, label:"Pipeline",   color:"#0057B8", left:pesos.B1,         w:pesos.B2},
    {k:"B3" as BlkKey, label:"Atividades", color:"#00C8F0", left:pesos.B1+pesos.B2,w:pesos.B3},
  ];

  return (
    <div className="glass-card p-5">
      <h2 className="text-sm font-bold text-slate-700 mb-0.5">Distribuição dos 100 pontos</h2>
      <p className="text-xs text-slate-400 mb-4">Arraste os divisores para redistribuir pesos. Total sempre = 100.</p>
      <div
        ref={trackRef}
        className="relative h-14 rounded-lg overflow-hidden border border-slate-200 select-none touch-none"
        onPointerMove={e=>{ if (!dragging.current) return; const p=getPct(e.clientX); if (dragging.current==="h1") setFromPct(p,pesos.B1+pesos.B2); else setFromPct(pesos.B1,p); }}
        onPointerUp={()=>{ dragging.current=null; }}
        onPointerLeave={()=>{ dragging.current=null; }}
      >
        {segs.map(s=>(
          <div key={s.k} className="absolute top-0 bottom-0 flex flex-col justify-center pl-3 overflow-hidden"
            style={{left:`${s.left}%`,width:`${s.w}%`,background:s.color,transition:"left .1s,width .1s"}}>
            <span className="text-white font-bold text-xl leading-none">{pesos[s.k]}</span>
            <span className="text-white/80 text-[9px] uppercase tracking-wider font-mono">{s.label}</span>
          </div>
        ))}
        {(["h1","h2"] as const).map((h,i)=>{
          const lft = i===0 ? pesos.B1 : pesos.B1+pesos.B2;
          return (
            <div key={h}
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-10 flex items-center justify-center"
              style={{left:`${lft}%`}}
              onPointerDown={e=>{ dragging.current=h; (e.target as Element).setPointerCapture(e.pointerId); e.preventDefault(); }}
            >
              <div className="w-px h-full bg-white/50" />
              <div className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-600 shadow" />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        {PRESETS.map(([label,w])=>{
          const active = w[0]===pesos.B1&&w[1]===pesos.B2&&w[2]===pesos.B3;
          return (
            <button key={label} onClick={()=>setPesos({B1:w[0],B2:w[1],B3:w[2]})}
              className={cn("px-3 py-1.5 text-[11px] font-mono rounded border transition-all",
                active?"bg-slate-800 border-slate-800 text-white":"border-slate-200 text-slate-500 hover:border-slate-400"
              )}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FunilView ────────────────────────────────────────────────────────────────

function FunilView({ o }:{o:Computed}) {
  const f   = o.v.f;
  const max = f.prosp || 1;
  const piorIdx = o.gates.reduce((bi,g,i)=>g.pct<o.gates[bi].pct?i:bi, 0);
  return (
    <div className="space-y-0.5 text-sm">
      {ETAPAS.map((e,idx)=>{
        const q = f[e.k]; const g = o.gates[idx];
        return (
          <React.Fragment key={e.k}>
            <div className="grid items-center gap-2" style={{gridTemplateColumns:"110px 1fr 32px"}}>
              <div className="text-xs text-slate-600"><span className="font-mono text-slate-400 mr-1">{idx+1}</span>{e.n}</div>
              <div className="h-5 rounded bg-unifique-primary" style={{width:`${Math.max(sd(q,max)*100,1)}%`,transition:"width .3s"}} />
              <div className="text-right font-mono text-xs font-bold text-slate-700">{q}</div>
            </div>
            {g && (
              <div className={cn("grid items-center gap-2 mb-1 text-[10px] font-mono text-slate-400")} style={{gridTemplateColumns:"110px 1fr 32px"}}>
                <div className="text-right text-slate-300">{g.id}</div>
                <div className={cn("border-l-2 border-dotted border-slate-200 pl-2 flex gap-2 flex-wrap",idx===piorIdx&&"border-red-300")}>
                  <span className={cn("font-bold",idx===piorIdx?"text-red-500":"text-slate-600")}>{(g.pct*100).toFixed(1)}%</span>
                  <span className="text-red-400">−{g.leak}</span>
                  {idx===piorIdx && <span className="bg-red-500 text-white px-1 rounded text-[9px] uppercase">Gargalo</span>}
                </div>
                <div/>
              </div>
            )}
          </React.Fragment>
        );
      })}
      <div className="border-t border-slate-100 pt-2 mt-1 space-y-0.5">
        {([{k:"ganho",n:"✓ Ganho",color:"bg-emerald-500"},{k:"perdido",n:"✕ Perdido",color:"bg-red-400"}] as const).map(e=>(
          <div key={e.k} className="grid items-center gap-2" style={{gridTemplateColumns:"110px 1fr 32px"}}>
            <div className="text-xs text-slate-600">{e.n}</div>
            <div className={cn("h-5 rounded",e.color)} style={{width:`${Math.max(sd(f[e.k],max)*100,1)}%`,transition:"width .3s"}} />
            <div className="text-right font-mono text-xs font-bold text-slate-700">{f[e.k]}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 pt-2 mt-1 flex flex-wrap gap-4 text-[10px] font-mono text-slate-500">
        <span>Conv. global <strong className="text-slate-700">{(o.conv*100).toFixed(1)}%</strong></span>
        <span>Coverage <strong className="text-slate-700">{o.cov.toFixed(2)}x</strong></span>
        <span>Média gates <strong className="text-slate-700">{(o.mediaG*100).toFixed(1)}%</strong></span>
        <span>Baseline <strong className="text-slate-700">{(o.baseline*100).toFixed(1)}%</strong></span>
      </div>
    </div>
  );
}

// ─── MatrixView ───────────────────────────────────────────────────────────────

const QUAD_CFG = {
  AA:{label:"Alta performance real",   desc:"Processo e resultado alinhados. Replicar o padrão.",      cls:"good"},
  AB:{label:"Esforço sem direção",     desc:"Volume alto, funil fraco. Atacar ICP e pitch.",           cls:"bad" },
  BA:{label:"Herança de carteira",     desc:"Vive de base instalada. Exigir prospecção nova.",         cls:"warn"},
  BB:{label:"Disciplina e capacidade", desc:"Cadência e gestão de tempo. Acompanhamento semanal.",    cls:"bad" },
} as const;
const QUAD_CARD_CLS = { good:"bg-emerald-50 border-emerald-200", bad:"bg-red-50 border-red-200", warn:"bg-amber-50 border-amber-200" };

function MatrixCell({ q, byQuad, travasOn }:{q:keyof typeof QUAD_CFG; byQuad:Record<string,Computed[]>; travasOn:boolean}) {
  const cfg = QUAD_CFG[q]; const items = byQuad[q]??[];
  return (
    <div className={cn("rounded border p-3 min-h-20",QUAD_CARD_CLS[cfg.cls])}>
      <h3 className="font-bold text-xs text-slate-700 mb-0.5">{cfg.label}</h3>
      <p className="text-[11px] text-slate-500 mb-2 leading-snug">{cfg.desc}</p>
      <div className="flex flex-wrap gap-1">
        {items.map(o=>{
          const nivel = travasOn&&o.travas.length ? Math.min(o.nivel0,3) : o.nivel0;
          return (
            <span key={o.v.id} className={cn("text-white text-[10px] font-mono px-1.5 py-0.5 rounded",NIVEL_CLS[nivel])}>
              {o.v.nome.split(" ")[0]} · {o.ipc.toFixed(0)}
              {travasOn&&o.travas.length>0&&" ▲"}
            </span>
          );
        })}
        {items.length===0&&<span className="text-[10px] text-slate-400 italic">Nenhum</span>}
      </div>
    </div>
  );
}

function MatrixView({ computed, travasOn }:{computed:Computed[]; travasOn:boolean}) {
  const byQuad:Record<string,Computed[]> = {AA:[],AB:[],BA:[],BB:[]};
  computed.forEach(o=>{ if(byQuad[o.quad]) byQuad[o.quad].push(o); });
  return (
    <div className="grid gap-1" style={{gridTemplateColumns:"68px 1fr 1fr"}}>
      <div/>
      <div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-wider py-1">Pipeline baixo</div>
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

// ─── Tabela Funil ──────────────────────────────────────────────────────────────

const FUNIL_ROWS = [
  ...ETAPAS.map((e,i)=>({k:e.k,label:`${i+1}. ${e.n}`,grupo:"f"})),
  {k:"ganho",   label:"✓ Ganho (terminal)",    grupo:"f"},
  {k:"perdido", label:"✕ Perdido (terminal)",  grupo:"f"},
  {k:"pipe",    label:"Pipeline aberto (R$)",  grupo:"v"},
  {k:"meta",    label:"Meta do período (R$)",  grupo:"v"},
  {k:"ticket",  label:"Ticket médio (R$)",     grupo:"v"},
  {k:"ciclo",   label:"Ciclo médio (dias)",    grupo:"v"},
];

function FunilInput({ vendedores, onFunil, onValores }:{
  vendedores:VendState[];
  onFunil:(idx:number,key:string,val:number)=>void;
  onValores:(idx:number,key:string,val:number)=>void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-700">Dados do funil por vendedor</h2>
        <p className="text-xs text-slate-400 mt-0.5">Oportunidades que entraram em cada etapa no período. Edite para simular cenários.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-48">Item</th>
              {vendedores.map(v=>(
                <th key={v.id} className="px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">{v.nome.split(" ")[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {FUNIL_ROWS.map(row=>(
              <tr key={row.k} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600 font-medium">{row.label}</td>
                {vendedores.map((v,i)=>{
                  const val = row.grupo==="f"
                    ? v.f[row.k as keyof FunilData]
                    : v.v[row.k as "pipe"|"meta"|"ticket"|"ciclo"];
                  return (
                    <td key={v.id} className="px-3 py-2 text-center">
                      <input type="number" step="any" defaultValue={val} key={`${v.id}-${row.k}`}
                        onChange={e=>{ const n=parseFloat(e.target.value)||0; if(row.grupo==="f") onFunil(i,row.k,n); else onValores(i,row.k,n); }}
                        className="w-20 text-center border border-slate-200 rounded px-2 py-1 font-mono text-blue-700 bg-slate-50 focus:outline-none focus:border-unifique-primary"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tabela Indicadores ───────────────────────────────────────────────────────

function IndTable({ vendedores, computed, onManual, pesos }:{
  vendedores:VendState[]; computed:Computed[];
  onManual:(idx:number,key:string,val:number)=>void;
  pesos:Record<BlkKey,number>;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-700">Apuração dos 16 indicadores</h2>
        <p className="text-xs text-slate-400 mt-0.5">Campos azuis são de digitação. Marcados com <span className="text-teal-500">ƒ</span> são calculados automaticamente a partir do funil.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-56">Indicador</th>
              <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta</th>
              {vendedores.map(v=>(
                <th key={v.id} className="px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">{v.nome.split(" ")[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(["B1","B2","B3"] as BlkKey[]).map(b=>(
              <React.Fragment key={b}>
                <tr className="bg-slate-100/80">
                  <td colSpan={2+vendedores.length} className="px-4 py-2 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {BLK[b].nome} — {pesos[b]} pts
                  </td>
                </tr>
                {IND.filter(i=>i.b===b).map(i=>(
                  <tr key={i.c} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700"><span className="font-mono text-slate-400 mr-2">{i.c}</span>{i.n}</td>
                    <td className="px-3 py-2 text-center font-mono text-slate-500">{fmtVal(i.meta,i.u)}</td>
                    {computed.map((o,vi)=>{
                      const r=o.real[i.c]; const p=o.pts[i.c];
                      return (
                        <td key={o.v.id} className="px-3 py-2 text-center">
                          {i.src ? (
                            <>
                              <span className="font-mono text-slate-500">{fmtVal(r,i.u)}<span className="text-teal-500 text-[9px]"> ƒ</span></span>
                              <br/><span className="text-[11px] text-slate-400">{p.toFixed(1)} pts</span>
                            </>
                          ) : (
                            <>
                              <input type="number" step="any" defaultValue={o.v.m[i.c]??0} key={`${o.v.id}-${i.c}`}
                                onChange={e=>onManual(vi,i.c,parseFloat(e.target.value)||0)}
                                className="w-20 text-center border border-slate-200 rounded px-2 py-1 font-mono text-blue-700 bg-slate-50 focus:outline-none focus:border-unifique-primary"
                              />
                              <br/><span className="text-[11px] text-slate-400">{p.toFixed(1)} pts</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-2 font-bold text-slate-700">Subtotal {BLK[b].nome}</td>
                  <td className="px-3 py-2 text-center font-mono text-slate-600">{pesos[b]}</td>
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
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-2 text-slate-700 font-medium"><span className="font-mono text-slate-400 mr-2">—</span>Atingimento de receita</td>
              <td className="px-3 py-2 text-center font-mono text-slate-500">100%</td>
              {vendedores.map((v,vi)=>(
                <td key={v.id} className="px-3 py-2 text-center">
                  <input type="number" step="any" defaultValue={v.receita} key={`${v.id}-receita`}
                    onChange={e=>onManual(vi,"receita",parseFloat(e.target.value)||0)}
                    className="w-20 text-center border border-slate-200 rounded px-2 py-1 font-mono text-blue-700 bg-slate-50 focus:outline-none focus:border-unifique-primary"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [vendedores, setVendedores] = useState<VendState[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [pesos,      setPesos]      = useState<Record<BlkKey,number>>({B1:20,B2:45,B3:35});
  const [teto,       setTeto]       = useState(1.20);
  const [travasOn,   setTravasOn]   = useState(true);
  const [funilSel,   setFunilSel]   = useState(0);

  useEffect(()=>{
    async function load() {
      const [{ data:users },{ data:negs },{ data:emps },{ data:tars }] = await Promise.all([
        supabase.from("usuarios").select("id,nome,perfil").in("perfil",["consultor","preVenda"]).eq("ativo",true),
        supabase.from("negocios").select("id,responsavel,fase,valor,prev_fechamento,created_at"),
        supabase.from("empresas").select("id,consultor_id,cnpj,segmento,porte,cidade,contato,email_contato,created_at"),
        supabase.from("tarefas").select("id,empresa_id,negocio_id,tipo,prazo,status,created_at"),
      ]);
      const rawU = (users??[]) as URow[];
      const rawN = (negs??[])  as NRow[];
      const rawE = (emps??[])  as ERow[];
      const rawT = (tars??[])  as TRow[];
      setVendedores(rawU.map(u=>buildVend(u,rawN,rawE,rawT)));
      setLoading(false);
    }
    load();
  },[]);

  const computed = useMemo(():Computed[]=>{
    if (!vendedores.length) return [];
    const gs = vendedores.map(v=>{ const g=calcGates(v.f); return g.reduce((s,x)=>s+x.pct,0)/g.length; });
    const baseline = gs.reduce((s,x)=>s+x,0)/(gs.length||1);
    return vendedores.map(v=>({ v, ...calcIPC(v,pesos,teto,baseline) }));
  },[vendedores,pesos,teto]);

  const ranked = useMemo(()=>[...computed].sort((a,b)=>b.ipc-a.ipc),[computed]);
  const avgIpc = computed.length ? computed.reduce((s,o)=>s+o.ipc,0)/computed.length : 0;
  const altaPerf = computed.filter(o=>{ const n=travasOn&&o.travas.length?Math.min(o.nivel0,3):o.nivel0; return n===4; }).length;

  function updateFunil(idx:number, key:string, val:number) {
    setVendedores(prev=>prev.map((v,i)=>i!==idx?v:{...v,f:{...v.f,[key]:val}}));
  }
  function updateValores(idx:number, key:string, val:number) {
    setVendedores(prev=>prev.map((v,i)=>i!==idx?v:{...v,v:{...v.v,[key]:val}}));
  }
  function updateManual(idx:number, key:string, val:number) {
    if (key==="receita") setVendedores(prev=>prev.map((v,i)=>i!==idx?v:{...v,receita:val}));
    else setVendedores(prev=>prev.map((v,i)=>i!==idx?v:{...v,m:{...v.m,[key]:val},ativos_total:key==="3.1"?val:v.ativos_total}));
  }

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-3" size={24}/>Carregando dados de performance...
      </div>
    </Shell>
  );

  if (!vendedores.length) return (
    <Shell>
      <div className="glass-card p-12 text-center text-slate-400">
        <Users className="mx-auto mb-3 opacity-40" size={36}/>
        <p className="font-medium">Nenhum consultor encontrado.</p>
        <p className="text-sm mt-1">Cadastre usuários com perfil "consultor" ou "preVenda".</p>
      </div>
    </Shell>
  );

  const selComp = computed[Math.min(funilSel, computed.length-1)];

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold font-outfit text-slate-900">Performance Comercial — IPC</h1>
            <p className="text-sm text-slate-500 mt-0.5">Índice de Performance Comercial · {IND.length} indicadores · 3 blocos · dados auto-calculados do CRM</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            {[
              {label:"Vendedores",value:computed.length},
              {label:"IPC médio", value:avgIpc.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})},
              {label:"Alta perf.",value:`${altaPerf}/${computed.length}`},
            ].map(s=>(
              <div key={s.label} className="border-l-2 border-slate-200 pl-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                <p className="text-2xl font-bold font-mono text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simulator */}
        <WeightSimulator pesos={pesos} setPesos={setPesos}/>

        {/* Controls */}
        <div className="glass-card p-4 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teto por indicador</label>
            <input type="range" min={100} max={150} step={5} value={teto*100}
              onChange={e=>setTeto(+e.target.value/100)} className="w-28 accent-blue-600"/>
            <span className="font-mono text-sm font-bold text-slate-700">{Math.round(teto*100)}%</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={travasOn} onChange={e=>setTravasOn(e.target.checked)} className="accent-blue-600 w-4 h-4"/>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Aplicar travas de integridade</span>
          </label>
        </div>

        {/* Ranking */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-0.5">Ranking e classificação</h2>
          <p className="text-xs text-slate-400 mb-4">Travas rebaixam a classificação sem alterar o IPC — o score continua visível para diagnóstico.</p>
          <div className="space-y-2">
            {ranked.map((o,i)=>{
              const nivel  = travasOn&&o.travas.length ? Math.min(o.nivel0,3) : o.nivel0;
              const maxIpc = Math.max(...ranked.map(x=>x.ipc), 100);
              return (
                <div key={o.v.id} className="grid gap-3 items-center py-1"
                  style={{gridTemplateColumns:"28px 1.4fr 2.4fr 56px 1fr"}}>
                  <span className="font-mono text-xs text-slate-400">{String(i+1).padStart(2,"0")}</span>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{o.v.nome}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{o.v.perfil} · receita {o.v.receita}%</p>
                  </div>
                  <div className="h-6 rounded overflow-hidden bg-slate-100 flex"
                    title={`Cadastro ${o.blk.B1.toFixed(1)} · Pipeline ${o.blk.B2.toFixed(1)} · Atividades ${o.blk.B3.toFixed(1)}`}>
                    <div style={{width:`${o.blk.B1/maxIpc*100}%`,background:"#8E9DBE"}} className="transition-all duration-300"/>
                    <div style={{width:`${o.blk.B2/maxIpc*100}%`,background:"#0057B8"}} className="transition-all duration-300"/>
                    <div style={{width:`${o.blk.B3/maxIpc*100}%`,background:"#00C8F0"}} className="transition-all duration-300"/>
                  </div>
                  <p className="text-right font-bold text-lg font-mono text-slate-800">{o.ipc.toFixed(1)}</p>
                  <div>
                    <span className={cn("inline-block px-2 py-1 rounded text-[10px] font-mono uppercase text-white tracking-wider",NIVEL_CLS[nivel])}>
                      {NIVEL_LABEL[nivel]}
                    </span>
                    {travasOn&&o.travas.length>0&&(
                      <p className="text-[10px] font-mono text-red-500 mt-0.5">▲ {o.travas.join(" · ")}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 flex-wrap items-center">
            {[{label:"Cadastro",color:"#8E9DBE"},{label:"Pipeline",color:"#0057B8"},{label:"Atividades",color:"#00C8F0"}].map(l=>(
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm inline-block" style={{background:l.color}}/>
                {l.label}
              </div>
            ))}
            <p className="ml-auto text-[10px] text-slate-400">Travas: IQC &lt; 70 · Higiene funil &lt; 60% · Receita &lt; 70%</p>
          </div>
        </div>

        {/* Funnel + Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Funil e gates de conversão</h2>
                <p className="text-xs text-slate-400">Ganho e Perdido são estados terminais. Gargalo = menor conversão relativa.</p>
              </div>
            </div>
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
            {selComp && <FunilView o={selComp}/>}
          </div>

          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-0.5">Diagnóstico: Atividade × Pipeline</h2>
            <p className="text-xs text-slate-400 mb-4">Alto = ≥ 80% dos pontos do bloco. Separa esforço de eficácia.</p>
            <MatrixView computed={computed} travasOn={travasOn}/>
          </div>
        </div>

        {/* Tables */}
        <FunilInput vendedores={vendedores} onFunil={updateFunil} onValores={updateValores}/>
        <IndTable vendedores={vendedores} computed={computed} onManual={updateManual} pesos={pesos}/>

        {/* Info footer */}
        <div className="glass-card p-4 text-[11px] text-slate-400 font-mono">
          <span className="font-bold text-slate-500 mr-2">Campos auto-calculados:</span>
          IQC (completude do cadastro) · Novas contas (30 d) · Cobertura de carteira · Higiene do funil ·
          Pipeline coverage · Conversão global · Gates vs. baseline · Sales velocity · Atividades alto impacto · Cadência ativa · Densidade de toque.
          <span className="ml-2 font-bold text-slate-500">Edite</span> as células azuis para simular cenários.
        </div>
      </div>
    </Shell>
  );
}
