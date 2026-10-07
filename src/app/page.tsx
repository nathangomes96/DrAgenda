"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./landing.css";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqData = [
    {
      q: "Como funciona a confirmação automática pelo WhatsApp?",
      a: "O Doutor Agenda conecta diretamente ao seu número via Evolution API (leitura de QR Code simples). O sistema envia lembretes automáticos 24 horas antes e no dia da consulta, com um link exclusivo onde o paciente confirma ou cancela a presença em 1 único clique, sem precisar digitar nada.",
    },
    {
      q: "O prontuário eletrônico está de acordo com a LGPD e o CFM?",
      a: "Sim, 100%! Seguimos rigorosamente o Art. 5º da LGPD para dados sensíveis de saúde e as resoluções do Conselho Federal de Medicina. Recepcionistas não possuem acesso aos prontuários e evoluções clínicas; apenas os médicos autorizados podem visualizar diagnósticos, hipóteses e condutas.",
    },
    {
      q: "Posso usar o meu próprio link personalizado da clínica?",
      a: "Com certeza! Cada clínica cadastrada recebe um link amigável exclusivo (ex: seusistema.com.br/agendar/minha-clinica). Você pode divulgá-lo na bio do Instagram, cartões de visita e status do WhatsApp para os pacientes agendarem sozinhos 24 horas por dia.",
    },
    {
      q: "Preciso pagar taxa de implantação ou fidelidade?",
      a: "Não cobramos nenhuma taxa de adesão ou implantação, e não há contratos de fidelidade. Você paga apenas a mensalidade justa de R$ 59,90 e pode cancelar a qualquer momento sem burocracia ou multas.",
    },
    {
      q: "Consigo cadastrar secretárias e outros médicos com acessos diferentes?",
      a: "Sim. O sistema possui controle de permissões (RBAC) com 3 níveis: Administrador (gestão da clínica e configurações), Médico (atendimento e prontuário completo) e Recepcionista (agendamentos e cadastro básico de pacientes).",
    },
  ];

  return (
    <div className="lp-body">
      <div className="lp-bg-decor" />

      {/* HEADER / NAVIGATION */}
      <header className="lp-header">
        <div className="lp-container">
          <nav className="lp-nav">
            <Link href="/" className="lp-brand">
              <div className="lp-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
              <span className="lp-logo-text">
                Doutor<span>Agenda</span>
              </span>
            </Link>

            <ul className="lp-nav-links">
              <li><a href="#recursos" className="lp-nav-link">Recursos</a></li>
              <li><a href="#como-funciona" className="lp-nav-link">Como Funciona</a></li>
              <li><a href="#precos" className="lp-nav-link">Planos & Preços</a></li>
              <li><a href="#faq" className="lp-nav-link">Dúvidas</a></li>
            </ul>

            <div className="lp-nav-actions">
              <Link href="/dashboard" className="lp-btn lp-btn-secondary lp-btn-sm">
                Entrar
              </Link>
              <a href="#precos" className="lp-btn lp-btn-primary lp-btn-sm lp-btn-hide-mobile">
                Experimentar Agora
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-grid">
            <div className="lp-hero-content">
              <div className="lp-badge-tag">
                <span className="lp-pulse-dot" />
                🎉 7 Dias de Teste Grátis • Sem Cartão de Crédito
              </div>
              <h1>
                Automatize sua agenda, <span className="lp-text-gradient">zere as faltas</span> e encante seus pacientes.
              </h1>
              <p>
                Agendamento online 24h com link próprio da clínica, confirmação de presença anti no-show via WhatsApp e Prontuário Eletrônico seguro em total conformidade com a LGPD.
              </p>

              <div className="lp-hero-actions">
                <a href="#precos" className="lp-btn lp-btn-primary lp-btn-lg">
                  Testar 7 Dias Grátis (R$ 59,90/mês)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                <Link href="/dashboard" className="lp-btn lp-btn-secondary lp-btn-lg">
                  Acessar Minha Conta
                </Link>
              </div>

              <div className="lp-hero-features-list">
                <div className="lp-hero-feature-item">
                  <span className="lp-check-icon">✓</span> 7 dias grátis sem compromisso
                </div>
                <div className="lp-hero-feature-item">
                  <span className="lp-check-icon">✓</span> WhatsApp com QR Code direto
                </div>
                <div className="lp-hero-feature-item">
                  <span className="lp-check-icon">✓</span> Cancele a qualquer momento
                </div>
              </div>
            </div>

            {/* MOCKUP INTERATIVO FLUTUANTE */}
            <div className="lp-hero-visual">
              <div className="lp-mockup-wrapper">
                <div className="lp-mockup-header">
                  <div className="lp-clinic-info">
                    <div className="lp-clinic-avatar">DA</div>
                    <div>
                      <div className="lp-clinic-title">Clínica Saúde & Bem-Estar</div>
                      <div className="lp-clinic-slug">/agendar/saude-bem-estar</div>
                    </div>
                  </div>
                  <div className="lp-status-pill">
                    <span className="lp-pulse-dot" />
                    WhatsApp Conectado
                  </div>
                </div>

                <div className="lp-agenda-preview">
                  <div className="lp-agenda-item confirmed">
                    <div>
                      <div className="lp-agenda-patient">Camila Ribeiro Duarte</div>
                      <div className="lp-agenda-time">09:00 - Dr. Fernando • Consulta Geral</div>
                    </div>
                    <span className="lp-agenda-badge badge-confirmed">Confirmado via Zap</span>
                  </div>

                  <div className="lp-agenda-item confirmed">
                    <div>
                      <div className="lp-agenda-patient">Rafael Medeiros Costa</div>
                      <div className="lp-agenda-time">10:30 - Dra. Juliana • Dermatologia</div>
                    </div>
                    <span className="lp-agenda-badge badge-confirmed">Confirmado via Zap</span>
                  </div>

                  <div className="lp-agenda-item">
                    <div>
                      <div className="lp-agenda-patient">Mariana Santos Lima</div>
                      <div className="lp-agenda-time">14:00 - Dr. Fernando • Retorno</div>
                    </div>
                    <span className="lp-agenda-badge badge-pending">Lembrete 24h Enviado</span>
                  </div>
                </div>
              </div>

              {/* FLOATING WHATSAPP TOAST */}
              <div className="lp-toast-notification">
                <div className="lp-wa-icon-bubble">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                </div>
                <div className="lp-toast-content">
                  <span className="lp-toast-title">WhatsApp Anti No-Show</span>
                  <span className="lp-toast-desc">Mariana confirmou presença na consulta com 1 clique!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS & PROOF */}
      <section className="lp-metrics-section">
        <div className="lp-container">
          <div className="lp-metrics-grid">
            <div className="lp-metric-card">
              <div className="lp-metric-val">-85%</div>
              <div className="lp-metric-label">Redução Drástica em Faltas</div>
              <div className="lp-metric-desc">Lembretes proativos pelo WhatsApp com botão de confirmação instantânea.</div>
            </div>
            <div className="lp-metric-card">
              <div className="lp-metric-val">24h / 7</div>
              <div className="lp-metric-label">Agendamento Online Ativo</div>
              <div className="lp-metric-desc">Sua clínica recebe pacientes mesmo à noite e aos finais de semana.</div>
            </div>
            <div className="lp-metric-card">
              <div className="lp-metric-val">100%</div>
              <div className="lp-metric-label">Conformidade LGPD & CFM</div>
              <div className="lp-metric-desc">Dados clínicos sensíveis protegidos com isolamento estrito de papéis.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / RECURSOS */}
      <section id="recursos" className="lp-features-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Funcionalidades do Sistema</div>
            <h2 className="lp-section-title">Tudo o que sua clínica precisa para crescer e se organizar</h2>
            <p className="lp-section-desc">Uma plataforma simples para a secretária, poderosa para o médico e agradável para o paciente.</p>
          </div>

          <div className="lp-features-grid">
            {/* FEATURE 1 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-box emerald">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h3 className="lp-feature-title">WhatsApp Integrado (Evolution API)</h3>
              <p className="lp-feature-text">
                Conecte o WhatsApp da sua clínica lendo um QR Code na tela. O sistema dispara confirmações de agendamento, lembrete de 24h e lembrete do dia da consulta de forma 100% automática.
              </p>
              <ul className="lp-feature-highlights">
                <li><span className="lp-check-icon">✓</span> Link de confirmação em 1 clique para o paciente</li>
                <li><span className="lp-check-icon">✓</span> Disparo manual e automático de mensagens</li>
                <li><span className="lp-check-icon">✓</span> Atualização de status em tempo real na agenda</li>
              </ul>
            </div>

            {/* FEATURE 2 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <h3 className="lp-feature-title">Link Personalizado da Clínica (Slug)</h3>
              <p className="lp-feature-text">
                Divulgue um endereço profissional e elegante com o nome da sua clínica (ex: <code>/agendar/minha-clinica</code>). O paciente escolhe o médico, a especialidade e o melhor horário disponível.
              </p>
              <ul className="lp-feature-highlights">
                <li><span className="lp-check-icon">✓</span> Ideal para colocar na bio do Instagram e Google Meu Negócio</li>
                <li><span className="lp-check-icon">✓</span> Sem conflito de horários (bloqueio automático de slots)</li>
                <li><span className="lp-check-icon">✓</span> Modal rápido com botão de copiar link e QR Code</li>
              </ul>
            </div>

            {/* FEATURE 3 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 className="lp-feature-title">Prontuário Eletrônico do Paciente (EHR)</h3>
              <p className="lp-feature-text">
                Histórico clínico organizado por paciente com linha do tempo. Registre queixas principais, anamnese, hipóteses diagnósticas, condutas e prescrições médicas de forma ágil e segura.
              </p>
              <ul className="lp-feature-highlights">
                <li><span className="lp-check-icon">✓</span> Conformidade estrita com o Art. 5º da LGPD</li>
                <li><span className="lp-check-icon">✓</span> Notas clínicas sigilosas com isolamento médico</li>
                <li><span className="lp-check-icon">✓</span> Timeline histórica de atendimentos anteriores</li>
              </ul>
            </div>

            {/* FEATURE 4 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="lp-feature-title">Níveis de Acesso por Usuário (RBAC)</h3>
              <p className="lp-feature-text">
                Controle exatamente o que cada membro da equipe pode acessar. Diferenciação inteligente para Administradores da clínica, Médicos atendentes e Recepcionistas.
              </p>
              <ul className="lp-feature-highlights">
                <li><span className="lp-check-icon">✓</span> <strong>Médico:</strong> Visualiza apenas sua agenda e prontuários autorizados</li>
                <li><span className="lp-check-icon">✓</span> <strong>Recepcionista:</strong> Marca horários sem acesso a dados de saúde confidenciais</li>
                <li><span className="lp-check-icon">✓</span> <strong>Admin:</strong> Configura dados da clínica, WhatsApp e faturamento</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / PLANOS */}
      <section id="precos" className="lp-pricing-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Planos Transparentes</div>
            <h2 className="lp-section-title">Investimento justo que se paga já no primeiro dia</h2>
            <p className="lp-section-desc">Uma única consulta salva por mês já cobre todo o valor do sistema.</p>
          </div>

          <div className="lp-pricing-grid">
            {/* PLANO BÁSICO */}
            <div className="lp-pricing-card">
              <div className="lp-plan-name">Consultório Solo</div>
              <div className="lp-plan-desc">Para profissionais autônomos que estão começando e precisam de organização.</div>

              <div className="lp-plan-price-box">
                <span className="lp-price-currency">R$</span>
                <span className="lp-price-val">39</span>
                <span className="lp-price-cents">,90</span>
                <span className="lp-price-period">/mês</span>
              </div>

              <ul className="lp-plan-features">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>1 Profissional de saúde</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Agendamentos online ilimitados</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Link de agendamento público</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Prontuário eletrônico básico</span>
                </li>
              </ul>

              <Link href="/dashboard" className="lp-btn lp-btn-secondary">
                Escolher Solo
              </Link>
              <div className="lp-plan-footer-note">7 dias grátis • Sem fidelidade</div>
            </div>

            {/* PLANO ESSENCIAL (DESTAQUE PRINCIPAL - R$ 59,90) */}
            <div className="lp-pricing-card featured">
              <div className="lp-featured-ribbon">⭐ Mais Escolhido</div>
              <div className="lp-plan-name">Plano Essencial</div>
              <div className="lp-plan-desc">O pacote completo com automação de WhatsApp para eliminar faltas.</div>

              <div className="lp-plan-price-box">
                <span className="lp-price-currency">R$</span>
                <span className="lp-price-val">59</span>
                <span className="lp-price-cents">,90</span>
                <span className="lp-price-period">/mês</span>
              </div>

              <ul className="lp-plan-features">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>WhatsApp Anti No-Show Automático (Evolution API)</strong>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Confirmação de consulta em 1 clique pelo paciente</strong>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Link próprio personalizado com nome da clínica</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Prontuário eletrônico completo (EHR) com LGPD</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Até 3 profissionais de saúde e recepcionistas</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>

              <Link href="/dashboard" className="lp-btn lp-btn-primary lp-btn-lg">
                Começar Meus 7 Dias Grátis
              </Link>
              <div className="lp-plan-footer-note">7 dias grátis para testar • Cancele quando quiser</div>
            </div>

            {/* PLANO CLÍNICA PRO */}
            <div className="lp-pricing-card">
              <div className="lp-plan-name">Clínica Pro</div>
              <div className="lp-plan-desc">Para clínicas em expansão com múltiplos consultórios e equipe ampla.</div>

              <div className="lp-plan-price-box">
                <span className="lp-price-currency">R$</span>
                <span className="lp-price-val">119</span>
                <span className="lp-price-cents">,90</span>
                <span className="lp-price-period">/mês</span>
              </div>

              <ul className="lp-plan-features">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Tudo do Plano Essencial incluído</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Profissionais e médicos ilimitados</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Múltiplos números de WhatsApp conectados</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Relatórios avançados de retenção e faltas</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Onboarding e treinamento personalizado da equipe</span>
                </li>
              </ul>

              <Link href="/dashboard" className="lp-btn lp-btn-secondary">
                Escolher Clínica Pro
              </Link>
              <div className="lp-plan-footer-note">7 dias grátis para sua equipe testar</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="lp-faq-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-tag">Tire Suas Dúvidas</div>
            <h2 className="lp-section-title">Perguntas Frequentes</h2>
            <p className="lp-section-desc">Entenda como o Doutor Agenda funciona na prática no dia a dia da sua clínica.</p>
          </div>

          <div className="lp-faq-container">
            {faqData.map((item, idx) => (
              <div
                key={idx}
                className={`lp-accordion-item ${activeFaq === idx ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="lp-accordion-trigger"
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{item.q}</span>
                  <span className="lp-accordion-icon">+</span>
                </button>
                <div className="lp-accordion-content">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER FINAL */}
      <section className="lp-cta-banner">
        <div className="lp-container">
          <div className="lp-cta-card">
            <h2>Pronto para zerar os horários vagos da sua clínica?</h2>
            <p>
              Junte-se às clínicas que automatizaram seus agendamentos e reduziram mais de 85% das faltas com o Doutor Agenda.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#precos" className="lp-btn lp-btn-primary lp-btn-lg">
                Garantir 7 Dias Grátis (por R$ 59,90/mês)
              </a>
              <Link href="/dashboard" className="lp-btn lp-btn-secondary lp-btn-lg">
                Já sou Cliente (Acessar)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-brand">
              <div className="lp-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
              <span className="lp-logo-text">
                Doutor<span>Agenda</span>
              </span>
            </div>

            <ul className="lp-footer-links">
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#precos">Planos</a></li>
              <li><a href="#faq">Dúvidas</a></li>
              <li><Link href="/dashboard">Acesso ao Painel</Link></li>
            </ul>

            <div className="lp-footer-copy">
              © {new Date().getFullYear()} Doutor Agenda. Todos os direitos reservados. Em conformidade com LGPD & CFM.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
