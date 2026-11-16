import { useState } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { pacientes, historicoPaciente } from '../mockData'
import { listarPacientesPublicos } from '../Areapublica/agendamentoApi'

const tabs = ['Histórico', 'Anamnese', 'Exames', 'Tratamentos', 'Observações']

// "2000-05-17" -> idade em anos
function calcularIdade(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const hoje = new Date()
  let idade = hoje.getFullYear() - ano
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade -= 1
  return idade
}

const selectStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-main)',
}

// Props:
//   paciente           paciente aberto (ou null quando o menu abre o prontuário direto)
//   onVoltar           volta para a lista de pacientes
//   onTrocarPaciente   escolhe outro paciente pela lista do topo
export default function Prontuario({ paciente, onVoltar, onTrocarPaciente }) {
  const [tab, setTab] = useState('Histórico')
  // Pacientes de exemplo + clientes da área pública que já tiveram agendamento confirmado
  const [todos] = useState(() => [...pacientes, ...listarPacientesPublicos()])

  function trocarPaciente(evento) {
    const escolhido = todos.find((p) => String(p.id) === evento.target.value)
    if (onTrocarPaciente) onTrocarPaciente(escolhido || null)
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={onVoltar}>
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="field" style={{ maxWidth: 360, marginBottom: 16 }}>
        <label htmlFor="prontuario-paciente">Paciente</label>
        <select
          id="prontuario-paciente"
          style={selectStyle}
          value={paciente ? String(paciente.id) : ''}
          onChange={trocarPaciente}
        >
          <option value="">Selecione um paciente</option>
          {todos.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.nome}</option>
          ))}
        </select>
      </div>

      {!paciente && (
        <div className="card muted">Selecione um paciente na lista acima para ver o prontuário.</div>
      )}

      {paciente && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="flex-between">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="person-avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
                  {paciente.nome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{paciente.nome}</h2>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    {paciente.nascimentoISO ? calcularIdade(paciente.nascimentoISO) : 'x'} anos · CPF {paciente.cpf || '000.000.000-00'} · {paciente.telefone}
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary"><Pencil size={14} /> Editar</button>
            </div>
          </div>

          <div className="tabs">
            {tabs.map((t) => (
              <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {tab === 'Histórico' && (
            <div className="grid grid-2">
              <div className="card">
                <h3 className="card-title">Últimos atendimentos</h3>
                {historicoPaciente.map((h, i) => (
                  <div className="list-row" key={i}>
                    <div>
                      <div>{h.data}</div>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>{h.procedimento} · {h.profissional}</div>
                    </div>
                    <span className="badge badge-ok">{h.status}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="card-title">Anamnese</h3>
                <p className="muted" style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--text-main)' }}>Alergias</strong><br />Não informado</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--text-main)' }}>Medicações em uso</strong><br />Não informado</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--text-main)' }}>Histórico médico</strong><br />Sem alterações</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--text-main)' }}>Observações</strong><br />Paciente relatou sensibilidade ao frio</p>
              </div>
            </div>
          )}

          {tab !== 'Histórico' && (
            <div className="card muted">Conteúdo da aba "{tab}" ainda não implementado.</div>
          )}
        </>
      )}
    </div>
  )
}