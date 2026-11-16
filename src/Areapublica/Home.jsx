import { useState } from 'react'
import Agendamento from './Agendamento'
import { SERVICOS } from './servicos'
import './Home.css'

// Área pública do site: começa na página inicial e,
// pelo botão "Agendar consulta", abre a página de agendamento.
// Props: onEntrar() abre o login do profissional (usado pelo App.jsx).
function Home({ onEntrar }) {
  const [pagina, setPagina] = useState('inicio') // 'inicio' | 'agendar'

  function irPara(destino) {
    setPagina(destino)
    window.scrollTo(0, 0)
  }

  return (
    <div className="pub">
      <header className="pub-header">
        <button type="button" className="pub-marca" onClick={() => irPara('inicio')} aria-label="Ir para o início">
          <span className="pub-logo" aria-hidden="true">🦷</span>
          <span className="pub-marca-texto">
            <strong>Gestão Odontológica</strong>
            <small>Clínica Odontológica</small>
          </span>
        </button>
        <button type="button" className="pub-btn pub-btn-contorno" onClick={onEntrar}>
          Área do profissional
        </button>
      </header>

      <main className="pub-conteudo">
        {pagina === 'inicio' && (
          <>
            <section className="pub-hero">
              <h1>Mais sorrisos, com a atenção que você merece.</h1>
              <p>Agende sua consulta online em poucos minutos, escolhendo o dia e o horário que ficam melhores para você.</p>
              <button type="button" className="pub-btn" onClick={() => irPara('agendar')}>
                Agendar consulta
              </button>
            </section>

            <section className="pub-secao">
              <h2>Nossos serviços</h2>
              <div className="pub-servicos">
                {SERVICOS.map((servico) => (
                  <article key={servico.id} className="pub-cartao">
                    <h3>{servico.titulo}</h3>
                    <p>{servico.descricao}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="pub-secao pub-cta">
              <h2>Pronto para cuidar do seu sorriso?</h2>
              <p>Escolha o serviço, o dia e o horário em poucos minutos.</p>
              <button type="button" className="pub-btn" onClick={() => irPara('agendar')}>
                Agendar consulta
              </button>
            </section>
          </>
        )}

        {pagina === 'agendar' && <Agendamento onVoltar={() => irPara('inicio')} />}
      </main>

      <footer className="pub-rodape">
        <small>© Gestão Odontológica</small>
      </footer>
    </div>
  )
}

export default Home
