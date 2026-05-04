import React, { useState, useMemo, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Search, TrendingUp, ShoppingCart, DollarSign, RefreshCw, Zap, ChevronLeft } from "lucide-react";

const ALAVANCAS = {
  trafego:   { label: "Tráfego",      icon: TrendingUp,    badge: "bg-slate-100 text-slate-600 border-slate-200" },
  conversao: { label: "Conversão",    icon: ShoppingCart,  badge: "bg-slate-100 text-slate-600 border-slate-200" },
  ticket:    { label: "Ticket Médio", icon: DollarSign,    badge: "bg-slate-100 text-slate-600 border-slate-200" },
  retencao:  { label: "Retenção",     icon: RefreshCw,     badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

const IMPACTO = {
  "Alto":  "bg-slate-900 text-white",
  "Médio": "bg-slate-100 text-slate-600",
  "Baixo": "bg-slate-50 text-slate-400",
};

const CHECKLIST_DATA = [
  // TRÁFEGO - Mídia Paga
  { id: 1,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios de remarketing no Facebook Ads",                          impacto: "Médio", descricao: "Segmente usuários que visitaram seu site mas não compraram. Use públicos personalizados de visitantes dos últimos 30, 60 e 90 dias.", ferramentas: "Facebook Ads Manager, Pixel do Facebook" },
  { id: 2,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios para público frio no Facebook Ads",                       impacto: "Alto",  descricao: "Crie campanhas de prospecção usando públicos semelhantes (lookalike) dos seus melhores clientes.", ferramentas: "Facebook Ads, Públicos Semelhantes" },
  { id: 3,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios de retenção no Facebook Ads",                            impacto: "Alto",  descricao: "Segmente clientes que já compraram para oferecer novos produtos ou incentivar recompra.", ferramentas: "Facebook Ads, CRM, listas de clientes" },
  { id: 4,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Estrutura enxuta de campanhas no Facebook",                        impacto: "Alto",  descricao: "Concentre conversões em poucos conjuntos de anúncios para dar escala ao algoritmo mais rapidamente.", ferramentas: "Facebook Ads Manager" },
  { id: 5,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios de rede de pesquisa para produtos no Google",             impacto: "Alto",  descricao: "Crie campanhas de Search para as principais palavras-chave de produto. Use correspondência exata e de frase.", ferramentas: "Google Ads, Keyword Planner" },
  { id: 6,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios de pesquisa para branding no Google",                    impacto: "Baixo", descricao: "Proteja o nome da sua marca contra concorrentes que dão lance no seu brand.", ferramentas: "Google Ads" },
  { id: 7,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios de pesquisa no Bing",                                    impacto: "Baixo", descricao: "Menor competição e CPCs mais baratos. Importe campanhas do Google Ads para o Microsoft Ads.", ferramentas: "Microsoft Ads" },
  { id: 8,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios no Pinterest",                                           impacto: "Médio", descricao: "Ótimo para produtos visuais. Crie pins promovidos com imagens de alta qualidade e links direto para o produto.", ferramentas: "Pinterest Ads, Canva" },
  { id: 9,   alavanca: "trafego",   categoria: "Mídia Paga",           acao: "Anúncios no TikTok Ads",                                          impacto: "Alto",  descricao: "Crie vídeos nativos que pareçam orgânicos. Use o formato Spark Ads para impulsionar conteúdos orgânicos.", ferramentas: "TikTok Ads Manager, CapCut" },
  { id: 10,  alavanca: "trafego",   categoria: "Social",               acao: "Conteúdos frequentes no feed do Instagram",                        impacto: "Alto",  descricao: "Publique no mínimo 4x por semana no feed. Misture produtos, bastidores, depoimentos e educação.", ferramentas: "Canva, Later, Buffer" },
  { id: 11,  alavanca: "trafego",   categoria: "Social",               acao: "Stories do Instagram sempre ativos",                               impacto: "Alto",  descricao: "Nunca fique sem Stories por mais de 24h. Use enquetes, caixinhas de perguntas e contagens regressivas.", ferramentas: "Instagram, Canva" },
  { id: 12,  alavanca: "trafego",   categoria: "Social",               acao: "TikToks orgânicos publicados com constância",                      impacto: "Alto",  descricao: "Publique ao menos 1 vídeo por dia no TikTok. Foque em trends, bastidores e demonstrações de produto.", ferramentas: "CapCut, TikTok" },
  { id: 13,  alavanca: "trafego",   categoria: "Social",               acao: "Replicar posts do Instagram para o Facebook",                      impacto: "Baixo", descricao: "Conecte as contas do Instagram e Facebook para publicar automaticamente em ambas as plataformas.", ferramentas: "Meta Business Suite" },
  { id: 14,  alavanca: "trafego",   categoria: "Social",               acao: "Pinterest organizado com conteúdo da marca",                       impacto: "Médio", descricao: "Crie quadros por categoria de produto. Adicione descrições com palavras-chave para ranquear.", ferramentas: "Pinterest, Canva" },
  { id: 15,  alavanca: "trafego",   categoria: "Social",               acao: "Pinterest conectado ao site para pins automáticos",                impacto: "Médio", descricao: "Instale o app do Pinterest na sua loja para criar pins automaticamente a cada novo produto.", ferramentas: "Pinterest para Shopify/VTEX" },
  { id: 16,  alavanca: "trafego",   categoria: "Social",               acao: "Conteúdos em vídeo para YouTube",                                 impacto: "Alto",  descricao: "Crie tutoriais, comparativos e reviews dos seus produtos. O YouTube é o 2º maior buscador do mundo.", ferramentas: "YouTube Studio, DaVinci Resolve" },
  { id: 17,  alavanca: "trafego",   categoria: "Pesquisa (SEO)",       acao: "Produção de conteúdo para pesquisa orgânica",                      impacto: "Alto",  descricao: "Crie artigos de blog focados em dúvidas do seu cliente ideal. Use termos de cauda longa.", ferramentas: "Ubersuggest, Semrush, WordPress" },
  { id: 18,  alavanca: "trafego",   categoria: "Pesquisa (SEO)",       acao: "Posts no blog focados em palavras-chave de volume",                impacto: "Alto",  descricao: "Mapeie keywords com bom volume e baixa concorrência. Crie posts de +1.500 palavras para ranquear.", ferramentas: "Ahrefs, Semrush, Google Search Console" },
  { id: 19,  alavanca: "trafego",   categoria: "Pesquisa (SEO)",       acao: "Mapeamento de palavras-chave com ferramentas SEO",                 impacto: "Médio", descricao: "Faça um levantamento completo das keywords que seus clientes usam para encontrar produtos como o seu.", ferramentas: "Ubersuggest, Semrush, Google Trends" },
  { id: 20,  alavanca: "trafego",   categoria: "Pesquisa (SEO)",       acao: "Páginas do site otimizadas para SEO",                             impacto: "Médio", descricao: "Adicione meta titles, meta descriptions e alt text em imagens. Use a keyword principal no título H1.", ferramentas: "Yoast SEO, RankMath, Google Search Console" },
  { id: 21,  alavanca: "trafego",   categoria: "Pesquisa (SEO)",       acao: "Páginas com organização semântica (H1, H2, etc)",                  impacto: "Alto",  descricao: "Use H1 para o título principal, H2 para subtópicos. Estrutura semântica clara ajuda bots e leitores.", ferramentas: "Google Search Console, Screaming Frog" },
  { id: 22,  alavanca: "trafego",   categoria: "Email Marketing",      acao: "Emails disparados semanalmente para a base",                       impacto: "Baixo", descricao: "Envie ao menos 1 email por semana. Newsletter com novidades, promoções ou conteúdo educativo.", ferramentas: "Klaviyo, Mailchimp, Brevo" },
  { id: 23,  alavanca: "trafego",   categoria: "Email Marketing",      acao: "Captação de contatos via formulários e popups",                    impacto: "Baixo", descricao: "Instale popups de saída com desconto na 1ª compra para capturar emails antes do usuário sair.", ferramentas: "Klaviyo, Omnisend, Privy" },
  { id: 24,  alavanca: "trafego",   categoria: "Email Marketing",      acao: "Automação de emails para novos cadastros",                         impacto: "Alto",  descricao: "Crie um fluxo de boas-vindas de 3 a 5 emails para apresentar a marca e incentivar a primeira compra.", ferramentas: "Klaviyo, ActiveCampaign" },
  { id: 25,  alavanca: "trafego",   categoria: "Indicação",            acao: "Jornada do usuário mapeada para pontos de emoção",                 impacto: "Alto",  descricao: "Identifique os momentos de encantamento e frustração na jornada de compra para melhorá-los.", ferramentas: "Hotjar, Miro, Notion" },
  { id: 26,  alavanca: "trafego",   categoria: "Indicação",            acao: "Ações focadas na experiência do cliente",                          impacto: "Alto",  descricao: "Crie protocolos de atendimento que encantem o cliente em cada ponto de contato.", ferramentas: "Zendesk, Freshdesk, WhatsApp Business" },
  { id: 27,  alavanca: "trafego",   categoria: "Indicação",            acao: "Unboxing com elementos de encantamento e over delivery",           impacto: "Alto",  descricao: "Adicione um bilhetinho personalizado, amostras ou brinde inesperado na embalagem para gerar repost espontâneo.", ferramentas: "Canva (para embalagens/bilhetes)" },
  { id: 28,  alavanca: "trafego",   categoria: "Creators / UGC",       acao: "Busca ativa por creators alinhados à marca",                       impacto: "Médio", descricao: "Pesquise micro-influenciadores (10k-100k) com alto engajamento no nicho do seu produto.", ferramentas: "HypeAuditor, Modash, Instagram" },
  { id: 29,  alavanca: "trafego",   categoria: "Creators / UGC",       acao: "Campanhas com creators sincronizadas a lançamentos",               impacto: "Médio", descricao: "Coordene publicações dos creators com seus lançamentos e campanhas internas para maximizar o alcance.", ferramentas: "Notion, planilhas de controle" },
  { id: 30,  alavanca: "conversao", categoria: "Apresentação",         acao: "Fotos profissionais que passam profissionalismo e desejo",          impacto: "Médio", descricao: "Invista em fotografia profissional de produto com fundo branco + fotos de lifestyle em uso.", ferramentas: "Lightroom, Adobe Express" },
  { id: 31,  alavanca: "conversao", categoria: "Apresentação",         acao: "Vídeos de explicação de produtos no site",                         impacto: "Baixo", descricao: "Crie vídeos curtos (30-60s) mostrando o produto em uso. Adicione na galeria do produto.", ferramentas: "CapCut, Canva Video" },
  { id: 32,  alavanca: "conversao", categoria: "Apresentação",         acao: "Quebra das principais objeções nas páginas de venda",              impacto: "Alto",  descricao: "Liste as 5 principais dúvidas/medos do cliente e responda-as diretamente na página do produto.", ferramentas: "Hotjar (análise de comportamento)" },
  { id: 33,  alavanca: "conversao", categoria: "Apresentação",         acao: "Visual profissional que transmite confiança",                      impacto: "Baixo", descricao: "Revise cores, fontes e alinhamentos. Um design coeso e limpo aumenta a percepção de credibilidade.", ferramentas: "Figma, Canva, Shopify themes" },
  { id: 34,  alavanca: "conversao", categoria: "Apresentação",         acao: "Espaçamento e margens adequados para leitura",                     impacto: "Médio", descricao: "Use espaçamento generoso entre seções. A hierarquia visual guia o olho do cliente até o CTA.", ferramentas: "Google PageSpeed, DevTools" },
  { id: 35,  alavanca: "conversao", categoria: "Apresentação",         acao: "FAQ detalhado nas páginas de produto",                            impacto: "Alto",  descricao: "Inclua 5-10 perguntas frequentes ao final de cada página de produto. Reduz abandono por dúvida.", ferramentas: "Shopify FAQ app, código customizado" },
  { id: 36,  alavanca: "conversao", categoria: "Ofertas",              acao: "Campanhas temáticas para criar sensação de site vivo",             impacto: "Alto",  descricao: "Crie banners e promoções para datas comemorativas, lançamentos e sazonalidades mensais.", ferramentas: "Canva, Shopify Discount" },
  { id: 37,  alavanca: "conversao", categoria: "Ofertas",              acao: "Cupom de primeira compra para acelerar decisão",                   impacto: "Baixo", descricao: "Ofereça 10-15% na primeira compra via popup de saída ou email. Defina validade de 48h para urgência.", ferramentas: "Klaviyo, Shopify Discount Codes" },
  { id: 38,  alavanca: "conversao", categoria: "Ofertas",              acao: "Urgência e escassez para acelerar decisão",                        impacto: "Médio", descricao: "Mostre estoque limitado ('apenas 3 restantes') ou contador de tempo em promoções por prazo.", ferramentas: "Shopify, apps de countdown timer" },
  { id: 39,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Velocidade de carregamento satisfatória",                          impacto: "Alto",  descricao: "Site deve carregar em menos de 3 segundos. Comprima imagens, use CDN e minimize scripts.", ferramentas: "GTMetrix, Google PageSpeed, Cloudflare" },
  { id: 40,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Bom mix de meios de pagamento",                                   impacto: "Médio", descricao: "Ofereça Pix, boleto, crédito, débito e parcelamento. Cada forma de pagamento ausente é uma venda perdida.", ferramentas: "Mercado Pago, PagSeguro, Pagar.me" },
  { id: 41,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Estrutura de navegação clara e intuitiva",                         impacto: "Alto",  descricao: "Menu com categorias claras, breadcrumbs e busca visível. O cliente deve sempre saber onde está.", ferramentas: "Google Analytics, Hotjar" },
  { id: 42,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Menus bem planejados que linkam páginas de valor",                 impacto: "Alto",  descricao: "O menu principal deve levar às categorias de maior conversão. Evite menus com mais de 7 itens.", ferramentas: "Hotjar, Google Analytics" },
  { id: 43,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Rodapé com vários links para continuidade de navegação",           impacto: "Médio", descricao: "Inclua no rodapé: categorias, políticas, contato, redes sociais e selos de segurança.", ferramentas: "Shopify theme editor" },
  { id: 44,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Poucos cliques até a compra (jornada otimizada)",                  impacto: "Médio", descricao: "Mapeie o caminho home → produto → carrinho → checkout. Remova fricções desnecessárias.", ferramentas: "Google Analytics, Hotjar" },
  { id: 45,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Boa continuidade de navegação com banners e sugestões",            impacto: "Alto",  descricao: "Ao final de cada página, sugira produtos relacionados, categorias ou conteúdo. Zero beco sem saída.", ferramentas: "Shopify, apps de recomendação" },
  { id: 46,  alavanca: "conversao", categoria: "Usabilidade",          acao: "Baixa fricção no checkout (poucos campos)",                        impacto: "Alto",  descricao: "Remova campos não obrigatórios. Ofereça checkout como visitante. Use autopreenchimento de endereço.", ferramentas: "Shopify Checkout, One Page Checkout apps" },
  { id: 47,  alavanca: "conversao", categoria: "Autoridade",           acao: "Política de trocas destacada no site",                            impacto: "Alto",  descricao: "Exiba a política de trocas de forma visível na página do produto e no checkout. Reduz medo de comprar.", ferramentas: "Shopify Pages, banner no produto" },
  { id: 48,  alavanca: "conversao", categoria: "Autoridade",           acao: "Política de trocas sem burocracia",                               impacto: "Alto",  descricao: "Simplifique o processo de troca. Quanto mais fácil trocar, mais o cliente confia em comprar.", ferramentas: "Loop Returns, troca simplificada" },
  { id: 49,  alavanca: "conversao", categoria: "Autoridade",           acao: "Garantia dos produtos comunicada claramente",                      impacto: "Alto",  descricao: "Destaque a garantia em pontos estratégicos: próxima ao botão de comprar, no checkout e na página de produto.", ferramentas: "Shopify metafields, apps de selos" },
  { id: 50,  alavanca: "conversao", categoria: "Autoridade",           acao: "Prova social com testemunhas e recomendações",                     impacto: "Alto",  descricao: "Exiba depoimentos reais, logos de clientes conhecidos e número de clientes atendidos.", ferramentas: "Yotpo, Stamped.io, Judge.me" },
  { id: 51,  alavanca: "conversao", categoria: "Autoridade",           acao: "Reviews de clientes nas páginas de produto",                      impacto: "Alto",  descricao: "Instale um app de reviews e dispare email automático solicitando avaliação 7 dias após entrega.", ferramentas: "Judge.me, Loox, Yotpo" },
  { id: 52,  alavanca: "conversao", categoria: "Autoridade",           acao: "Reviews espalhados ao longo do site",                             impacto: "Alto",  descricao: "Além da página de produto, exiba reviews na home, categoria e páginas institucionais.", ferramentas: "Loox, Yotpo widgets" },
  { id: 53,  alavanca: "conversao", categoria: "Atendimento",          acao: "Chat em tempo real ativo no site",                                impacto: "Médio", descricao: "Instale chat ao vivo nos horários de pico. Fora desse horário, configure respostas automáticas.", ferramentas: "JivoChat, Tidio, Intercom" },
  { id: 54,  alavanca: "conversao", categoria: "Atendimento",          acao: "Botão de WhatsApp no rodapé e ao longo do site",                  impacto: "Médio", descricao: "Adicione o botão flutuante do WhatsApp. É o canal preferido dos brasileiros para dúvidas.", ferramentas: "WhatsApp Business API, botão flutuante" },
  { id: 55,  alavanca: "conversao", categoria: "Atendimento",          acao: "Redes sociais destacadas no rodapé e contato",                    impacto: "Baixo", descricao: "Exiba ícones das redes sociais no rodapé com links diretos para os perfis.", ferramentas: "Shopify footer, Linktree" },
  { id: 56,  alavanca: "conversao", categoria: "Atendimento",          acao: "Comentários nas redes sociais respondidos com agilidade",         impacto: "Médio", descricao: "Responda todos os comentários em até 2h. Use templates para agilizar sem perder a personalização.", ferramentas: "Meta Business Suite, Hootsuite" },
  { id: 57,  alavanca: "conversao", categoria: "Resgate de Funil",     acao: "Usuários identificados para comunicação de retargeting",          impacto: "Alto",  descricao: "Instale Pixel do Facebook, Google Tag e ferramenta de email para identificar visitantes e acioná-los.", ferramentas: "Pixel Facebook, Google Tag Manager, Klaviyo" },
  { id: 58,  alavanca: "conversao", categoria: "Resgate de Funil",     acao: "Fluxo de emails/WhatsApp para carrinho abandonado",               impacto: "Alto",  descricao: "Dispare em 1h, 24h e 72h após abandono. O email de 1h tem as maiores taxas de recuperação.", ferramentas: "Klaviyo, Omnisend, CartBack" },
  { id: 59,  alavanca: "conversao", categoria: "Resgate de Funil",     acao: "Boletos e PIX não pagos acionam fluxo automático",                impacto: "Alto",  descricao: "Configure email/WhatsApp automático 2h, 24h e 48h após boleto gerado sem pagamento.", ferramentas: "Klaviyo, Notificações Inteligentes" },
  { id: 60,  alavanca: "conversao", categoria: "Resgate de Funil",     acao: "Pedidos com pagamento falho acionam fluxo",                       impacto: "Baixo", descricao: "Notifique o cliente imediatamente sobre a falha no pagamento com instruções claras para nova tentativa.", ferramentas: "Shopify Flow, Klaviyo" },
  { id: 61,  alavanca: "conversao", categoria: "CRO",                  acao: "Navegações gravadas com Hotjar ou Clarity",                       impacto: "Alto",  descricao: "Analise gravações semanalmente. Identifique onde os usuários clicam, param de rolar ou saem.", ferramentas: "Hotjar, Microsoft Clarity (gratuito)" },
  { id: 62,  alavanca: "conversao", categoria: "CRO",                  acao: "Testes A/B realizados com frequência",                            impacto: "Médio", descricao: "Teste 1 elemento por vez: título, imagem principal, CTA, cor do botão. Aguarde significância estatística.", ferramentas: "Google Optimize, VWO, Shopify nativo" },
  { id: 63,  alavanca: "conversao", categoria: "CRO",                  acao: "Google Analytics instalado e funcionando",                        impacto: "Médio", descricao: "Verifique se GA4 está rastreando corretamente: eventos de compra, add-to-cart, checkout iniciado.", ferramentas: "Google Analytics 4, Google Tag Manager" },
  { id: 64,  alavanca: "conversao", categoria: "CRO",                  acao: "Análise periódica das páginas com maior taxa de saída",           impacto: "Médio", descricao: "Identifique as páginas que mais perdem visitantes e otimize conteúdo, CTA e layout.", ferramentas: "Google Analytics 4" },
  { id: 65,  alavanca: "conversao", categoria: "CRO",                  acao: "Análise das landing pages com maior taxa de entrada",             impacto: "Alto",  descricao: "Optimize as páginas onde os usuários chegam primeiro. Elas devem converter bem.", ferramentas: "Google Analytics 4, Search Console" },
  { id: 66,  alavanca: "ticket",    categoria: "Kits e Combos",        acao: "Ofertas de X produtos por R$ Y",                                  impacto: "Médio", descricao: "Crie kits com preço especial. Ex: 'Leve 3 por R$99'. Incentiva compra de mais de 1 unidade.", ferramentas: "Shopify Bundle apps, Bold Bundles" },
  { id: 67,  alavanca: "ticket",    categoria: "Kits e Combos",        acao: "Ofertas de X produtos com X% off",                               impacto: "Alto",  descricao: "Desconto progressivo: 10% na 2ª unidade, 15% na 3ª. Aumenta o valor médio do pedido.", ferramentas: "Shopify Scripts, Bold Discounts" },
  { id: 68,  alavanca: "ticket",    categoria: "Kits e Combos",        acao: "Ofertas 'compre X e ganhe Y' por categoria",                     impacto: "Alto",  descricao: "Incentive compra em categorias com maior margem. Ex: 'Compre calça e ganhe 30% off na camiseta'.", ferramentas: "Shopify Discount, apps de promoção" },
  { id: 69,  alavanca: "ticket",    categoria: "Ofertas por Valor Mínimo", acao: "Oferta de mimos a partir de R$ X",                           impacto: "Médio", descricao: "Adicione brinde surpresa para pedidos acima de determinado valor. Aumenta percepção de valor.", ferramentas: "Shopify Scripts, Gift With Purchase apps" },
  { id: 70,  alavanca: "ticket",    categoria: "Ofertas por Valor Mínimo", acao: "Frete grátis a partir de R$ X comunicado no site",           impacto: "Médio", descricao: "Exiba barra de progresso no carrinho: 'Faltam R$30 para ganhar frete grátis'. Aumenta ticket em média 30%.", ferramentas: "Free Shipping Bar apps, Shopify" },
  { id: 71,  alavanca: "ticket",    categoria: "Mensagens no Carrinho",acao: "Mensagens automáticas 'leve mais X para ganhar Y' no carrinho",  impacto: "Médio", descricao: "Configure notificações no carrinho mostrando quanto falta para o próximo benefício (frete, brinde, desconto).", ferramentas: "Shopify Cart Drawer, Cart Upsell apps" },
  { id: 72,  alavanca: "ticket",    categoria: "Upsell",               acao: "Adicionais opcionais nos produtos mais vendidos",                 impacto: "Médio", descricao: "Ofereça personalização, embalagem premium ou garantia estendida como adicional pago.", ferramentas: "Bold Product Options, Shopify variants" },
  { id: 73,  alavanca: "ticket",    categoria: "Upsell",               acao: "Upsell oferecido antes/durante o checkout",                      impacto: "Alto",  descricao: "Apresente uma oferta complementar antes de finalizar a compra. Ex: 'Clientes que compraram X também levaram Y'.", ferramentas: "Zipify OneClickUpsell, ReConvert" },
  { id: 74,  alavanca: "ticket",    categoria: "Upsell",               acao: "Upsell no pós-compra por email ou WhatsApp",                     impacto: "Alto",  descricao: "Envie oferta exclusiva de produto complementar nos 30 minutos após a compra.", ferramentas: "Klaviyo, ReConvert Post Purchase" },
  { id: 75,  alavanca: "ticket",    categoria: "Upsell",               acao: "Order bump em produtos importantes",                             impacto: "Alto",  descricao: "Adicione caixa de seleção no checkout com produto complementar de baixo valor. Conversão altíssima.", ferramentas: "Zipify, CartHook, Shopify checkout" },
  { id: 76,  alavanca: "ticket",    categoria: "Diversificação",       acao: "Produtos complementares disponíveis para venda",                 impacto: "Alto",  descricao: "Inclua produtos que complementam a compra principal. Ex: acessórios, consumíveis, itens relacionados.", ferramentas: "Shopify 'Frequently Bought Together'" },
  { id: 77,  alavanca: "ticket",    categoria: "Diversificação",       acao: "Produtos que combinam sugeridos nas páginas de produto",         impacto: "Alto",  descricao: "Seção 'complete o look' ou 'use junto com' na página do produto para sugerir itens relacionados.", ferramentas: "LimeSpot, Frequently Bought Together" },
  { id: 78,  alavanca: "retencao",  categoria: "Novidades",            acao: "Lançamento de produtos novos frequentemente",                    impacto: "Alto",  descricao: "Programe lançamentos mensais ou quinzenais. Novidade é o principal motivo de recompra.", ferramentas: "Shopify, email marketing, redes sociais" },
  { id: 79,  alavanca: "retencao",  categoria: "Novidades",            acao: "Produtos com recorrência disponíveis",                           impacto: "Alto",  descricao: "Crie planos de assinatura para consumíveis. Receita previsível e LTV muito maior.", ferramentas: "Recharge, Bold Subscriptions, Shopify" },
  { id: 80,  alavanca: "retencao",  categoria: "Novidades",            acao: "Coleções novas para incentivar recompra",                        impacto: "Médio", descricao: "Lance coleções temáticas por estação, data comemorativa ou tendência. Reativa clientes inativos.", ferramentas: "Shopify Collections" },
  { id: 81,  alavanca: "retencao",  categoria: "Novidades",            acao: "Novas ofertas e campanhas rotativas",                            impacto: "Alto",  descricao: "Mantenha o site 'vivo' com promoções que mudam semanalmente. Dá motivo para o cliente voltar.", ferramentas: "Shopify, email marketing" },
  { id: 82,  alavanca: "retencao",  categoria: "Novidades",            acao: "Novos mimos publicados periodicamente",                          impacto: "Médio", descricao: "Comunique novos brindes e surpresas para incentivar nova compra.", ferramentas: "Email marketing, WhatsApp, redes sociais" },
  { id: 83,  alavanca: "retencao",  categoria: "Fidelidade",           acao: "Programa de pontos por compras",                                 impacto: "Médio", descricao: "Clientes ganham pontos a cada compra e trocam por descontos. Aumenta frequência de compra.", ferramentas: "Smile.io, LoyaltyLion, Yotpo Loyalty" },
  { id: 84,  alavanca: "retencao",  categoria: "Fidelidade",           acao: "Ofertas de cashback para uso no site",                           impacto: "Médio", descricao: "Crédito automático de 5-10% para próxima compra. Cria urgência para voltar ao site.", ferramentas: "Smile.io, cashback apps" },
  { id: 85,  alavanca: "retencao",  categoria: "Fidelidade",           acao: "Vantagens para compradores mensais claras e divulgadas",         impacto: "Médio", descricao: "Crie um 'clube' com benefícios exclusivos: desconto fixo, acesso antecipado, brindes especiais.", ferramentas: "Email marketing, landing page dedicada" },
  { id: 86,  alavanca: "retencao",  categoria: "Fidelidade",           acao: "Gamificação com níveis por ações dos clientes",                  impacto: "Médio", descricao: "Bronze, Prata, Ouro: a cada compra o cliente sobe de nível e desbloqueia mais benefícios.", ferramentas: "Smile.io, LoyaltyLion" },
  { id: 87,  alavanca: "retencao",  categoria: "Relacionamento",       acao: "Pesquisa de satisfação / NPS após cada compra",                  impacto: "Médio", descricao: "Envie NPS 7 dias após a entrega. Use os detratores para melhorar e os promotores para pedir reviews.", ferramentas: "Delighted, Typeform, Google Forms" },
  { id: 88,  alavanca: "retencao",  categoria: "Relacionamento",       acao: "Pesquisas de opinião com a base de clientes",                    impacto: "Médio", descricao: "Pergunte sobre novos produtos, preferências e feedbacks. Faz o cliente se sentir ouvido.", ferramentas: "Typeform, Google Forms, SurveyMonkey" },
  { id: 89,  alavanca: "retencao",  categoria: "Relacionamento",       acao: "Protótipos e surpresas para clientes recorrentes",               impacto: "Médio", descricao: "Envie amostras de novos produtos para os melhores clientes antes do lançamento. Gera engajamento.", ferramentas: "Lista VIP, CRM de clientes" },
  { id: 90,  alavanca: "retencao",  categoria: "Relacionamento",       acao: "Closed Friends / Grupos no WhatsApp ou Telegram",                impacto: "Alto",  descricao: "Canal exclusivo para melhores clientes com ofertas em primeira mão, bastidores e acesso VIP.", ferramentas: "WhatsApp Business, Telegram" },
  { id: 91,  alavanca: "retencao",  categoria: "Relacionamento",       acao: "Reconhecer e mimar clientes VIPs",                              impacto: "Médio", descricao: "Identifique clientes com LTV acima de R$X e trate-os de forma especial: cartinha, brinde, desconto exclusivo.", ferramentas: "Shopify customers, CRM" },
  { id: 92,  alavanca: "retencao",  categoria: "NPS Alto",             acao: "Potencializar comunicação com base nos elogios do NPS",          impacto: "Alto",  descricao: "Use as frases exatas dos promotores como copy nas páginas, anúncios e emails.", ferramentas: "Planilha de análise NPS, Copy AI" },
  { id: 93,  alavanca: "retencao",  categoria: "NPS Alto",             acao: "Incentivar review público de quem deu NPS alto",                 impacto: "Alto",  descricao: "Para notas 9-10, automaticamente solicite review no Google, Reclame Aqui ou site.", ferramentas: "Delighted, Judge.me, Google Reviews" },
  { id: 94,  alavanca: "retencao",  categoria: "NPS Alto",             acao: "Mapear clientes com NPS 10 para identificar padrões",            impacto: "Médio", descricao: "Analise quem são seus maiores fãs: idade, localização, produto mais comprado, frequência.", ferramentas: "Google Analytics, CRM, planilhas" },
  { id: 95,  alavanca: "retencao",  categoria: "NPS Baixo",            acao: "Resolver problemas de clientes com NPS baixo",                   impacto: "Médio", descricao: "Entre em contato personalizado com quem deu nota baixa. Ofereça solução antes que virem reclamação pública.", ferramentas: "Zendesk, WhatsApp, email" },
  { id: 96,  alavanca: "retencao",  categoria: "NPS Baixo",            acao: "Reverter insatisfação no pós-venda",                            impacto: "Médio", descricao: "Um cliente recuperado se torna muito mais fiel. Crie protocolo de reversão com compensação adequada.", ferramentas: "Playbook de atendimento" },
  { id: 97,  alavanca: "retencao",  categoria: "NPS Baixo",            acao: "Ajustar comunicação com base em feedbacks negativos",            impacto: "Médio", descricao: "Identifique padrões nas reclamações e ajuste descrições de produto, prazo e expectativas.", ferramentas: "Análise qualitativa de NPS" },
  { id: 98,  alavanca: "retencao",  categoria: "NPS Baixo",            acao: "Melhorar produto/serviço com base em NPS negativos",             impacto: "Alto",  descricao: "Crie processo de produto/operações para agir sobre os feedbacks negativos recorrentes.", ferramentas: "Notion, reuniões de feedback" },
  { id: 99,  alavanca: "retencao",  categoria: "Automação Pós-Venda",  acao: "Fluxo automático de emails em sistema de automação",             impacto: "Alto",  descricao: "Configure em Klaviyo ou ActiveCampaign os fluxos: boas-vindas, pós-compra, reengajamento, aniversário.", ferramentas: "Klaviyo, ActiveCampaign, Brevo" },
  { id: 100, alavanca: "retencao",  categoria: "Automação Pós-Venda",  acao: "Régua de emails pós-cadastro com benefícios da marca",           impacto: "Alto",  descricao: "Série de 5 emails em 10 dias apresentando a marca, produtos best-sellers e proposta de valor.", ferramentas: "Klaviyo, Mailchimp" },
  { id: 101, alavanca: "retencao",  categoria: "Automação Pós-Venda",  acao: "Régua de emails pós-compra para acelerar recompra",              impacto: "Médio", descricao: "Email 1: obrigado. Email 2 (7d): como usar. Email 3 (15d): review. Email 4 (30d): produto complementar.", ferramentas: "Klaviyo, Omnisend" },
  { id: 102, alavanca: "retencao",  categoria: "Automação Pós-Venda",  acao: "Régua baseada em gatilhos de comportamento",                     impacto: "Alto",  descricao: "Automatize: visitou categoria X → email sobre produto X. Navegou sem comprar → sequência de nutrição.", ferramentas: "Klaviyo, ActiveCampaign" },
  { id: 103, alavanca: "retencao",  categoria: "Automação Pós-Venda",  acao: "Email automático de aniversário de compra",                      impacto: "Alto",  descricao: "1 ano de cliente: envie email especial com desconto exclusivo. Alta taxa de abertura e conversão.", ferramentas: "Klaviyo, automação de data" },
  { id: 104, alavanca: "retencao",  categoria: "Automação Pós-Venda",  acao: "Mensagem automática para clientes inativos (sem comprar há X dias)", impacto: "Médio", descricao: "Acione clientes que não compram há 60, 90 e 180 dias com oferta progressiva de reengajamento.", ferramentas: "Klaviyo, ActiveCampaign" },
  { id: 105, alavanca: "retencao",  categoria: "LTV",                  acao: "Fluxo pós-compra para aumentar recompra e LTV de 90 dias",       impacto: "Alto",  descricao: "Série de 6-8 emails nos 90 dias após a primeira compra para apresentar mais produtos e incentivar recompra.", ferramentas: "Klaviyo, Omnisend" },
];

const STORAGE_KEY = "ecommerce_checklist_v1";
function getStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

export default function ClientPortalEcommerceChecklist() {
  // v2 - design Destra
  const [checked, setChecked] = useState(() => getStored());
  const [search, setSearch] = useState("");
  const [filterAlavanca, setFilterAlavanca] = useState("all");
  const [filterImpacto, setFilterImpacto] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleCheck = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => {
    return CHECKLIST_DATA.filter(item => {
      if (filterAlavanca !== "all" && item.alavanca !== filterAlavanca) return false;
      if (filterImpacto !== "all" && item.impacto !== filterImpacto) return false;
      if (filterStatus === "pendente" && checked[item.id]) return false;
      if (filterStatus === "concluido" && !checked[item.id]) return false;
      if (search && !item.acao.toLowerCase().includes(search.toLowerCase()) && !item.categoria.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterAlavanca, filterImpacto, filterStatus, search, checked]);

  const totalByAlavanca = useMemo(() => {
    const counts = {};
    for (const a of Object.keys(ALAVANCAS)) {
      const items = CHECKLIST_DATA.filter(i => i.alavanca === a);
      counts[a] = { total: items.length, done: items.filter(i => checked[i.id]).length };
    }
    return counts;
  }, [checked]);

  const grouped = useMemo(() => {
    const g = {};
    for (const item of filtered) {
      const key = `${item.alavanca}__${item.categoria}`;
      if (!g[key]) g[key] = { alavanca: item.alavanca, categoria: item.categoria, items: [] };
      g[key].items.push(item);
    }
    return Object.values(g);
  }, [filtered]);

  const totalDone = CHECKLIST_DATA.filter(i => checked[i.id]).length;
  const totalAll = CHECKLIST_DATA.length;
  const pct = Math.round((totalDone / totalAll) * 100);

  const hasFilters = filterAlavanca !== "all" || filterImpacto !== "all" || filterStatus !== "all" || search;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <div className="w-full px-5 md:px-8 pt-28 md:pt-12 pb-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">E-commerce</p>
            <h1 className="text-7xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-[1.1]">
              Checklist
            </h1>
            <p className="text-slate-400 font-light text-sm mt-2">
              105 ações para escalar sua loja virtual
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-3xl font-extralight text-slate-900">{pct}%</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
              {totalDone}/{totalAll} feitos
            </p>
          </div>
        </div>

        {/* Progress por alavanca */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(ALAVANCAS).map(([key, a]) => {
            const c = totalByAlavanca[key];
            const p = Math.round((c.done / c.total) * 100);
            const isActive = filterAlavanca === key;
            return (
              <button
                key={key}
                onClick={() => setFilterAlavanca(isActive ? "all" : key)}
                className={`w-full text-left border rounded-2xl p-4 hover:border-slate-200 transition-all group ${
                  isActive ? "bg-slate-900 border-slate-900" : "bg-white border-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <a.icon className={`w-3.5 h-3.5 ${isActive ? "text-white/60" : "text-slate-400"}`} />
                  <span className={`text-xs font-medium ${isActive ? "text-white" : "text-slate-600"}`}>{a.label}</span>
                </div>
                <div className={`w-full rounded-full h-[1.5px] mb-2 ${isActive ? "bg-white/20" : "bg-slate-100"}`}>
                  <div
                    className={`h-[1.5px] rounded-full transition-all ${isActive ? "bg-white/70" : "bg-slate-800"}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
                <p className={`text-[10px] font-light ${isActive ? "text-white/40" : "text-slate-400"}`}>{c.done}/{c.total} feitos</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 md:px-8 py-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              className="w-full h-10 pl-11 pr-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
              placeholder="Buscar ação..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 text-sm bg-slate-50 border border-slate-100 rounded-2xl px-3 text-slate-600 focus:outline-none focus:border-slate-300 transition-all"
            value={filterImpacto}
            onChange={e => setFilterImpacto(e.target.value)}
          >
            <option value="all">Todos impactos</option>
            <option value="Alto">Alto impacto</option>
            <option value="Médio">Médio impacto</option>
            <option value="Baixo">Baixo impacto</option>
          </select>
          <select
            className="h-10 text-sm bg-slate-50 border border-slate-100 rounded-2xl px-3 text-slate-600 focus:outline-none focus:border-slate-300 transition-all"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setFilterAlavanca("all"); setFilterImpacto("all"); setFilterStatus("all"); setSearch(""); }}
              className="h-10 px-4 text-xs text-slate-400 hover:text-slate-700 transition-colors font-light"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Checklist ── */}
      <div className="px-5 md:px-8 py-6 pb-28 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light text-sm">Nenhuma ação encontrada com esses filtros.</p>
          </div>
        )}

        {grouped.map(group => {
          const aConfig = ALAVANCAS[group.alavanca];
          const doneCnt = group.items.filter(i => checked[i.id]).length;
          return (
            <div key={`${group.alavanca}__${group.categoria}`} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <aConfig.icon className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{aConfig.label}</p>
                  <span className="text-slate-300">·</span>
                  <p className="text-sm font-medium text-slate-900">{group.categoria}</p>
                </div>
                <p className="text-[10px] text-slate-400 font-light">{doneCnt}/{group.items.length}</p>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-50">
                {group.items.map(item => {
                  const isDone = !!checked[item.id];
                  const isExpanded = expandedItem === item.id;
                  return (
                    <div key={item.id} className={`transition-colors ${isDone ? "bg-slate-50/40" : "bg-white"}`}>
                      <div className="px-5 py-4 flex items-start gap-4">
                        <button
                          onClick={() => toggleCheck(item.id)}
                          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
                        >
                          {isDone
                            ? <CheckCircle2 className="w-5 h-5 text-slate-900" />
                            : <Circle className="w-5 h-5 text-slate-200 hover:text-slate-400 transition-colors" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <p className={`text-sm font-light leading-snug ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                              {item.acao}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${IMPACTO[item.impacto]}`}>
                                {item.impacto}
                              </span>
                              <button
                                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                className="text-slate-300 hover:text-slate-600 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm text-slate-500 font-light leading-relaxed">{item.descricao}</p>
                              {item.ferramentas && (
                                <div className="flex items-start gap-3 bg-[#0d1117] rounded-2xl px-4 py-3">
                                  <Zap className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-1">Ferramentas</p>
                                    <p className="text-xs text-white/60 font-light">{item.ferramentas}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}