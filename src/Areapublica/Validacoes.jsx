// Validações e máscaras do formulário de agendamento da área pública.
// São funções simples (sem React), usadas pela tela e também pela camada de dados.

export const ESTADOS = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
]

export function soDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '')
}

// Data de hoje no formato AAAA-MM-DD, usando o fuso do computador
export function hojeISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().split('T')[0]
}

// "2000-05-17" -> "17/05/2000"
export function formatarDataBR(iso) {
  const [ano, mes, dia] = String(iso).split('-')
  return `${dia}/${mes}/${ano}`
}

// ---------- Máscaras (aplicadas enquanto a pessoa digita) ----------

export function formatarCPF(valor) {
  const d = soDigitos(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function formatarCEP(valor) {
  const d = soDigitos(valor).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

// ---------- Validações ----------

// Calcula um dígito verificador do CPF a partir dos dígitos anteriores.
function digitoCPF(base) {
  let soma = 0
  for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

// Confere o tamanho, rejeita sequências repetidas (111.111.111-11) e calcula os dois dígitos finais.
export function validarCPF(cpf) {
  const d = soDigitos(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  return digitoCPF(d.slice(0, 9)) === Number(d[9]) && digitoCPF(d.slice(0, 10)) === Number(d[10])
}

// Devolve o texto do erro, ou '' quando a data (AAAA-MM-DD) é válida.
export function validarNascimento(iso) {
  if (!iso) return 'Informe a data de nascimento.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Data de nascimento inválida.'
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  const existe = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia
  if (!existe || ano < 1900) return 'Data de nascimento inválida.'
  if (iso > hojeISO()) return 'A data de nascimento não pode ser no futuro.'
  return ''
}

// Valida o formulário inteiro. Devolve um objeto { campo: 'mensagem' } só com os campos com erro,
// na mesma ordem em que aparecem na tela. Objeto vazio = tudo certo.
// O CEP é opcional: só é conferido quando preenchido.
export function validarFormulario(f) {
  const erros = {}
  const texto = (valor) => String(valor ?? '').trim()

  if (!texto(f.nome)) erros.nome = 'Informe seu nome completo.'

  if (!soDigitos(f.cpf)) erros.cpf = 'Informe o CPF.'
  else if (!validarCPF(f.cpf)) erros.cpf = 'CPF inválido. Confira os números.'

  const erroNascimento = validarNascimento(f.nascimento)
  if (erroNascimento) erros.nascimento = erroNascimento

  if (!texto(f.telefone)) erros.telefone = 'Informe o telefone.'

  if (texto(f.email) && !/^\S+@\S+\.\S+$/.test(texto(f.email))) erros.email = 'E-mail inválido.'

  if (texto(f.cep) && soDigitos(f.cep).length !== 8) erros.cep = 'CEP incompleto. Use 8 números.'

  if (!ESTADOS.some((e) => e.sigla === f.estado)) erros.estado = 'Selecione o estado.'
  if (!texto(f.cidade)) erros.cidade = 'Informe a cidade.'
  if (!texto(f.bairro)) erros.bairro = 'Informe o bairro.'
  if (!texto(f.rua)) erros.rua = 'Informe a rua.'

  if (!texto(f.numero)) erros.numero = 'Informe o número da casa.'
  else if (texto(f.numero).length > 10) erros.numero = 'Número muito longo.'

  if (!f.servico) erros.servico = 'Escolha o serviço.'

  if (!f.data) erros.data = 'Escolha a data.'
  else if (f.data < hojeISO()) erros.data = 'Escolha uma data a partir de hoje.'

  if (f.data && !f.horario) erros.horario = 'Escolha um horário.'

  return erros
}