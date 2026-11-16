import { useEffect, useState } from 'react'
import { buscarHorarios, buscarCep, enviarAgendamento } from './agendamentoApi'
import { SERVICOS } from './servicos'
import { ESTADOS, formatarCEP, formatarCPF, hojeISO, soDigitos, validarFormulario } from './Validacoes'

const FORM_INICIAL = {
  nome: '',
  cpf: '',
  nascimento: '',
  telefone: '',
  email: '',
  cep: '',
  estado: '',
  cidade: '',
  bairro: '',
  rua: '',
  numero: '',
  servico: '',
  data: '',
  horario: '',
}

// Rótulo + campo + mensagem de erro. Fica FORA do componente principal
// para o campo não perder o foco a cada letra digitada.
function Campo({ id, label, erro, dica, cheio, children }) {
  return (
    <div className={'pub-campo' + (cheio ? ' pub-campo-cheio' : '')}>
      <label htmlFor={id}>{label}</label>
      {children}
      {dica && !erro && <p className="pub-dica">{dica}</p>}
      {erro && <p className="pub-erro" role="alert">{erro}</p>}
    </div>
  )
}

// Página de agendamento da área pública.
// Props: onVoltar() leva de volta à página inicial.
function Agendamento({ onVoltar }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [erros, setErros] = useState({}) // { campo: 'mensagem' }
  const [horarios, setHorarios] = useState([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState(null) // { tipo: 'sucesso' | 'erro', texto: '...' }

  // Sempre que o cliente escolhe (ou troca) a data, busca os horários na API.
  useEffect(() => {
    if (!form.data) {
      setHorarios([])
      return
    }

    let cancelado = false // evita atualizar a tela com uma resposta antiga
    setCarregandoHorarios(true)

    buscarHorarios(form.data)
      .then((lista) => {
        if (!cancelado) setHorarios(lista)
      })
      .catch(() => {
        if (!cancelado) {
          setHorarios([])
          setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar os horários. Tente novamente.' })
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoHorarios(false)
      })

    return () => {
      cancelado = true
    }
  }, [form.data])

  // CEP é opcional: quando o cliente digita os 8 números, tenta preencher o endereço sozinho.
  useEffect(() => {
    setAvisoCep('')
    if (soDigitos(form.cep).length !== 8) return

    let cancelado = false
    setBuscandoCep(true)

    buscarCep(form.cep)
      .then((endereco) => {
        if (cancelado) return
        if (!endereco) {
          setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.')
          return
        }
        setForm((atual) => ({
          ...atual,
          estado: endereco.estado || atual.estado,
          cidade: endereco.cidade || atual.cidade,
          bairro: endereco.bairro || atual.bairro,
          rua: endereco.rua || atual.rua,
        }))
        setErros((atual) => ({ ...atual, estado: '', cidade: '', bairro: '', rua: '' }))
      })
      .catch(() => {
        if (!cancelado) setAvisoCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
      })
      .finally(() => {
        if (!cancelado) setBuscandoCep(false)
      })

    return () => {
      cancelado = true
    }
  }, [form.cep])

  function handleChange(evento) {
    const { name, value } = evento.target
    let novoValor = value
    if (name === 'cpf') novoValor = formatarCPF(value)
    if (name === 'cep') novoValor = formatarCEP(value)

    setForm((atual) => ({
      ...atual,
      [name]: novoValor,
      // trocou a data: o horário escolhido antes deixa de valer
      ...(name === 'data' ? { horario: '' } : {}),
    }))
    // quem corrige o campo faz o erro dele sumir
    setErros((atual) => ({ ...atual, [name]: '', ...(name === 'data' ? { horario: '' } : {}) }))
  }

  function escolherHorario(horario) {
    setForm((atual) => ({ ...atual, horario }))
    setErros((atual) => ({ ...atual, horario: '' }))
  }

  // Atalho: props comuns de cada campo (id, nome, valor, mudança e estado de erro)
  function campo(nome) {
    return {
      id: nome,
      name: nome,
      value: form[nome],
      onChange: handleChange,
      'aria-invalid': erros[nome] ? 'true' : 'false',
    }
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setMensagem(null)

    const encontrados = validarFormulario(form)
    setErros(encontrados)

    const primeiroComErro = Object.keys(encontrados)[0]
    if (primeiroComErro) {
      setMensagem({ tipo: 'erro', texto: 'Confira os campos destacados em vermelho.' })
      const elemento = document.getElementById(primeiroComErro)
      if (elemento) elemento.focus()
      return
    }

    setEnviando(true)
    try {
      const resposta = await enviarAgendamento(form)
      setMensagem({
        tipo: 'sucesso',
        texto: `Consulta solicitada! Protocolo ${resposta.protocolo}. Entraremos em contato para confirmar.`,
      })
      setForm(FORM_INICIAL)
      setErros({})
      setHorarios([])
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro.message || 'Não foi possível enviar seu agendamento. Tente novamente.' })
      // o horário pode ter sido reservado agora há pouco: limpa a escolha e atualiza a lista
      setForm((atual) => ({ ...atual, horario: '' }))
      buscarHorarios(form.data).then(setHorarios).catch(() => {})
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="pub-secao">
      <button type="button" className="pub-voltar" onClick={onVoltar}>
        ← Voltar ao início
      </button>

      <h1>Agende sua consulta</h1>
      <p className="pub-sub">Preencha os dados abaixo e escolha o dia e o horário que ficam melhores para você. Campos com * são obrigatórios.</p>

      <form className="pub-form" onSubmit={handleSubmit} noValidate>
        <h3 className="pub-grupo">Dados pessoais</h3>

        <Campo id="nome" label="Nome completo *" erro={erros.nome} cheio>
          <input {...campo('nome')} type="text" placeholder="Seu nome" autoComplete="name" />
        </Campo>

        <Campo id="cpf" label="CPF *" erro={erros.cpf}>
          <input {...campo('cpf')} type="text" inputMode="numeric" placeholder="000.000.000-00" maxLength={14} />
        </Campo>

        <Campo id="nascimento" label="Data de nascimento *" erro={erros.nascimento}>
          <input {...campo('nascimento')} type="date" min="1900-01-01" max={hojeISO()} autoComplete="bday" />
        </Campo>

        <Campo id="telefone" label="Telefone *" erro={erros.telefone}>
          <input {...campo('telefone')} type="tel" placeholder="(00) 00000-0000" autoComplete="tel" />
        </Campo>

        <Campo id="email" label="E-mail" erro={erros.email}>
          <input {...campo('email')} type="email" placeholder="seu@email.com" autoComplete="email" />
        </Campo>

        <h3 className="pub-grupo">Endereço</h3>

        <Campo
          id="cep"
          label="CEP (opcional)"
          erro={erros.cep}
          dica={buscandoCep ? 'Buscando endereço...' : avisoCep || 'Se informar, o endereço é preenchido automaticamente.'}
        >
          <input {...campo('cep')} type="text" inputMode="numeric" placeholder="00000-000" maxLength={9} autoComplete="postal-code" />
        </Campo>

        <Campo id="estado" label="Estado *" erro={erros.estado}>
          <select {...campo('estado')}>
            <option value="">Selecione</option>
            {ESTADOS.map((estado) => (
              <option key={estado.sigla} value={estado.sigla}>{estado.nome}</option>
            ))}
          </select>
        </Campo>

        <Campo id="cidade" label="Cidade *" erro={erros.cidade}>
          <input {...campo('cidade')} type="text" placeholder="Sua cidade" autoComplete="address-level2" />
        </Campo>

        <Campo id="bairro" label="Bairro *" erro={erros.bairro}>
          <input {...campo('bairro')} type="text" placeholder="Seu bairro" />
        </Campo>

        <Campo id="rua" label="Rua *" erro={erros.rua}>
          <input {...campo('rua')} type="text" placeholder="Nome da rua" autoComplete="address-line1" />
        </Campo>

        <Campo id="numero" label="Número da casa *" erro={erros.numero}>
          <input {...campo('numero')} type="text" placeholder="Ex.: 123" maxLength={10} />
        </Campo>

        <h3 className="pub-grupo">Consulta</h3>

        <Campo id="servico" label="Serviço *" erro={erros.servico}>
          <select {...campo('servico')}>
            <option value="">Selecione</option>
            {SERVICOS.map((servico) => (
              <option key={servico.id} value={servico.id}>{servico.titulo}</option>
            ))}
          </select>
        </Campo>

        <Campo id="data" label="Data *" erro={erros.data}>
          <input {...campo('data')} type="date" min={hojeISO()} />
        </Campo>

        {form.data && (
          <div className="pub-campo pub-campo-cheio">
            <span className="pub-rotulo">Horário *</span>
            {carregandoHorarios && <p className="pub-aviso">Buscando horários disponíveis...</p>}
            {!carregandoHorarios && horarios.length === 0 && (
              <p className="pub-aviso">Nenhum horário disponível nesta data.</p>
            )}
            <div className="pub-horarios">
              {horarios.map((horario) => (
                <button
                  key={horario}
                  type="button"
                  className={`pub-horario ${form.horario === horario ? 'pub-horario-ativo' : ''}`}
                  aria-pressed={form.horario === horario}
                  onClick={() => escolherHorario(horario)}
                >
                  {horario}
                </button>
              ))}
            </div>
            {erros.horario && <p className="pub-erro" role="alert">{erros.horario}</p>}
          </div>
        )}

        {mensagem && (
          <p role="status" className={`pub-msg pub-msg-${mensagem.tipo} pub-campo-cheio`}>
            {mensagem.texto}
          </p>
        )}

        <button type="submit" className="pub-btn pub-campo-cheio" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Solicitar agendamento'}
        </button>
      </form>
    </section>
  )
}

export default Agendamento