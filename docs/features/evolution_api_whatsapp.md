# Integração com a Evolution API (WhatsApp & QR Code)

Este documento descreve a integração com o servidor **Evolution API**, permitindo a conexão de instâncias de WhatsApp por leitura de QR Code diretamente no painel e o disparo automático de mensagens anti no-show em segundo plano.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│          Painel Clínico         │        │    Backend Next.js      │        │      Evolution API      │
│  (/settings/whatsapp & Dialog)  │───────>│   (lib/evolution-api)   │───────>│    (Servidor do Usuário)│
└─────────────────────────────────┘        └─────────────────────────┘        └─────────────────────────┘
                 │                                                                         │
                 ▼                                                                         ▼
   Lê QR Code / Status da Sessão                                            WhatsApp Baileys / Celular
```

A integração foi desenvolvida com suporte tanto para:
1. **Configuração Global via `.env`:** Ideal para clínicas únicas ou instâncias centralizadas.
2. **Configuração por Clínica (Multitenant):** Permite que cada clínica defina sua própria URL, API Key e Nome de Instância no banco de dados.

---

## 2. Variáveis de Ambiente Suportadas (`.env`)

Você pode definir suas credenciais globais no arquivo `.env`:

```env
# URL do seu servidor Evolution API (sem barra no final)
EVOLUTION_API_URL="https://evolution.seudominio.com.br"

# API Key Global (AUTHENTICATION_API_KEY do servidor) ou token da instância
EVOLUTION_API_KEY="sua-chave-secreta-aqui"

# Nome padrão de instância (opcional - por padrão usa o slug da clínica)
EVOLUTION_INSTANCE_NAME="clinica-principal"
```

> **Nota:** Se a clínica preencher uma URL ou API Key própria na tela de configurações (`/settings/whatsapp`), os valores da clínica terão precedência sobre as variáveis do `.env`.

---

## 3. Tela de Gerenciamento (`/settings/whatsapp`)

Localizada no menu lateral sob a seção **Configurações -> WhatsApp (QR Code)**:

### 3.1 Funcionalidades da Tela:
1. **Verificação de Status em Tempo Real:**
   - **Conectado (Badge Verde):** Sessão autenticada e operacional para disparos.
   - **Aguardando Leitura (Badge Amarelo):** QR Code gerado aguardando escaneamento pelo smartphone.
   - **Desconectado (Badge Cinza):** Nenhuma sessão ativa.
2. **Geração de QR Code:**
   - Botão **"Gerar QR Code para Leitura"** cria automaticamente a instância (caso ainda não exista) e exibe a imagem em base64.
   - O painel executa polling inteligente para detectar no mesmo segundo em que a conexão for concluída no smartphone, alterando o status para **Conectado** automaticamente.
3. **Desconexão Segura:**
   - Botão para desconectar a sessão do aparelho com 1 clique (`DELETE /instance/logout`).
4. **Configuração de Conexão (Apenas Administrador):**
   - Campos para personalizar a URL da Evolution API, Chave de API e Nome da Instância.

---

## 4. Disparo de Mensagens nos Agendamentos

No modal de lembretes da tela de agendamentos (`/appointments`):
- **Botão Primário: "Enviar via Evolution API"**
  - Dispara a mensagem instantaneamente em segundo plano via `POST /message/sendText/{instance}`.
  - Exibe toast de sucesso ou erro amigável caso a instância esteja offline.
- **Botão Secundário: "Abrir no Web"**
  - Serve como fallback de contingência caso a Evolution API esteja temporariamente indisponível.
