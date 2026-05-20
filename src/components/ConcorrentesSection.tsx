"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Concorrente } from '@/types';
import { ShieldAlert, Plus, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  negocioId: string | null;
}

const BLANK = { nome: '', site: '', forcas: '', fraquezas: '' };

export function ConcorrentesSection({ negocioId }: Props) {
  const [concorrentes, setConcorrentes] = useState<Concorrente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!negocioId) { setConcorrentes([]); return; }
    supabase
      .from('concorrentes')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setConcorrentes(data); });
  }, [negocioId]);

  async function handleAdd() {
    if (!form.nome.trim() || !negocioId) return;
    setSaving(true);
    const { data } = await supabase
      .from('concorrentes')
      .insert({ negocio_id: negocioId, nome: form.nome.trim(), site: form.site.trim() || null, forcas: form.forcas.trim() || null, fraquezas: form.fraquezas.trim() || null })
      .select()
      .single();
    setSaving(false);
    if (data) { setConcorrentes(prev => [...prev, data]); setForm(BLANK); setShowForm(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('concorrentes').delete().eq('id', id);
    setDeletingId(null);
    setConcorrentes(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-slate-400" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concorrentes</p>
          {concorrentes.length > 0 && (
            <span className="bg-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-slate-500">{concorrentes.length}</span>
          )}
        </div>
        {negocioId && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-xs font-bold text-unifique-primary hover:underline"
          >
            <Plus size={12} /> Novo
          </button>
        )}
      </div>

      {!negocioId && (
        <p className="text-xs text-slate-400 italic">Salve o negócio para adicionar concorrentes.</p>
      )}

      {showForm && (
        <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-2">
          <input
            type="text"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do concorrente *"
            autoFocus
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white"
          />
          <input
            type="text"
            value={form.site}
            onChange={e => setForm(f => ({ ...f, site: e.target.value }))}
            placeholder="Site (ex: concorrente.com.br)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white"
          />
          <textarea
            value={form.forcas}
            onChange={e => setForm(f => ({ ...f, forcas: e.target.value }))}
            placeholder="Forças"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white resize-none"
          />
          <textarea
            value={form.fraquezas}
            onChange={e => setForm(f => ({ ...f, fraquezas: e.target.value }))}
            placeholder="Fraquezas"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary bg-white resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.nome.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-unifique-primary text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Adicionar
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(BLANK); }}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {concorrentes.length > 0 && (
        <div className="space-y-2">
          {concorrentes.map(c => (
            <div key={c.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className="text-sm font-bold text-slate-800">{c.nome}</span>
                  {c.site && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{c.site}</span>}
                  {expandedId === c.id ? <ChevronUp size={12} className="text-slate-400 flex-shrink-0 ml-auto" /> : <ChevronDown size={12} className="text-slate-400 flex-shrink-0 ml-auto" />}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all flex-shrink-0"
                >
                  {deletingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              </div>
              {expandedId === c.id && (c.forcas || c.fraquezas) && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-2">
                  {c.forcas && (
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Forças</p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.forcas}</p>
                    </div>
                  )}
                  {c.fraquezas && (
                    <div>
                      <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Fraquezas</p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.fraquezas}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
