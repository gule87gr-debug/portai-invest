import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "es" | "fr" | "pt";

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard", aiChat: "AI Chat", quiz: "Quiz", forum: "Forum", watchlists: "Watchlists", settings: "Settings",
    marketIntelligence: "Market Intelligence", aiCuratedAnalysis: "AI-curated analysis with trust scores and live market data",
    analyzeLink: "Analyze Link", analyze: "Analyze", analyzing: "Analyzing...",
    pasteUrl: "Paste any financial news article URL. AI will provide a trust/bias score (1-10), summary, and bias detection.",
    trustScore: "Trust Score", smartSummary: "Smart Summary", biasDetection: "Bias Detection",
    stockHeatmap: "S&P 500 Stock Heatmap",
    aiFinancialAdvisor: "AI Financial Advisor", poweredByAI: "Powered by AI · Educational use only",
    history: "History", newChat: "New Chat", chatHistory: "Chat History", noSavedChats: "No saved chats yet.",
    askAnything: "Ask anything about finance, investing, markets...",
    smartForum: "Smart Forum", discussInvestments: "Discuss investments with AI-powered fact-checking",
    newThread: "New Thread", createNewThread: "Create New Thread", threadTitle: "Thread title...",
    shareThoughts: "Share your thoughts...", postThread: "Post Thread", cancel: "Cancel",
    searchThreads: "Search threads...", factCheck: "Fact Check", writeComment: "Write a comment...",
    all: "All", general: "General", portfolios: "Portfolios", markets: "Markets", sectors: "Sectors",
    trackStocks: "Track your favorite stocks and ETFs", newList: "New List",
    createNewWatchlist: "Create New Watchlist", watchlistName: "Watchlist name...", create: "Create",
    addStock: "Add Stock", searchStocksEtfs: "Search stocks, ETFs, crypto...", noStocksYet: "No stocks yet. Add some!",
    noWatchlistsYet: "No Watchlists Yet", createFirstWatchlist: "Create your first watchlist to start tracking stocks.",
    createWatchlist: "Create Watchlist", items: "items",
    profile: "Profile", displayName: "Display Name", changesSaveAuto: "Changes save automatically",
    email: "Email", emailCannotChange: "Email cannot be changed", username: "Username",
    anonymousMode: "Anonymous Mode", hideNameAvatar: "Hide your name and avatar in forum posts",
    appearAs: "You will appear as", anonymousTrader: "Anonymous Trader",
    language: "Language", selectLanguage: "Choose your preferred language",
    logOut: "Log Out", uploadPhoto: "Upload Photo",
    createAccount: "Create Account", logIn: "Log In", emailAddress: "Email address", password: "Password",
    alreadyHaveAccount: "Already have an account?", dontHaveAccount: "Don't have an account?",
    signUp: "Sign up", fillAllFields: "Please fill in all fields", passwordMin6: "Password must be at least 6 characters",
    chooseUsername: "Choose a username", usernameRequired: "Username is required",
    usernameTaken: "This username is already taken", emailInUse: "This email is already registered.",
    switchToLogin: "Switch to Log In",
    backToWatchlists: "Back to Watchlists", about: "About", technicalAnalysis: "Technical Analysis", recentNews: "Recent News",
    notFinancialAdvice: "Not financial advice",
    moderationError: "Your post was flagged for inappropriate content. Please revise and try again.",
  },
  es: {
    dashboard: "Panel", aiChat: "Chat IA", quiz: "Cuestionario", forum: "Foro", watchlists: "Listas", settings: "Ajustes",
    marketIntelligence: "Inteligencia de Mercado", aiCuratedAnalysis: "Análisis con IA, puntuaciones de confianza y datos en vivo",
    analyzeLink: "Analizar Enlace", analyze: "Analizar", analyzing: "Analizando...",
    pasteUrl: "Pega cualquier URL de artículo financiero. La IA proporcionará una puntuación de confianza (1-10), resumen y detección de sesgo.",
    trustScore: "Puntuación de Confianza", smartSummary: "Resumen Inteligente", biasDetection: "Detección de Sesgo",
    stockHeatmap: "Mapa de Calor S&P 500",
    aiFinancialAdvisor: "Asesor Financiero IA", poweredByAI: "Con IA · Solo uso educativo",
    history: "Historial", newChat: "Nuevo Chat", chatHistory: "Historial de Chats", noSavedChats: "Sin chats guardados.",
    askAnything: "Pregunta sobre finanzas, inversiones, mercados...",
    smartForum: "Foro Inteligente", discussInvestments: "Discute inversiones con verificación de hechos por IA",
    newThread: "Nuevo Tema", createNewThread: "Crear Nuevo Tema", threadTitle: "Título del tema...",
    shareThoughts: "Comparte tus ideas...", postThread: "Publicar", cancel: "Cancelar",
    searchThreads: "Buscar temas...", factCheck: "Verificar", writeComment: "Escribe un comentario...",
    all: "Todos", general: "General", portfolios: "Portafolios", markets: "Mercados", sectors: "Sectores",
    trackStocks: "Sigue tus acciones y ETFs favoritos", newList: "Nueva Lista",
    createNewWatchlist: "Crear Nueva Lista", watchlistName: "Nombre de la lista...", create: "Crear",
    addStock: "Agregar", searchStocksEtfs: "Buscar acciones, ETFs, cripto...", noStocksYet: "Sin acciones aún. ¡Agrega algunas!",
    noWatchlistsYet: "Sin Listas Aún", createFirstWatchlist: "Crea tu primera lista para empezar.",
    createWatchlist: "Crear Lista", items: "elementos",
    profile: "Perfil", displayName: "Nombre", changesSaveAuto: "Los cambios se guardan automáticamente",
    email: "Correo", emailCannotChange: "El correo no se puede cambiar", username: "Usuario",
    anonymousMode: "Modo Anónimo", hideNameAvatar: "Oculta tu nombre y avatar en publicaciones del foro",
    appearAs: "Aparecerás como", anonymousTrader: "Trader Anónimo",
    language: "Idioma", selectLanguage: "Elige tu idioma preferido",
    logOut: "Cerrar Sesión", uploadPhoto: "Subir Foto",
    createAccount: "Crear Cuenta", logIn: "Iniciar Sesión", emailAddress: "Correo electrónico", password: "Contraseña",
    alreadyHaveAccount: "¿Ya tienes una cuenta?", dontHaveAccount: "¿No tienes una cuenta?",
    signUp: "Regístrate", fillAllFields: "Completa todos los campos", passwordMin6: "La contraseña debe tener al menos 6 caracteres",
    chooseUsername: "Elige un nombre de usuario", usernameRequired: "El nombre de usuario es obligatorio",
    usernameTaken: "Este nombre de usuario ya está en uso", emailInUse: "Este correo ya está registrado.",
    switchToLogin: "Ir a Iniciar Sesión",
    backToWatchlists: "Volver a Listas", about: "Acerca de", technicalAnalysis: "Análisis Técnico", recentNews: "Noticias Recientes",
    notFinancialAdvice: "No es asesoramiento financiero",
    moderationError: "Tu publicación fue marcada por contenido inapropiado. Revisa e intenta de nuevo.",
  },
  fr: {
    dashboard: "Tableau de bord", aiChat: "Chat IA", quiz: "Quiz", forum: "Forum", watchlists: "Listes", settings: "Paramètres",
    marketIntelligence: "Intelligence de Marché", aiCuratedAnalysis: "Analyse IA avec scores de confiance et données en direct",
    analyzeLink: "Analyser le Lien", analyze: "Analyser", analyzing: "Analyse en cours...",
    pasteUrl: "Collez l'URL d'un article financier. L'IA fournira un score de confiance (1-10), un résumé et une détection de biais.",
    trustScore: "Score de Confiance", smartSummary: "Résumé Intelligent", biasDetection: "Détection de Biais",
    stockHeatmap: "Carte Thermique S&P 500",
    aiFinancialAdvisor: "Conseiller Financier IA", poweredByAI: "Alimenté par IA · Usage éducatif uniquement",
    history: "Historique", newChat: "Nouveau Chat", chatHistory: "Historique des Chats", noSavedChats: "Aucun chat sauvegardé.",
    askAnything: "Posez vos questions sur la finance, l'investissement...",
    smartForum: "Forum Intelligent", discussInvestments: "Discutez d'investissements avec vérification IA",
    newThread: "Nouveau Sujet", createNewThread: "Créer un Nouveau Sujet", threadTitle: "Titre du sujet...",
    shareThoughts: "Partagez vos idées...", postThread: "Publier", cancel: "Annuler",
    searchThreads: "Rechercher des sujets...", factCheck: "Vérifier", writeComment: "Écrire un commentaire...",
    all: "Tout", general: "Général", portfolios: "Portefeuilles", markets: "Marchés", sectors: "Secteurs",
    trackStocks: "Suivez vos actions et ETFs favoris", newList: "Nouvelle Liste",
    createNewWatchlist: "Créer une Nouvelle Liste", watchlistName: "Nom de la liste...", create: "Créer",
    addStock: "Ajouter", searchStocksEtfs: "Rechercher actions, ETFs, crypto...", noStocksYet: "Pas encore d'actions. Ajoutez-en !",
    noWatchlistsYet: "Pas de Listes", createFirstWatchlist: "Créez votre première liste pour commencer.",
    createWatchlist: "Créer une Liste", items: "éléments",
    profile: "Profil", displayName: "Nom d'affichage", changesSaveAuto: "Les modifications sont enregistrées automatiquement",
    email: "E-mail", emailCannotChange: "L'e-mail ne peut pas être modifié", username: "Nom d'utilisateur",
    anonymousMode: "Mode Anonyme", hideNameAvatar: "Masquer votre nom et avatar dans les publications du forum",
    appearAs: "Vous apparaîtrez comme", anonymousTrader: "Trader Anonyme",
    language: "Langue", selectLanguage: "Choisissez votre langue préférée",
    logOut: "Déconnexion", uploadPhoto: "Télécharger une Photo",
    createAccount: "Créer un Compte", logIn: "Se Connecter", emailAddress: "Adresse e-mail", password: "Mot de passe",
    alreadyHaveAccount: "Vous avez déjà un compte ?", dontHaveAccount: "Vous n'avez pas de compte ?",
    signUp: "S'inscrire", fillAllFields: "Remplissez tous les champs", passwordMin6: "Le mot de passe doit contenir au moins 6 caractères",
    chooseUsername: "Choisissez un nom d'utilisateur", usernameRequired: "Le nom d'utilisateur est obligatoire",
    usernameTaken: "Ce nom d'utilisateur est déjà pris", emailInUse: "Cet e-mail est déjà enregistré.",
    switchToLogin: "Passer à la Connexion",
    backToWatchlists: "Retour aux Listes", about: "À propos", technicalAnalysis: "Analyse Technique", recentNews: "Actualités Récentes",
    notFinancialAdvice: "Pas un conseil financier",
    moderationError: "Votre publication a été signalée pour contenu inapproprié. Veuillez la réviser.",
  },
  pt: {
    dashboard: "Painel", aiChat: "Chat IA", quiz: "Quiz", forum: "Fórum", watchlists: "Listas", settings: "Configurações",
    marketIntelligence: "Inteligência de Mercado", aiCuratedAnalysis: "Análise com IA, pontuações de confiança e dados ao vivo",
    analyzeLink: "Analisar Link", analyze: "Analisar", analyzing: "Analisando...",
    pasteUrl: "Cole qualquer URL de artigo financeiro. A IA fornecerá uma pontuação de confiança (1-10), resumo e detecção de viés.",
    trustScore: "Pontuação de Confiança", smartSummary: "Resumo Inteligente", biasDetection: "Detecção de Viés",
    stockHeatmap: "Mapa de Calor S&P 500",
    aiFinancialAdvisor: "Consultor Financeiro IA", poweredByAI: "Com IA · Apenas uso educativo",
    history: "Histórico", newChat: "Novo Chat", chatHistory: "Histórico de Chats", noSavedChats: "Nenhum chat salvo.",
    askAnything: "Pergunte sobre finanças, investimentos, mercados...",
    smartForum: "Fórum Inteligente", discussInvestments: "Discuta investimentos com verificação de fatos por IA",
    newThread: "Novo Tópico", createNewThread: "Criar Novo Tópico", threadTitle: "Título do tópico...",
    shareThoughts: "Compartilhe suas ideias...", postThread: "Publicar", cancel: "Cancelar",
    searchThreads: "Buscar tópicos...", factCheck: "Verificar", writeComment: "Escreva um comentário...",
    all: "Todos", general: "Geral", portfolios: "Portfólios", markets: "Mercados", sectors: "Setores",
    trackStocks: "Acompanhe suas ações e ETFs favoritos", newList: "Nova Lista",
    createNewWatchlist: "Criar Nova Lista", watchlistName: "Nome da lista...", create: "Criar",
    addStock: "Adicionar", searchStocksEtfs: "Buscar ações, ETFs, cripto...", noStocksYet: "Sem ações ainda. Adicione algumas!",
    noWatchlistsYet: "Sem Listas Ainda", createFirstWatchlist: "Crie sua primeira lista para começar.",
    createWatchlist: "Criar Lista", items: "itens",
    profile: "Perfil", displayName: "Nome de exibição", changesSaveAuto: "Alterações salvas automaticamente",
    email: "E-mail", emailCannotChange: "O e-mail não pode ser alterado", username: "Usuário",
    anonymousMode: "Modo Anônimo", hideNameAvatar: "Ocultar seu nome e avatar nas publicações do fórum",
    appearAs: "Você aparecerá como", anonymousTrader: "Trader Anônimo",
    language: "Idioma", selectLanguage: "Escolha seu idioma preferido",
    logOut: "Sair", uploadPhoto: "Enviar Foto",
    createAccount: "Criar Conta", logIn: "Entrar", emailAddress: "Endereço de e-mail", password: "Senha",
    alreadyHaveAccount: "Já tem uma conta?", dontHaveAccount: "Não tem uma conta?",
    signUp: "Cadastrar-se", fillAllFields: "Preencha todos os campos", passwordMin6: "A senha deve ter pelo menos 6 caracteres",
    chooseUsername: "Escolha um nome de usuário", usernameRequired: "O nome de usuário é obrigatório",
    usernameTaken: "Este nome de usuário já está em uso", emailInUse: "Este e-mail já está registrado.",
    switchToLogin: "Ir para Entrar",
    backToWatchlists: "Voltar às Listas", about: "Sobre", technicalAnalysis: "Análise Técnica", recentNews: "Notícias Recentes",
    notFinancialAdvice: "Não é aconselhamento financeiro",
    moderationError: "Sua publicação foi sinalizada por conteúdo inapropriado. Revise e tente novamente.",
  },
};

const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

type LanguageState = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: Record<Language, string>;
};

const LanguageContext = createContext<LanguageState | null>(null);

export const LanguageProvider = ({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: Language }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
