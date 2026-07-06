export const translations = {
  en: {
    // App & Nav
    appTitle: "Ice IQ",
    appSubtitle: "Cloud-synced with player history and graphs.",
    players: "Players",
    matches: "Matches",
    manageSubscription: "Manage Subscription",
    logout: "Log Out",
    login: "Log in",
    register: "Register",
    upgrade: "Upgrade",
    myAccount: "My Account",

    // Auth
    loginToContinue: "Log in to Continue",
    continueWithGoogle: "Continue with Google",
    or: "or",
    email: "Email",
    password: "Password",
    loginWithEmail: "Log in with Email",
    forgotPassword: "Forgot password?",
    noAccountPrompt: "Don't have an account?",
    createAccount: "Create Account",
    confirmPassword: "Confirm Password",
    alreadyRegistered: "Already registered?",

    // Header
    header: {
      switchToSv: "Byt till Svenska",
      switchToEn: "Switch to English",
    },

    // Home / Hero Section
    home: {
      badge: "Now with AI Coach",
      heroTitle1: "Your Personal",
      heroTitle2: "Hockey Analyst",
      heroDesc: "Log a game in a couple of minutes and let the AI coach turn the stats into concrete advice. Simple enough for any parent, player, or coach.",
      goToDashboard: "Go to Dashboard",
      tryAiCoach: "Try the AI Coach",
      aiCardQuote: "\"Great game! You had 85% positive actions in the defensive zone. Focus on breakout passes next period.\"",
    },

    // Hero Section (legacy)
    hero: {
      title: "Hockey Analytics",
      subtitle: "Made Simple",
      description: "Professional scouting tools for coaches, players, and supportive parents. Track performance, visualize progress, and make data-driven decisions."
    },

    // Common Actions
    common: {
      getStarted: "Get Started Free",
      viewPlans: "View Plans",
      recommended: "Recommended",
      upgradeNow: "Upgrade Now",
      startFreeTrial: "Start Free",
      open: "Open",
      openDashboard: "Open Dashboard"
    },

    // Features Section
    features: {
      mainTitle: "Everything You Need for Player Development",
      mainDesc: "From grassroots to professional level, we've got you covered.",
      ai: {
        title: "AI Coach",
        desc: "Get tactical advice and feedback directly from our Gemini-powered AI."
      },
      analytics: {
        title: "Advanced Analytics",
        desc: "Track player performance with detailed statistics and visualizations."
      },
      cloud: {
        title: "Cloud Sync",
        desc: "Access your data anywhere, on any device. Always backed up."
      },
      teams: {
        title: "Team Management",
        desc: "Manage multiple players and teams with ease."
      },
      security: {
        title: "Data Security",
        desc: "Your data is encrypted and secure. We never share your information."
      }
    },

    // Pricing Section
    pricing: {
      title: "Simple, Transparent Pricing",
      desc: "Choose the plan that fits your needs. No hidden fees.",
      perMonth: "SEK/month",
      perYear: "SEK/year",
      popular: "Popular"
    },

    // Plans
    plans: {
      free: {
        name: "Free",
        period: "forever",
        tagline: "For getting started",
        f1: "Basic scoring",
        f2: "Save 1 player",
        f3: "Simple history",
        f4: "3 free AI credits/month"
      },
      premium: {
        tagline: "For dedicated players",
        f1: "Unlimited players",
        f2: "Cloud sync",
        f3: "Advanced charts",
        f4: "50 AI credits/month",
        f5: "Gemini Flash AI",
        cta: "Get Premium"
      },
      elite: {
        badge: "AI Power",
        tagline: "For future pros",
        f1: "Everything in Premium",
        f2: "500 AI credits/month",
        f3: "Smarter AI (Gemini Pro)",
        f4: "Chat with the coach (follow-ups)",
        f5: "Priority support",
        cta: "Get Elite"
      }
    },

    // CTA Section
    cta: {
      title: "Ready to Transform Your Game?",
      desc: "Get started in a couple of minutes. Free, no card required.",
      titleUser: "Ready to analyze the next game?",
      descUser: "Your AI coach is waiting for new data."
    },

    // AI Coach
    ai: {
      upsellDesc: "Get personalized tactical feedback and training tips powered by Gemini AI.",
      unlock: "Unlock AI Coach",
      credits: "credits left",
      readyDesc: "I can analyze your latest match stats and provide tactical advice.",
      analyzeBtn: "Analyze Stats (1 Credit)",
      analyzing: "Coach is thinking...",
      outOfCredits: "You're out of AI credits for this month.",
      error: "Coach is offline. Please try again later.",
      newAnalysis: "New Analysis",
      followUpPlaceholder: "Ask a follow-up question...",
      costNote: "Each question costs 1 credit",
      resetChat: "Reset chat"
    },

    // Player & Match Logic
    playerName: "Player's Name",
    select: "Select",
    team: "Team",
    gameDate: "Game Date",
    template: "Template",
    showPlayerHistory: "Show Player History",
    positiveActions: "Positive Actions",
    negativeActions: "Negative Actions",
    summaryAndControls: "Summary & Controls",
    totalPointsMatch: "Total Points (Match)",
    bonusFactor: "Bonus Factor ($/pt)",
    carriedOverBalance: "Carried Over Balance",
    totalBonus: "Total Bonus",
    saveMatchAndReset: "Save Match & Reset",
    resetAll: "Reset Current Match",
    freeTierLimitPlayer: "Free tier: Max 1 player can be saved.",
    selectPlayer: "Select Player",
    playerHistory: "Player History",
    graph: "Graph",
    statsAndTrends: "Stats & Trends",

    // Dashboard specific
    dashboard: {
      welcome: "Welcome back,",
      thisWeek: "This Week",
      noStatsYet: "No stats recorded yet.",
      settleConfirm: "Settle balance for {name}?",
      balanceSettled: "Balance settled!",
      settleError: "Could not settle balance.",
      playerAdded: "{name} added!",
      playerAddError: "Could not save player",
      moneyMode: "Money Mode",
      pointsMode: "Points Mode",
      bonusWeighting: "Bonus Weighting",
      bonusWeightingDesc: "Multiplier for bonus actions"
    },
    dashboardSubtitle: "Track your scouting progress",
    selectPlayerFirst: "Please select a player first",
    gameSavedSuccessfully: "Game saved successfully!",
    saveError: "Could not save game.",
    resetAllWarning: "Are you sure you want to reset all stats for this match?",

    // Subscription Modal & Billing
    selectYourPlan: "Select Your Plan",
    currentPlan: "Current Plan",
    cancelSubscription: "Cancel Subscription",
    free_label: "Free",
    perMonth: "per month",
    freeFeature1: "Basic scoring system",
    freeFeature2Player: "Save 1 player",
    freeFeature3: "Simple match history",
    premiumFeature1: "Cloud sync",
    premiumFeature2: "Advanced statistics",
    orYearlySimple: "or $29/year",
    premiumFeaturePlus: "Everything in Free, plus:",
    premiumFeature3: "Unlimited players",
    premiumFeature4: "Customizable templates",
    chooseMonthlySimple: "Choose Monthly",
    chooseYearlySimple: "Choose Yearly (Save over 2 months)",
    recommended_label: "Recommended",
    upgradeToPremium: "Upgrade to Premium",
    monthly: "Monthly",
    yearly: "Yearly",
    savePercent: "Save ~15%",
    paymentSuccess: "Payment successful! Your subscription is now active.",
    paymentCancelled: "Payment was cancelled.",
    manageBilling: "Manage Billing",
    processingPayment: "Processing payment...",
    totalBalance: "Total Balance",
    markAsSettled: "Mark as settled",
    settleBalanceConfirm: "Do you want to reset the balance? Only do this if payment/settlement has occurred.",
    upgradeCTA: "🔒 Upgrade to Premium",

    // Stats
    premiumStats: "Advanced Statistics",
    upgradeForStats: "Upgrade to Premium to unlock detailed statistics and trend analysis.",
    needMoreMatches: "Need at least two matches to show a graph.",
    noMatchesRegistered: "No matches registered.",
    avgPoints: "Avg Points",
    bestGame: "Best Game",
    worstGame: "Worst Game",
    pointDevelopment: "Point Development",
    mostCommonPositive: "Most Common Positive Actions",
    mostCommonNegative: "Most Common Negative Actions",

    // Navigation
    nav: {
      dashboard: "Dashboard",
      players: "Players",
      upgrade: "Upgrade",
      login: "Login",
      logout: "Logout"
    }
  },
  sv: {
    // App & Nav
    appTitle: "Ice IQ",
    appSubtitle: "Moln-synkroniserad med spelarhistorik och grafer.",
    players: "Spelare",
    matches: "Matcher",
    manageSubscription: "Hantera Prenumeration",
    logout: "Logga ut",
    login: "Logga in",
    register: "Registrera dig",
    upgrade: "Uppgradera",
    myAccount: "Mitt Konto",

    // Auth
    loginToContinue: "Logga in för att fortsätta",
    continueWithGoogle: "Fortsätt med Google",
    or: "eller",
    email: "E-post",
    password: "Lösenord",
    loginWithEmail: "Logga in med e-post",
    forgotPassword: "Glömt lösenord?",
    noAccountPrompt: "Har du inget konto?",
    createAccount: "Skapa konto",
    confirmPassword: "Bekräfta lösenord",
    alreadyRegistered: "Redan registrerad?",

    // Header
    header: {
      switchToSv: "Byt till Svenska",
      switchToEn: "Switch to English",
    },

    // Home / Hero Section
    home: {
      badge: "Nu med AI-coach",
      heroTitle1: "Din personliga",
      heroTitle2: "Hockeyanalytiker",
      heroDesc: "Registrera en match på ett par minuter och låt AI-coachen göra om statistiken till konkreta råd. Enkelt nog för alla föräldrar, spelare och tränare.",
      goToDashboard: "Gå till Dashboard",
      tryAiCoach: "Testa AI-coachen",
      aiCardQuote: "\"Bra match! Du hade 85% positiva aktioner i defensiv zon. Fokusera på uppspelen i nästa period.\"",
    },

    // Hero Section (legacy)
    hero: {
      title: "Hockey Analytics",
      subtitle: "Gjord enkelt",
      description: "Professionella scoutingverktyg för tränare, spelare och stöttande föräldrar. Följ prestationer, visualisera framsteg och ta datadrivna beslut."
    },

    // Common Actions
    common: {
      getStarted: "Börja gratis",
      viewPlans: "Se priser",
      recommended: "Rekommenderas",
      upgradeNow: "Uppgradera nu",
      startFreeTrial: "Börja gratis",
      open: "Öppna",
      openDashboard: "Öppna Dashboard"
    },

    // Features Section
    features: {
      mainTitle: "Allt du behöver för spelarutveckling",
      mainDesc: "Från gräsrot till professionell nivå, vi har verktygen för dig.",
      ai: {
        title: "AI Coach",
        desc: "Få taktiska råd och feedback direkt från vår Gemini-drivna AI."
      },
      analytics: {
        title: "Avancerad Analys",
        desc: "Följ spelarprestationer med detaljerad statistik och visualiseringar."
      },
      cloud: {
        title: "Molnsynk",
        desc: "Kom åt din data överallt, på valfri enhet. Alltid säkerhetskopierat."
      },
      teams: {
        title: "Laghantering",
        desc: "Hantera flera spelare och lag med enkelhet."
      },
      security: {
        title: "Datasäkerhet",
        desc: "Din data är krypterad och säker. Vi delar aldrig din information."
      }
    },

    // Pricing Section
    pricing: {
      title: "Enkel och tydlig prissättning",
      desc: "Välj den plan som passar dina behov. Inga dolda avgifter.",
      perMonth: "SEK/mån",
      perYear: "SEK/år",
      popular: "Populärast"
    },

    // Plans
    plans: {
      free: {
        name: "Gratis",
        period: "för alltid",
        tagline: "För att komma igång",
        f1: "Grundläggande poängsystem",
        f2: "Spara 1 spelare",
        f3: "Enkel historik",
        f4: "3 gratis AI-krediter/mån"
      },
      premium: {
        tagline: "För seriösa spelare",
        f1: "Obegränsat antal spelare",
        f2: "Molnsynk",
        f3: "Avancerade grafer",
        f4: "50 AI-krediter/mån",
        f5: "Gemini Flash AI",
        cta: "Välj Premium"
      },
      elite: {
        badge: "AI Power",
        tagline: "För framtida proffs",
        f1: "Allt i Premium",
        f2: "500 AI-krediter/mån",
        f3: "Smartare AI (Gemini Pro)",
        f4: "Chatta med coachen (följdfrågor)",
        f5: "Prioriterad support",
        cta: "Bli Elite"
      }
    },

    // CTA Section
    cta: {
      title: "Redo att transformera ditt spel?",
      desc: "Kom igång på ett par minuter. Gratis, inget kort krävs.",
      titleUser: "Redo att analysera nästa match?",
      descUser: "Din AI-coach väntar på ny data."
    },

    // AI Coach
    ai: {
      upsellDesc: "Få personlig taktisk feedback och träningstips drivet av Gemini AI.",
      unlock: "Lås upp AI-Coachen",
      credits: "krediter kvar",
      readyDesc: "Jag kan analysera dina senaste matcher och ge taktiska råd.",
      analyzeBtn: "Analysera Statistik (1 Kredit)",
      analyzing: "Coachen tänker...",
      outOfCredits: "Du har slut på AI-krediter för denna månad.",
      error: "Coachen är inte tillgänglig just nu. Försök igen senare.",
      newAnalysis: "Ny Analys",
      followUpPlaceholder: "Ställ en följdfråga...",
      costNote: "Varje fråga kostar 1 kredit",
      resetChat: "Rensa chatt"
    },

    // Player & Match Logic
    playerName: "Spelarens Namn",
    select: "Välj",
    team: "Lag",
    gameDate: "Matchdatum",
    template: "Mall",
    showPlayerHistory: "Visa Spelarhistorik",
    positiveActions: "Positiva Aktioner",
    negativeActions: "Negativa Aktioner",
    summaryAndControls: "Summering & Kontroller",
    totalPointsMatch: "Totalpoäng (Match)",
    bonusFactor: "Bonusfaktor (SEK/p)",
    carriedOverBalance: "Överfört Saldo",
    totalBonus: "Total Bonus",
    saveMatchAndReset: "Spara Match & Nollställ",
    resetAll: "Nollställ nuvarande match",
    freeTierLimitPlayer: "Gratisversionen: Max 1 spelare kan sparas.",
    selectPlayer: "Välj Spelare",
    playerHistory: "Spelarhistorik",
    graph: "Graf",
    statsAndTrends: "Statistik & Trend",

    // Dashboard specific
    dashboard: {
      welcome: "Välkommen tillbaka,",
      thisWeek: "Denna vecka",
      noStatsYet: "Ingen statistik registrerad än.",
      settleConfirm: "Reglera saldo för {name}?",
      balanceSettled: "Saldot reglerat!",
      settleError: "Kunde inte reglera.",
      playerAdded: "{name} har lagts till!",
      playerAddError: "Kunde inte spara spelaren",
      moneyMode: "Money Mode",
      pointsMode: "Poängläge",
      bonusWeighting: "Bonusviktning",
      bonusWeightingDesc: "Multiplikator för bonusaktioner"
    },
    dashboardSubtitle: "Följ din scouting-utveckling",
    selectPlayerFirst: "Välj en spelare först",
    gameSavedSuccessfully: "Matchen sparades!",
    saveError: "Kunde inte spara matchen.",
    resetAllWarning: "Är du säker på att du vill nollställa all statistik för denna match?",

    // Subscription Modal & Billing
    selectYourPlan: "Välj din Plan",
    currentPlan: "Nuvarande Plan",
    cancelSubscription: "Avbryt Prenumeration",
    free_label: "Gratis",
    perMonth: "per månad",
    freeFeature1: "Grundläggande poängsystem",
    freeFeature2Player: "Spara 1 spelare",
    freeFeature3: "Enkel matchhistorik",
    premiumFeature1: "Molnsynkronisering",
    premiumFeature2: "Avancerad statistik",
    orYearlySimple: "eller 299 SEK/år",
    premiumFeaturePlus: "Allt i Gratis, plus:",
    premiumFeature3: "Obegränsade spelare",
    premiumFeature4: "Anpassningsbara mallar",
    chooseMonthlySimple: "Välj Månadsvis",
    chooseYearlySimple: "Välj Årsvis (Spara över 2 månader)",
    recommended_label: "Rekommenderas",
    upgradeToPremium: "Uppgradera till Premium",
    monthly: "Månadsvis",
    yearly: "Årsvis",
    savePercent: "Spara ~15%",
    paymentSuccess: "Betalning lyckades! Din prenumeration är nu aktiv.",
    paymentCancelled: "Betalningen avbröts.",
    manageBilling: "Hantera fakturering",
    processingPayment: "Bearbetar betalning...",
    totalBalance: "Totalt Saldo",
    markAsSettled: "Markera som reglerat",
    settleBalanceConfirm: "Vill du nollställa saldot? Markera detta endast om betalning/reglering har skett.",
    upgradeCTA: "🔒 Uppgradera till Premium",

    // Stats
    premiumStats: "Avancerad Statistik",
    upgradeForStats: "Uppgradera till Premium för att låsa upp detaljerad statistik och trendanalys.",
    needMoreMatches: "Behöver minst två matcher för att visa en graf.",
    noMatchesRegistered: "Inga matcher registrerade.",
    avgPoints: "Snittpoäng",
    bestGame: "Bästa Match",
    worstGame: "Sämsta Match",
    pointDevelopment: "Poängutveckling",
    mostCommonPositive: "Vanligaste Positiva Aktioner",
    mostCommonNegative: "Vanligaste Negativa Aktioner",

    // Navigation
    nav: {
      dashboard: "Dashboard",
      players: "Spelare",
      upgrade: "Uppgradera",
      login: "Logga in",
      logout: "Logga ut"
    }
  }
};

export type Language = keyof typeof translations;
