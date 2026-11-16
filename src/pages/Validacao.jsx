// Regras de validação do login e da troca de senha.

// O e-mail precisa terminar em @gmail.com
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@gmail\.com$/i

// Devolve o texto do erro, ou '' quando o e-mail está válido.
export function validarEmail(email) {
  const valor = email.trim()
  if (!valor) return 'Informe seu e-mail.'
  if (!EMAIL_REGEX.test(valor)) return 'Use um e-mail válido que termine com @gmail.com.'
  return ''
}

// Lista de requisitos da senha, útil para mostrar o checklist na tela.
export function requisitosSenha(senha) {
  return [
    { id: 'tamanho', texto: 'Mínimo de 8 caracteres', ok: senha.length >= 8 },
    { id: 'maiuscula', texto: 'Pelo menos 1 letra maiúscula', ok: /\p{Lu}/u.test(senha) },
    { id: 'numero', texto: 'Pelo menos 1 número', ok: /[0-9]/.test(senha) },
  ]
}

// Devolve o texto do erro, ou '' quando a senha atende todas as regras.
export function validarSenha(senha) {
  if (!senha) return 'Informe sua senha.'
  const faltando = requisitosSenha(senha).filter((requisito) => !requisito.ok)
  if (faltando.length > 0) {
    return `A senha precisa ter: ${faltando.map((requisito) => requisito.texto.toLowerCase()).join(', ')}.`
  }
  return ''
}
