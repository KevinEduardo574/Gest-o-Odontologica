import { useState } from 'react'
import { Plus } from 'lucide-react'
import { agendaHoje } from '../mockData'
import { listarAgendamentos, atualizarStatusAgendamento } from '../Areapublica/agendamentoApi'

const corStatus = {
  Confirmado: '#34d399',
  Pendente: '#fbbf24',
  Cancelado: '#f87171',
}

// A lista de exemplo do grupo (agendaHoje) representa esta data.
const DATA_EXEMPLO = '2026-09-10'

function classeBadge(status) {
  return 'badge ' + (status === 'Confirmado' ? 'badge-ok' : status === 'Pendente' ? 'badge-warn' : 'badge-danger')
}

// "2026-11-20" -> "20/11/2026"
function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const botaoPequeno = { padding: '6px 12px', fontSize: '0.8rem' }

export default function Agenda({ onNovoAgendamento }) {
  // Pedidos enviados pela área pública (ficam salvos no navegador)
  const [solicitacoes, setSolicitacoes] = useState(() => listarAgendamentos())

  function mudarStatus(id, status) {
    setSolicitacoes(atualizarStatusAgendamento(id, status))
  }

  // Lista principal: os de exemplo + os pedidos já CONFIRMADOS, em ordem de data e hora.
  const agendaCompleta = [
    ...agendaHoje.map((a) => ({
      chave: `exemplo-${a.hora}`,
      data: DATA_EXEMPLO,
      hora: a.hora,
      nome: a.nome,
      tipo: a.tipo,
      status: a.status,
      publico: false,
    })),
    ...solicitacoes
      .filter((s) => s.status === 'Confirmado')
      .map((s) => ({
        chave: s.id,
        id: s.id,
        data: s.data,
        hora: s.horario,
        nome: s.nome,
        tipo: `${s.servicoNome} · ${formatarData(s.data)}`,
        status: s.status,
        publico: true,
      })),
  ].sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`))

  // Caixa de solicitações: o que ainda não foi confirmado (pendentes e cancelados)
  const aguardando = solicitacoes.filter((s) => s.status !== 'Confirmado')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Quarta-feira, 10 de Setembro de 2026</p>
        </div>
        <button className="btn btn-primary" onClick={onNovoAgendamento}>
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      <div className="card">
        {agendaCompleta.map((a) => (
          <div
            key={a.chave}
            className="list-row"
            style={{ borderLeft: `3px solid ${corStatus[a.status]}`, paddingLeft: 12, marginBottom: 8, borderRadius: 6 }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <span className="muted" style={{ width: 50 }}>{a.hora}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{a.nome}</div>
                <div className="muted" style={{ fontSize: '0.78rem' }}>{a.tipo}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={classeBadge(a.status)}>{a.status}</span>
              {a.publico && (
                <button className="btn btn-secondary" style={botaoPequeno} onClick={() => mudarStatus(a.id, 'Cancelado')}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Solicitações da área pública ({aguardando.length})</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.8rem' }}>
          Ao confirmar, o pedido vai para a agenda acima e o cliente é cadastrado em Pacientes.
        </p>

        {aguardando.length === 0 && (
          <p className="muted">Nenhuma solicitação aguardando. Os pedidos feitos pelos clientes no site aparecem aqui.</p>
        )}

        {aguardando.map((s) => (
          <div
            key={s.id}
            className="list-row"
            style={{ borderLeft: `3px solid ${corStatus[s.status]}`, paddingLeft: 12, marginBottom: 8, borderRadius: 6 }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <span className="muted" style={{ width: 80 }}>
                {formatarData(s.data)}
                <br />
                {s.horario}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{s.nome}</div>
                <div className="muted" style={{ fontSize: '0.78rem' }}>
                  {s.servicoNome} · {s.telefone}
                  {s.email ? ` · ${s.email}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className={classeBadge(s.status)}>{s.status}</span>
              {s.status === 'Pendente' && (
                <>
                  <button className="btn btn-primary" style={botaoPequeno} onClick={() => mudarStatus(s.id, 'Confirmado')}>
                    Confirmar
                  </button>
                  <button className="btn btn-secondary" style={botaoPequeno} onClick={() => mudarStatus(s.id, 'Cancelado')}>
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}