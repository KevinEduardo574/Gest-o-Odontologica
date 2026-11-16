// Camada de autenticação do profissional.
//
// ATENÇÃO: tudo aqui é SIMULADO, porque o projeto ainda não tem back end.
// Nenhum e-mail é enviado de verdade e nenhuma senha é guardada.
// Quando o back end existir (API do grupo ou Supabase Auth), só o corpo
// destas funções muda. A tela (LoginProfissional.jsx) continua igual.

// Com MODO_DEMO = true, a tela mostra o código na própria página,
// já que não há e-mail real. Deixe false quando o envio for de verdade.
export const MODO_DEMO = true

const VALIDADE_CODIGO_MS = 10 * 60 * 1000 // 10 minutos

let codigoPendente = null // { email, codigo, expiraEm }

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizar(email) {
  return email.trim().toLowerCase()
}

// Simulação: aceita qualquer e-mail/senha que já passaram nas regras da tela.
export async function entrar({ email }) {
  await esperar(500)
  return { ok: true, usuario: { email: normalizar(email) } }
}

// Simula o envio do código por e-mail.
// Na versão real o código é gerado e enviado pelo SERVIDOR, nunca pelo navegador.
export async function enviarCodigo(email) {
  await esperar(700)
  const codigo = String(Math.floor(100000 + Math.random() * 900000)) // 6 dígitos
  codigoPendente = {
    email: normalizar(email),
    codigo,
    expiraEm: Date.now() + VALIDADE_CODIGO_MS,
  }
  if (MODO_DEMO) console.log(`[demo] código para ${email}: ${codigo}`)
  return { ok: true, codigoDemo: MODO_DEMO ? codigo : undefined }
}

function conferirCodigo(email, codigo) {
  if (!codigoPendente || codigoPendente.email !== normalizar(email)) {
    throw new Error('Solicite um novo código.')
  }
  if (Date.now() > codigoPendente.expiraEm) {
    throw new Error('O código expirou. Solicite um novo.')
  }
  if (codigoPendente.codigo !== codigo) {
    throw new Error('Código incorreto.')
  }
}

export async function verificarCodigo(email, codigo) {
  await esperar(400)
  conferirCodigo(email, codigo)
  return { ok: true }
}

// Na versão real, aqui o back end salvaria a nova senha do usuário.
export async function redefinirSenha({ email, codigo }) {
  await esperar(600)
  conferirCodigo(email, codigo)
  codigoPendente = null
  return { ok: true }
}
