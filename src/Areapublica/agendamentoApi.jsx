// Camada de dados dos agendamentos (área pública + painel).
//
// POR ENQUANTO os dados ficam no localStorage do navegador, porque o grupo
// ainda não definiu o banco de dados. Isso significa que os agendamentos só
// aparecem no MESMO navegador e no MESMO endereço (ex.: localhost:5173).
//
// Quando o banco existir (Supabase, API do grupo...), só o corpo das funções
// abaixo muda. O Home, o Agendamento e a Agenda continuam iguais.
//
// ATENÇÃO: o CPF e o endereço são dados pessoais. No localStorage servem só para
// esta demonstração. Num sistema real eles devem ficar num banco com acesso
// controlado, nunca guardados no navegador.

import { SERVICOS } from './servicos'
import { soDigitos, validarFormulario, formatarDataBR } from './Validacoes'

const CHAVE = 'gestao-odontologica:agendamentos'
const HORARIOS_BASE = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Lê a lista salva. Se não houver nada (ou estiver corrompido), devolve [].
function ler() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function gravar(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    throw new Error('Não foi possível salvar o agendamento neste navegador.')
  }
}

// ---------- Pacientes vindos da área pública ----------
// Quando o profissional confirma um agendamento, o cliente é cadastrado como paciente.
// Ficam guardados à parte e são somados aos pacientes de exemplo na tela de Pacientes.

const CHAVE_PACIENTES = 'gestao-odontologica:pacientes-publicos'

function lerPacientes() {
  try {
    const bruto = localStorage.getItem(CHAVE_PACIENTES)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function gravarPacientes(lista) {
  try {
    localStorage.setItem(CHAVE_PACIENTES, JSON.stringify(lista))
  } catch {
    throw new Error('Não foi possível salvar o paciente neste navegador.')
  }
}

function montarPaciente(agendamento) {
  const chave = soDigitos(agendamento.telefone)
  return {
    id: `pub-${chave || agendamento.id}`,
    nome: agendamento.nome,
    telefone: agendamento.telefone,
    email: agendamento.email,
    cpf: agendamento.cpf || '',
    nascimento: agendamento.nascimento ? formatarDataBR(agendamento.nascimento) : '—',
    nascimentoISO: agendamento.nascimento || '',
    endereco: agendamento.endereco || null,
    status: 'Ativo',
    origem: 'Área pública',
    telefoneChave: chave,
  }
}

// Cadastra o paciente se ainda não existir (o telefone identifica a pessoa).
// Se já existia de antes, mas sem CPF (cadastro antigo), completa com os dados novos.
function registrarPaciente(agendamento) {
  const lista = lerPacientes()
  const chave = soDigitos(agendamento.telefone)
  const existente = lista.find((p) => p.telefoneChave === chave)

  if (!existente) {
    gravarPacientes([...lista, montarPaciente(agendamento)])
    return
  }
  if (!existente.cpf && agendamento.cpf) {
    const completo = { ...montarPaciente(agendamento), id: existente.id }
    gravarPacientes(lista.map((p) => (p === existente ? completo : p)))
  }
}

function ordenar(lista) {
  return [...lista].sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`))
}

function novoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// Horários já tomados em uma data (agendamentos cancelados liberam o horário).
function horariosOcupados(data) {
  return ler()
    .filter((a) => a.data === data && a.status !== 'Cancelado')
    .map((a) => a.horario)
}

// ---------- Usado pela área pública ----------

// data chega no formato "AAAA-MM-DD" (valor do <input type="date">)
export async function buscarHorarios(data) {
  await esperar(400)
  // Exemplo de versão real:
  //   const resposta = await fetch(`/api/horarios?data=${data}`)
  //   return await resposta.json()
  const ocupados = horariosOcupados(data)
  return HORARIOS_BASE.filter((horario) => !ocupados.includes(horario))
}

// Consulta o CEP no ViaCEP (serviço público e gratuito).
// Devolve { estado, cidade, bairro, rua }, ou null se o CEP não existir.
// Se a internet falhar, lança erro e a tela pede para preencher à mão.
export async function buscarCep(cep) {
  const digitos = soDigitos(cep)
  if (digitos.length !== 8) return null

  const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
  if (!resposta.ok) throw new Error('Falha ao consultar o CEP')
  const dados = await resposta.json()
  if (dados.erro) return null

  return {
    estado: dados.uf || '',
    cidade: dados.localidade || '',
    bairro: dados.bairro || '',
    rua: dados.logradouro || '',
  }
}

export async function enviarAgendamento(dados) {
  await esperar(600)

  // O servidor nunca deve confiar só na tela: valida de novo.
  if (Object.keys(validarFormulario(dados)).length > 0) {
    throw new Error('Dados inválidos. Confira os campos do formulário.')
  }

  // Confere de novo: alguém pode ter ocupado o horário enquanto o cliente preenchia.
  if (horariosOcupados(dados.data).includes(dados.horario)) {
    throw new Error('Esse horário acabou de ser ocupado. Escolha outro horário.')
  }

  const servico = SERVICOS.find((s) => s.id === dados.servico)
  const agendamento = {
    id: novoId(),
    nome: dados.nome.trim(),
    cpf: dados.cpf,
    nascimento: dados.nascimento,
    telefone: dados.telefone.trim(),
    email: (dados.email || '').trim(),
    endereco: {
      cep: dados.cep || '',
      estado: dados.estado,
      cidade: dados.cidade.trim(),
      bairro: dados.bairro.trim(),
      rua: dados.rua.trim(),
      numero: dados.numero.trim(),
    },
    servico: dados.servico,
    servicoNome: servico ? servico.titulo : dados.servico,
    data: dados.data,
    horario: dados.horario,
    status: 'Pendente', // o profissional confirma ou cancela na Agenda
    criadoEm: new Date().toISOString(),
  }

  // Exemplo de versão real:
  //   const resposta = await fetch('/api/agendamentos', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(agendamento),
  //   })
  //   if (!resposta.ok) throw new Error('Falha ao agendar')
  gravar([...ler(), agendamento])

  return { ok: true, protocolo: `AG-${Date.now().toString().slice(-6)}` }
}

// ---------- Usado pelo painel (Agenda e Pacientes) ----------

// Lista ordenada por data e horário.
export function listarAgendamentos() {
  return ordenar(ler())
}

// Muda o status ('Confirmado' | 'Cancelado' | 'Pendente') e devolve a lista atualizada.
// Ao confirmar, o cliente também é cadastrado como paciente.
export function atualizarStatusAgendamento(id, status) {
  const lista = ler()
  const alvo = lista.find((a) => a.id === id)
  if (alvo && status === 'Confirmado') registrarPaciente(alvo)

  const atualizada = lista.map((a) => (a.id === id ? { ...a, status } : a))
  gravar(atualizada)
  return ordenar(atualizada)
}

// Pacientes cadastrados a partir de agendamentos confirmados (para a tela de Pacientes).
// Inclui também quem já tem agendamento confirmado mas ainda não foi cadastrado
// (por exemplo, confirmado antes desta função existir).
export function listarPacientesPublicos() {
  const lista = lerPacientes()
  const chaves = new Set(lista.map((p) => p.telefoneChave))
  const faltando = []

  for (const agendamento of ler()) {
    if (agendamento.status !== 'Confirmado') continue
    const chave = soDigitos(agendamento.telefone)
    if (chaves.has(chave)) continue
    chaves.add(chave)
    faltando.push(montarPaciente(agendamento))
  }

  return [...lista, ...faltando]
}