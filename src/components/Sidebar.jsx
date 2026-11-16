import { LayoutDashboard, CalendarDays, Users, FileText, Wallet, BarChart3, Settings, Stethoscope } from 'lucide-react'

const links = [
  { key: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'pacientes', label: 'Pacientes', icon: Users },
  { key: 'prontuarios', label: 'Prontuários', icon: FileText },
  { key: 'financeiro', label: 'Financeiro', icon: Wallet },
  { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { key: 'configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar({ page, onNavigate }) {
  // Prontuário é acessado a partir da lista de pacientes. Quando estamos vendo
  // um prontuário, o item de menu "Prontuários" fica destacado.
  const activeKey = page === 'prontuario' ? 'prontuarios' : page

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="icon"><Stethoscope size={18} /></div>
        <span>Gestão Odontologica</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={'sidebar-link' + (activeKey === key ? ' active' : '')}
            onClick={() => onNavigate(key === 'prontuarios' ? 'prontuario' : key)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}