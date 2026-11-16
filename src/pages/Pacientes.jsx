import { useState } from 'react'
import { Plus, MoreVertical } from 'lucide-react'
import { pacientes } from '../mockData'
import { listarPacientesPublicos } from '../Areapublica/agendamentoApi'

function iniciais(nome) {
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('')
}

export default function Pacientes({ onAbrirPaciente }) {
  // Pacientes de exemplo + clientes da área pública que já tiveram agendamento confirmado
  const [todos] = useState(() => [...pacientes, ...listarPacientesPublicos()])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Pacientes</h1>
        <button className="btn btn-primary"><Plus size={16} /> Novo Paciente</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Data de Nascimento</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {todos.map((p) => (
              <tr key={p.id} className="clickable" onClick={() => onAbrirPaciente(p)}>
                <td>
                  <div className="person-cell">
                    <div className="person-avatar">{iniciais(p.nome)}</div>
                    {p.nome}
                  </div>
                </td>
                <td className="muted">{p.telefone}</td>
                <td className="muted">{p.nascimento}</td>
                <td><span className="badge badge-ok">{p.status}</span></td>
                <td><MoreVertical size={16} color="var(--text-muted)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}