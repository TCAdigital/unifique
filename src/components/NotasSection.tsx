"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Nota } from '@/types';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';

interface Props {
  entidadeId: string | null;
  entidadeTipo: 'empresas' | 'negocios' | 'tarefas';
}

export function NotasSection({ entidadeId, entidadeTipo }: Props) {
  const { user } = useAuth();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entidadeId) { setNotas([]); return; }
    supabase
      .from('notas')
      .select('*')
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setNotas(data); });
  }, [entidadeId, entidadeTipo]);

  async function addNota() {
    if (!texto.trim() || !entidadeId) return;
    setSaving(true);
    const { data } = await supabase
      .from('notas')
      .insert({ entidade_tipo: entidadeTipo, entidade_id: entidadeId, conteudo: texto.trim(), autor: user?.nome ?? 'Sistema' })
      .select()
      .single();
    setSaving(false);
    if (data) { setNotas(prev => [data, ...prev]); setTexto(''); }
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-slate-400" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas</p>
      </div>

      {!entidadeId ? (
        <p className="text-xs text-slate-400 italic">Salve o registro para adicionar notas.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNota(); }}
              placeholder="Adicionar nota... (Ctrl+Enter para salvar)"
              rows={2}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-unifique-primary transition-all resize-none"
            />
            <button
              onClick={addNota}
              disabled={saving || !texto.trim()}
              className="px-3 py-2 bg-unifique-primary text-white rounded-lg disabled:opacity-50 transition-all self-end"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </div>

          {notas.length > 0 && (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {notas.map(nota => (
                <div key={nota.id} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{nota.conteudo}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {nota.autor} · {new Date(nota.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
