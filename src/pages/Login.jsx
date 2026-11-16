import { useEffect, useState } from 'react'
import { Stethoscope, CalendarClock, Wallet, FileText, Eye, EyeOff } from 'lucide-react'
import { validarEmail, validarSenha, requisitosSenha } from './Validacao'
import { entrar, enviarCodigo, verificarCodigo, redefinirSenha, MODO_DEMO } from './AuthApi'
import './LoginExtras.css'

// E-mail que recebe as mensagens do "Fale conosco".
const EMAIL_CONTATO = 'www.gestodonto@gmail.com'
const ASSUNTO_CONTATO = 'Contato - Gestão Odontológica'
const MENSAGEM_CONTATO = 'Olá! Gostaria de saber mais sobre o sistema de gestão odontológica.'

// mailto: abre o programa de e-mail do visitante já com tudo preenchido.
// Para abrir direto o Gmail no navegador, use este endereço no lugar:
// `https://mail.google.com/mail/?view=cm&to=${EMAIL_CONTATO}&su=${encodeURIComponent(ASSUNTO_CONTATO)}&body=${encodeURIComponent(MENSAGEM_CONTATO)}`
const LINK_CONTATO = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(ASSUNTO_CONTATO)}&body=${encodeURIComponent(MENSAGEM_CONTATO)}`

// Os componentes abaixo ficam FORA do Login para o campo não perder o foco a cada letra digitada.

function Campo({ id, label, erro, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={erro ? 'true' : 'false'} {...props} />
      {erro && <p className="login-erro" role="alert">{erro}</p>}
    </div>
  )
}

function CampoSenha({ id, label, erro, ...props }) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="login-senha">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          aria-invalid={erro ? 'true' : 'false'}
          {...props}
        />
        <button
          type="button"
          className="login-olho"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisivel((v) => !v)}
        >
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {erro && <p className="login-erro" role="alert">{erro}</p>}
    </div>
  )
}

function Aviso({ aviso }) {
  if (!aviso) return null
  return (
    <p role="status" className={`login-aviso login-aviso-${aviso.tipo}`}>
      {aviso.texto}
    </p>
  )
}

export default function Login({ onLogin }) {
  const [tela, setTela] = useState('login') // 'login' | 'email' | 'codigo' | 'nova'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [codigoDemo, setCodigoDemo] = useState('')
  const [erros, setErros] = useState({})
  const [aviso, setAviso] = useState(null) // { tipo: 'sucesso' | 'erro', texto: '...' }
  const [carregando, setCarregando] = useState(false)
  const [segundos, setSegundos] = useState(0) // espera para reenviar o código

  // Contagem regressiva do "Reenviar código".
  useEffect(() => {
    if (segundos <= 0) return
    const temporizador = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(temporizador)
  }, [segundos])

  function irPara(novaTela) {
    setTela(novaTela)
    setErros({})
    setAviso(null)
  }

  // Links "falsos" (<a href="#">) fazem a ação sem recarregar a página.
  function aoClicar(acao) {
    return (evento) => {
      evento.preventDefault()
      acao()
    }
  }

  // ---------- Login ----------
  async function handleSubmit(e) {
    e.preventDefault()
    const novosErros = { email: validarEmail(email), senha: validarSenha(senha) }
    setErros(novosErros)
    setAviso(null)
    if (novosErros.email || novosErros.senha) return

    setCarregando(true)
    try {
      await entrar({ email, senha })
      onLogin()
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não foi possível entrar. Tente novamente.' })
    } finally {
      setCarregando(false)
    }
  }

  // ---------- Recuperar senha: 1) e-mail ----------
  async function handleEnviarCodigo(e) {
    if (e) e.preventDefault()
    const erroEmail = validarEmail(email)
    setErros({ email: erroEmail })
    setAviso(null)
    if (erroEmail) return

    const reenvio = tela === 'codigo'
    setCarregando(true)
    try {
      const resposta = await enviarCodigo(email)
      setCodigoDemo(resposta.codigoDemo || '')
      setCodigo('')
      setSegundos(30)
      setTela('codigo')
      if (reenvio) setAviso({ tipo: 'sucesso', texto: 'Novo código enviado.' })
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não foi possível enviar o código. Tente novamente.' })
    } finally {
      setCarregando(false)
    }
  }

  // ---------- Recuperar senha: 2) código ----------
  async function handleVerificarCodigo(e) {
    e.preventDefault()
    if (codigo.length !== 6) {
      setErros({ codigo: 'Digite os 6 dígitos do código.' })
      return
    }

    setCarregando(true)
    try {
      await verificarCodigo(email, codigo)
      irPara('nova')
    } catch (erro) {
      setErros({ codigo: erro.message })
    } finally {
      setCarregando(false)
    }
  }

  // ---------- Recuperar senha: 3) nova senha ----------
  async function handleNovaSenha(e) {
    e.preventDefault()
    setAviso(null)

    if (validarSenha(novaSenha)) {
      setErros({})
      setAviso({ tipo: 'erro', texto: 'A nova senha ainda não atende a todos os requisitos.' })
      return
    }
    if (novaSenha !== confirmar) {
      setErros({ confirmar: 'As senhas não coincidem.' })
      return
    }
    setErros({})

    setCarregando(true)
    try {
      await redefinirSenha({ email, codigo, novaSenha })
      setSenha('')
      setNovaSenha('')
      setConfirmar('')
      setCodigo('')
      irPara('login')
      setAviso({ tipo: 'sucesso', texto: 'Senha alterada com sucesso! Entre com a nova senha.' })
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-hero">
        <div className="sidebar-logo" style={{ padding: 0, marginBottom: 24 }}>
          <div className="icon" style={{ width: 46, height: 46 }}><Stethoscope size={24} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem' }}>Gestão Odontológica</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gestão Odontológica</div>
          </div>
        </div>
        <h1>Mais organização<br />para o seu consultório.</h1>
        <p>Mais sorrisos para seus pacientes.</p>

        <div className="login-feature"><CalendarClock size={18} color="var(--teal-light)" /> Agendamentos inteligentes</div>
        <div className="login-feature"><Wallet size={18} color="var(--teal-light)" /> Controle financeiro completo</div>
        <div className="login-feature"><FileText size={18} color="var(--teal-light)" /> Prontuário eletrônico</div>
      </div>

      <div className="login-form-side">
        {tela === 'login' && (
          <form className="login-box" onSubmit={handleSubmit} noValidate>
            <h2>Bem-vindo de volta!</h2>
            <p className="subtitle">Faça login para acessar o seu painel.</p>
            <Aviso aviso={aviso} />

            <Campo
              id="login-email"
              label="E-mail"
              type="email"
              placeholder="seu@gmail.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erro={erros.email}
            />

            <CampoSenha
              id="login-senha"
              label="Senha"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              erro={erros.senha}
            />

            <div className="login-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" style={{ width: 'auto' }} defaultChecked /> Lembrar de mim
              </label>
              <a href="#" onClick={aoClicar(() => irPara('email'))}>Esqueceu sua senha?</a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="login-footer">
              Ainda não tem uma conta? <a href={LINK_CONTATO}>Fale conosco</a>
            </div>
          </form>
        )}

        {tela === 'email' && (
          <form className="login-box" onSubmit={handleEnviarCodigo} noValidate>
            <h2>Esqueceu sua senha?</h2>
            <p className="subtitle">Informe seu e-mail e enviaremos um código de verificação.</p>
            <Aviso aviso={aviso} />

            <Campo
              id="rec-email"
              label="E-mail"
              type="email"
              placeholder="seu@gmail.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erro={erros.email}
            />

            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Enviando...' : 'Enviar código'}
            </button>

            <div className="login-footer">
              <a href="#" onClick={aoClicar(() => irPara('login'))}>Voltar ao login</a>
            </div>
          </form>
        )}

        {tela === 'codigo' && (
          <form className="login-box" onSubmit={handleVerificarCodigo} noValidate>
            <h2>Digite o código</h2>
            <p className="subtitle">
              Enviamos um código de 6 dígitos para <strong>{email.trim()}</strong>.
            </p>
            <Aviso aviso={aviso} />

            {MODO_DEMO && codigoDemo && (
              <p className="login-demo">
                Modo demonstração: nenhum e-mail real foi enviado. Seu código é{' '}
                <strong>{codigoDemo}</strong>.
              </p>
            )}

            <Campo
              id="rec-codigo"
              label="Código de verificação"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              erro={erros.codigo}
            />

            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Verificando...' : 'Verificar código'}
            </button>

            <div className="login-footer login-footer-duplo">
              {segundos > 0 ? (
                <span>Reenviar código em {segundos}s</span>
              ) : (
                <a href="#" onClick={carregando ? aoClicar(() => {}) : handleEnviarCodigo}>Reenviar código</a>
              )}
              <a href="#" onClick={aoClicar(() => irPara('email'))}>Trocar e-mail</a>
            </div>
          </form>
        )}

        {tela === 'nova' && (
          <form className="login-box" onSubmit={handleNovaSenha} noValidate>
            <h2>Crie uma nova senha</h2>
            <p className="subtitle">Código confirmado. Defina a nova senha de acesso.</p>
            <Aviso aviso={aviso} />

            <CampoSenha
              id="nova-senha"
              label="Nova senha"
              placeholder="Digite a nova senha"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />

            <ul className="login-requisitos">
              {requisitosSenha(novaSenha).map((requisito) => (
                <li key={requisito.id} className={requisito.ok ? 'login-req-ok' : ''}>
                  <span aria-hidden="true">{requisito.ok ? '✓' : '○'}</span> {requisito.texto}
                </li>
              ))}
            </ul>

            <CampoSenha
              id="nova-confirmar"
              label="Confirmar nova senha"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              erro={erros.confirmar}
            />

            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
