import Home from './Areapublica/Home.jsx'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import NovoAgendamentoModal from './components/NovoAgendamentoModal.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Agenda from './pages/Agenda.jsx'
import Pacientes from './pages/Pacientes.jsx'
import Prontuario from './pages/Prontuario.jsx'
import Financeiro from './pages/Financeiro.jsx'
import Relatorios from './pages/Relatorios.jsx'
import Configuracoes from './pages/Configuracoes.jsx'

// Botão "Sair" do painel: fica fixo no canto inferior esquerdo, embaixo do menu lateral.
const estiloBotaoSair = {
  position: 'fixed',
  left: 12,
  bottom: 16,
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--text-muted)',
  font: 'inherit',
  cursor: 'pointer',
}

export default function App() {
  // --- Autenticação (simples, só controla se mostra Login ou o app) ---
  const [logado, setLogado] = useState(false)

  // --- Navegação simples por estado: cada string representa uma "página" ---
  const [pagina, setPagina] = useState('dashboard')

  // --- Estado auxiliar: qual paciente está aberto no prontuário ---
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)

  // --- Estado do modal de novo agendamento ---
  const [modalAgendamentoAberto, setModalAgendamentoAberto] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false);

  function irParaPagina(nome) {
    setPagina(nome)
  }

  function abrirProntuario(paciente) {
    setPacienteSelecionado(paciente)
    setPagina('prontuario')
  }

  // Sai do painel e volta para a página inicial da área pública
  function sair() {
    setLogado(false)
    setMostrarLogin(false)
    setPagina('dashboard')
    setPacienteSelecionado(null)
    setModalAgendamentoAberto(false)
  }

  if (!logado) {
  if (!mostrarLogin) {
    return <Home onEntrar={() => setMostrarLogin(true)} />
  }
  return <Login onLogin={() => setLogado(true)} />
}

  function renderPagina() {
    switch (pagina) {
      case 'dashboard':
        return <Dashboard />
      case 'agenda':
        return <Agenda onNovoAgendamento={() => setModalAgendamentoAberto(true)} />
      case 'pacientes':
        return <Pacientes onAbrirPaciente={abrirProntuario} />
      case 'prontuario':
        return (
          <Prontuario
            paciente={pacienteSelecionado}
            onVoltar={() => setPagina('pacientes')}
            onTrocarPaciente={setPacienteSelecionado}
          />
        )
      case 'financeiro':
        return <Financeiro />
      case 'relatorios':
        return <Relatorios />
      case 'configuracoes':
        return <Configuracoes />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar page={pagina} onNavigate={irParaPagina} />
      <div className="main-area">
        <Topbar />
        {renderPagina()}
      </div>

      <button type="button" style={estiloBotaoSair} onClick={sair}>
        <LogOut size={18} /> Sair
      </button>

      {modalAgendamentoAberto && (
        <NovoAgendamentoModal onClose={() => setModalAgendamentoAberto(false)} />
      )}
    </div>
  )
}