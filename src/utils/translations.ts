export const translations = {
  en: {
    // Footer & legal — saknades tidigare helt, vilket gjorde att footern och
    // rubrikerna på villkors- och policysidorna renderade själva nyckeln
    // ("termsLink", "privacyLink", "supportContact") rakt av.
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    supportContact: "Contact support",
    footerDeveloper: "Developed and operated by",

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
      tagline: "Smart Hockey Stats",
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
        desc: "Get tactical advice and feedback from your personal AI coach."
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
      mental: {
        title: "Mental training",
        desc: "Short routines that help players prepare and stay calm — a pre-game ritual, breathing exercises, and more on the way. Free for everyone."
      },
      security: {
        title: "Data Security",
        desc: "Your data is encrypted and secure. We never share your information."
      }
    },

    // Season development view
    seasonView: {
      title: "Development",
      last5: "Last 5 avg",
      trendUp: "Above season average",
      trendDown: "Below season average"
    },

    // Weekly email digest
    digest: {
      title: "Weekly email summary",
      desc: "A short Monday recap of last week's games. Only sent when there is something to report."
    },

    // Share match report
    share: {
      title: "Share match report",
      desc: "A shareable summary of the game — points and actions only, never balance.",
      reportTitle: "Match report",
      pointsLabel: "Points",
      shareBtn: "Share",
      downloadBtn: "Download",
      formatSquare: "Square",
      formatStory: "Story",
      statGames: "Games",
      statAvg: "Average",
      statBest: "Best"
    },

    // Matchens höjdpunkt på den delbara bilden — regelbaserad, se
    // src/utils/matchHighlight.ts. Håll dem korta: de ska rymmas på en rad.
    highlight: {
      firstGame: "First game logged",
      seasonBest: "Season best — {points} pts",
      streak: "{count} games in a row above average",
      aboveAverage: "{percent}% above season average",
      topAction: "{count}× {action}"
    },

    // Demo/onboarding
    demo: {
      badge: "Example data",
      banner: "This is what Ice IQ looks like with a few games logged. Add your own player to get started for real.",
      cta: "Add your first player",
      saveBlocked: "This is example data — add your own player first."
    },

    // Free plan limits
    playerLimit: {
      reached: "Free plan is limited to {limit} players. Upgrade to add more.",
      usage: "Free plan: {count} of {limit} players used."
    },

    // Plan comparison table
    compare: {
      title: "Compare plans",
      feature: "Feature",
      players: "Saved players",
      aiCredits: "AI credits per month",
      scoring: "Match scoring",
      history: "Match history",
      cloud: "Cloud sync",
      charts: "Deeper stats & trends",
      moneyMode: "Money Mode",
      support: "Priority support",
      price: "Price",
      unlimited: "Unlimited"
    },

    // Money Mode Section
    moneyMode: {
      badge: "Unique to Ice IQ",
      title: "Money Mode",
      heading: "Turn performance into pocket money — on your terms",
      desc: "For parents and coaches: attach a small reward to the actions you want to encourage, and Ice IQ keeps track of the balance between games. You decide what counts, how much, and when it is settled.",
      example: "$1 per goal, $0.50 per assist — watch the balance grow after every game.",
      point1Title: "You set the rules",
      point1Desc: "Reward effort and attitude, not just goals — a solid backcheck can be worth as much as a scored goal.",
      point2Title: "The balance carries over",
      point2Desc: "Ice IQ keeps the running balance between games until you choose to settle it.",
      point3Title: "Built for development",
      point3Desc: "Nothing is left to chance — every dollar is tied to real actions on the ice that you have defined yourself.",
      note: "Money Mode is a tool for the adult, and always optional. Prefer points only? Switch mode with one tap.",
      mockTitle: "Tonight's game",
      mockGoal: "Goal",
      mockAssist: "Assist",
      mockBackcheck: "Backcheck",
      mockBalance: "Total balance"
    },

    // Pricing Section
    pricing: {
      title: "Simple, Transparent Pricing",
      desc: "Choose the plan that fits your needs. No hidden fees.",
      // {currency} fylls i av currencyLabel() i src/utils/pricing.ts — tom
      // sträng för USD, eftersom beloppet då redan bär sitt $.
      perMonth: "{currency}/month",
      perYear: "{currency}/year",
      popular: "Popular"
    },

    // Plans
    plans: {
      free: {
        name: "Free",
        period: "forever",
        tagline: "For getting started",
        f1: "Basic scoring",
        f2: "Save up to 3 players",
        f3: "Simple history",
        f4: "3 free AI credits/month"
      },
      premium: {
        tagline: "For dedicated players",
        f1: "Unlimited players",
        f2: "Cloud sync",
        f3: "Deeper stats & trends",
        f4: "50 AI credits/month",
        f5: "Fast AI analyses",
        cta: "Get Premium"
      },
      elite: {
        badge: "AI Power",
        tagline: "For future pros",
        f1: "Everything in Premium",
        f2: "500 AI credits/month",
        f3: "Deeper AI analyses",
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
      upsellDesc: "Get personalized tactical feedback and training tips from the Ice IQ Coach.",
      unlock: "Unlock AI Coach",
      credits: "credits left",
      creditsSplit: "{monthly} included this month · {purchased} purchased, and these carry over",
      readyDesc: "I can analyze your latest match stats and provide tactical advice.",
      analyzeBtn: "Analyze Stats (1 Credit)",
      analyzing: "Coach is thinking...",
      engineName: "Ice IQ Coach Engine",
      outOfCredits: "You're out of AI credits for this month.",
      error: "Coach is offline. Please try again later.",
      newAnalysis: "New Analysis",
      followUpPlaceholder: "Ask a follow-up question...",
      costNote: "Each question costs 1 credit",
      resetChat: "Reset chat",
      newChat: "New chat",
      history: "Previous chats",
      historyEmpty: "No saved chats yet.",
      deleteChat: "Delete chat",
      quick1: "What should I practice before the next game?",
      quick2: "Compare my last 3 games",
      quick3: "Where am I strongest right now?",
      loading1: "Reading your stats…",
      loading2: "Analyzing patterns…",
      loading3: "Writing your advice…",
      upgradeCta: "Upgrade for more credits",
      buyCredits: "Buy {count} credits for {price}",
      buyingCredits: "Opening checkout…",
      lowCreditsWarning: "Almost out of credits",
      buyCreditsInstead: "Or buy {count} credits for {price} instead",
      shareWithPlayer: "Share with player",
      sharing: "Sending…",
      sharedWithPlayer: "Sent to the player's email",
      shareError: "Could not send the email right now",
      shareInsight: "Share this insight",
      tryBreathing: "Want to try a breathing exercise?",
      insightShareTitle: "Share coach insight",
      insightShareDesc: "The coach's one-liner as an image — no balance, no email, nothing but the observation.",
      insightCardTitle: "Coach insight"
    },

    // Breathing / mental routines
    breathing: {
      entry: "Breathing exercise",
      modalTitle: "Breathing",
      modalDesc: "Two minutes before a faceoff, or on the way home. Nothing to read — just follow the shape.",
      patternLabel: "Breathing pattern",
      pattern: {
        calm: "Calm 4–6",
        box: "Box 4-4-4-4"
      },
      phase: {
        in: "Breathe in",
        hold: "Hold",
        out: "Breathe out",
        holdOut: "Hold"
      },
      ready: "Ready",
      start: "Start",
      pause: "Pause",
      reset: "Start over",
      cycles: "{count} rounds done",
      hint: {
        calm: "Longer out than in — that is what settles the pulse.",
        box: "Follow the dot around the square. Four seconds a side."
      }
    },

    // Rutiner: fast, granskad copy — se content/routines/*.md för källan
    // och resonemanget kring varför den INTE genereras av AI:n live.
    // routines.nightBeforeGame är den enda rutinen i biblioteket idag.
    routines: {
      nightBeforeGame: {
        sectionTitle: "The night before a game",
        intro: "This is something players who want to get really good do the night before a game. Not because you have to — it just works.",
        step1Title: "What's ONE thing you want to do well tomorrow?",
        step1Placeholder: "e.g. keep my head up on passes",
        step1Error: "Write one thing before you continue.",
        step2Title: "Right before you turn off the light",
        step2Body: "Do a short breathing exercise, or spend ten seconds picturing that one thing — see yourself doing it, and it going well.",
        step2Cta: "Go to the breathing exercise",
        rewardTitle: "Then you're done",
        rewardBodyWithAnswer: "You said: {answer}. Whatever happens tomorrow, you've done your part tonight. That's enough.",
        rewardBodyEmpty: "Whatever happens tomorrow, you've done your part tonight. That's enough.",
        floor: "If the nerves feel bigger than this, talk to your coach or an adult you trust. This routine is for game-day nerves, not for everything.",
        back: "Back",
        next: "Next",
        done: "Done",
        // Matchrelativ streak, inte kalenderdagar — se computeRoutineStreak
        // i functions/index.js för varför.
        streakOne: "1 game prepared for",
        streakMany: "{count} games in a row prepared for"
      }
    },

    // Player link — a standalone, login-free page for the player themselves
    playerLink: {
      generateButton: "Generate link",
      // Tooltip på själva knappen (title-attribut) — förklarar VARFÖR man
      // klickar, inte bara vad knappen heter. Modalens egen modalDesc
      // täcker mekaniken (ingen inloggning osv) EFTER man redan klickat;
      // det här är det steget innan.
      generateHint: "A page {name} can open on their own phone — breathing exercise, progress, and your notes. No login needed.",
      generating: "Generating…",
      mintError: "Could not generate the link right now",
      modalTitle: "Link for {name}",
      modalDesc: "A standalone page {name} can open on their own device — no login needed. The same link works every time.",
      copy: "Copy link",
      copied: "Link copied",
      share: "Share",
      pageGreeting: "Hi {name}!",
      breathingSectionTitle: "Breathing exercise",
      coachNoteTitle: "What your coach has said",
      noCoachNote: "Nothing from the coach yet — check back after your next game.",
      notFoundTitle: "Link not found",
      notFoundBody: "This link doesn't seem to be valid. Ask whoever sent it to send a new one.",
      revokedTitle: "Link no longer active",
      revokedBody: "This link has been turned off. Ask whoever sent it for a new one."
    },

    // Player & Match Logic
    playerName: "Player's Name",
    playerEmail: "Player's email",
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
    freeTierLimitPlayer: "Free tier: Max 3 players can be saved.",
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
      bonusWeightingDesc: "Multiplier for bonus actions",
      draftRestored: "Your in-progress game was restored.",
      saveShort: "Save game"
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
    freeFeature2Player: "Save up to 3 players",
    freeFeature3: "Simple match history",
    premiumFeature1: "Cloud sync",
    premiumFeature2: "Advanced statistics",
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
    success: {
      title: "Payment successful",
      subscriptionBody: "Your subscription is now active.",
      creditsBody: "Your credits have been added. They stay on your account until you use them.",
      emailNote: "A receipt is on its way to your email.",
      backToApp: "Back to app",
      toDashboard: "Go to dashboard",
      cancelledTitle: "Payment cancelled",
      cancelledBody: "No charge was made.",
      cancelledNote: "You can try again whenever you like.",
      tryAgain: "Try again",
      genericTitle: "Thank you",
      genericBody: "Your payment went through."
    },
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

    // Billing
    billing: {
      pastDueTitle: "The payment didn't go through",
      pastDueBody: "We couldn't charge your subscription — usually an expired card. Update your details and everything carries on as before.",
      pastDueAction: "Update payment details",
      pastDueOpening: "Opening…"
    },

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
    // Footer & juridik — se kommentaren i en-blocket.
    termsLink: "Användarvillkor",
    privacyLink: "Integritetspolicy",
    supportContact: "Kontakta supporten",
    footerDeveloper: "Utvecklas och drivs av",

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
      tagline: "Smart hockeystatistik",
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
        desc: "Få taktiska råd och feedback från din personliga AI-coach."
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
      mental: {
        title: "Mental träning",
        desc: "Korta rutiner som hjälper spelare förbereda sig och hålla lugnet — en rutin inför match, andningsövningar och fler på väg. Gratis för alla."
      },
      security: {
        title: "Datasäkerhet",
        desc: "Din data är krypterad och säker. Vi delar aldrig din information."
      }
    },

    // Season development view
    seasonView: {
      title: "Utveckling",
      last5: "Snitt senaste 5",
      trendUp: "Över säsongssnittet",
      trendDown: "Under säsongssnittet"
    },

    // Weekly email digest
    digest: {
      title: "Veckosammanfattning via e-post",
      desc: "En kort måndagssummering av förra veckans matcher. Skickas bara när det finns något att berätta."
    },

    // Share match report
    share: {
      title: "Dela matchrapport",
      desc: "En delbar summering av matchen — bara poäng och aktioner, aldrig saldo.",
      reportTitle: "Matchrapport",
      pointsLabel: "Poäng",
      shareBtn: "Dela",
      downloadBtn: "Ladda ner",
      formatSquare: "Kvadrat",
      formatStory: "Story",
      statGames: "Matcher",
      statAvg: "Snitt",
      statBest: "Bästa"
    },

    // Se kommentaren i 'en' ovan.
    highlight: {
      firstGame: "Första registrerade matchen",
      seasonBest: "Säsongsbästa — {points} poäng",
      streak: "{count} matcher i rad över snittet",
      aboveAverage: "{percent} % över säsongssnittet",
      topAction: "{count} × {action}"
    },

    // Demo/onboarding
    demo: {
      badge: "Exempeldata",
      banner: "Så här ser Ice IQ ut med några matcher registrerade. Lägg till din egen spelare för att börja på riktigt.",
      cta: "Lägg till din första spelare",
      saveBlocked: "Detta är exempeldata — lägg till en egen spelare först."
    },

    // Free plan limits
    playerLimit: {
      reached: "Gratisplanen är begränsad till {limit} spelare. Uppgradera för att lägga till fler.",
      usage: "Gratisplan: {count} av {limit} spelare använda."
    },

    // Plan comparison table
    compare: {
      title: "Jämför planerna",
      feature: "Funktion",
      players: "Sparade spelare",
      aiCredits: "AI-krediter per månad",
      scoring: "Matchregistrering",
      history: "Matchhistorik",
      cloud: "Molnsynk",
      charts: "Djupare statistik & trender",
      moneyMode: "Money Mode",
      support: "Prioriterad support",
      price: "Pris",
      unlimited: "Obegränsat"
    },

    // Money Mode Section
    moneyMode: {
      badge: "Unikt för Ice IQ",
      title: "Money Mode",
      heading: "Gör prestation till fickpengar — på dina villkor",
      desc: "För föräldrar och tränare: koppla en liten belöning till de aktioner du vill uppmuntra, så håller Ice IQ koll på saldot mellan matcherna. Du bestämmer vad som räknas, hur mycket, och när det regleras.",
      example: "10 kr per mål, 5 kr per assist — se saldot växa efter varje match.",
      point1Title: "Du sätter reglerna",
      point1Desc: "Belöna slit och attityd, inte bara mål — en bra returlöpning kan vara värd lika mycket som ett mål.",
      point2Title: "Saldot följer med",
      point2Desc: "Ice IQ håller koll på det löpande saldot mellan matcherna tills ni väljer att reglera det.",
      point3Title: "Byggt för utveckling",
      point3Desc: "Inget lämnas åt slumpen — varje krona är kopplad till verkliga aktioner på isen som du själv har definierat.",
      note: "Money Mode är ett verktyg för den vuxna, och alltid frivilligt. Vill ni hellre köra bara poäng? Byt läge med ett tryck.",
      mockTitle: "Kvällens match",
      mockGoal: "Mål",
      mockAssist: "Assist",
      mockBackcheck: "Returlöpning",
      mockBalance: "Totalt saldo"
    },

    // Pricing Section
    pricing: {
      title: "Enkel och tydlig prissättning",
      desc: "Välj den plan som passar dina behov. Inga dolda avgifter.",
      perMonth: "{currency}/mån",
      perYear: "{currency}/år",
      popular: "Populärast"
    },

    // Plans
    plans: {
      free: {
        name: "Gratis",
        period: "för alltid",
        tagline: "För att komma igång",
        f1: "Grundläggande poängsystem",
        f2: "Spara upp till 3 spelare",
        f3: "Enkel historik",
        f4: "3 gratis AI-krediter/mån"
      },
      premium: {
        tagline: "För seriösa spelare",
        f1: "Obegränsat antal spelare",
        f2: "Molnsynk",
        f3: "Djupare statistik & trender",
        f4: "50 AI-krediter/mån",
        f5: "Snabba AI-analyser",
        cta: "Välj Premium"
      },
      elite: {
        badge: "AI Power",
        tagline: "För framtida proffs",
        f1: "Allt i Premium",
        f2: "500 AI-krediter/mån",
        f3: "Djupare AI-analyser",
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
      upsellDesc: "Få personlig taktisk feedback och träningstips från Ice IQ Coach.",
      unlock: "Lås upp AI-Coachen",
      credits: "krediter kvar",
      creditsSplit: "{monthly} ingår denna månad · {purchased} köpta, och de ligger kvar",
      readyDesc: "Jag kan analysera dina senaste matcher och ge taktiska råd.",
      analyzeBtn: "Analysera Statistik (1 Kredit)",
      analyzing: "Coachen tänker...",
      engineName: "Ice IQ Coach Engine",
      outOfCredits: "Du har slut på AI-krediter för denna månad.",
      error: "Coachen är inte tillgänglig just nu. Försök igen senare.",
      newAnalysis: "Ny Analys",
      followUpPlaceholder: "Ställ en följdfråga...",
      costNote: "Varje fråga kostar 1 kredit",
      resetChat: "Rensa chatt",
      newChat: "Ny chatt",
      history: "Tidigare chattar",
      historyEmpty: "Inga sparade chattar än.",
      deleteChat: "Ta bort chatt",
      quick1: "Vad ska jag träna på till nästa match?",
      quick2: "Jämför mina senaste 3 matcher",
      quick3: "Var är jag starkast just nu?",
      loading1: "Läser din statistik…",
      loading2: "Analyserar mönster…",
      loading3: "Formulerar dina råd…",
      upgradeCta: "Uppgradera för fler krediter",
      buyCredits: "Köp {count} krediter för {price}",
      buyingCredits: "Öppnar kassan…",
      lowCreditsWarning: "Nästan slut på krediter",
      buyCreditsInstead: "Eller köp {count} krediter för {price} istället",
      shareWithPlayer: "Dela med spelaren",
      sharing: "Skickar…",
      sharedWithPlayer: "Skickat till spelarens e-post",
      shareError: "Kunde inte skicka mejlet just nu",
      shareInsight: "Dela insikten",
      tryBreathing: "Vill du prova en andningsövning?",
      insightShareTitle: "Dela coach-insikt",
      insightShareDesc: "Coachens en-radare som bild — inget saldo, ingen e-post, bara observationen.",
      insightCardTitle: "Coach-insikt"
    },

    // Andning / mentala rutiner
    breathing: {
      entry: "Andningsövning",
      modalTitle: "Andning",
      modalDesc: "Två minuter före nedsläpp, eller på vägen hem. Inget att läsa — följ bara formen.",
      patternLabel: "Andningsmönster",
      pattern: {
        calm: "Lugn 4–6",
        box: "Box 4-4-4-4"
      },
      phase: {
        in: "Andas in",
        hold: "Håll",
        out: "Andas ut",
        holdOut: "Håll"
      },
      ready: "Redo",
      start: "Starta",
      pause: "Pausa",
      reset: "Börja om",
      cycles: "{count} varv klara",
      hint: {
        calm: "Längre ut än in — det är det som lugnar pulsen.",
        box: "Följ punkten runt kvadraten. Fyra sekunder per sida."
      }
    },

    routines: {
      nightBeforeGame: {
        sectionTitle: "Kvällen innan match",
        intro: "Det här är något spelare som vill bli riktigt bra gör kvällen innan match. Inte för att man måste — det funkar bara.",
        step1Title: "Vad är EN sak du vill göra bra imorgon?",
        step1Placeholder: "t.ex. hålla huvudet uppe vid passningar",
        step1Error: "Skriv en sak innan du går vidare.",
        step2Title: "Precis innan lampan släcks",
        step2Body: "Kör en kort andningsövning, eller tänk igenom den där EN saken i tio sekunder — se dig själv göra den, och att det går bra.",
        step2Cta: "Gå till andningsövningen",
        rewardTitle: "Sen är du klar",
        rewardBodyWithAnswer: "Du sa: {answer}. Oavsett vad som händer imorgon: du har gjort din del ikväll. Det räcker.",
        rewardBodyEmpty: "Oavsett vad som händer imorgon: du har gjort din del ikväll. Det räcker.",
        floor: "Känns nerverna större än så här — prata med din tränare eller en vuxen du litar på. Den här rutinen är till för matchnerver, inte för allt.",
        back: "Tillbaka",
        next: "Nästa",
        done: "Klar",
        streakOne: "1 match förberedd",
        streakMany: "{count} matcher i rad förberedda"
      }
    },

    // Spelarlänk — en egen, inloggningsfri sida för spelaren själv
    playerLink: {
      generateButton: "Generera länk",
      generateHint: "En sida {name} kan öppna på sin egen mobil — andningsövning, utveckling och dina anteckningar. Ingen inloggning behövs.",
      generating: "Genererar…",
      mintError: "Kunde inte generera länken just nu",
      modalTitle: "Länk till {name}",
      modalDesc: "En egen sida {name} kan öppna på sin egen enhet — ingen inloggning behövs. Samma länk fungerar varje gång.",
      copy: "Kopiera länk",
      copied: "Länk kopierad",
      share: "Dela",
      pageGreeting: "Hej {name}!",
      breathingSectionTitle: "Andningsövning",
      coachNoteTitle: "Vad din coach har sagt",
      noCoachNote: "Inget från coachen ännu — kolla in igen efter nästa match.",
      notFoundTitle: "Länken hittades inte",
      notFoundBody: "Den här länken verkar inte vara giltig. Be den som skickade den att skicka en ny.",
      revokedTitle: "Länken är inte längre aktiv",
      revokedBody: "Den här länken har stängts av. Be den som skickade den om en ny."
    },

    // Player & Match Logic
    playerName: "Spelarens Namn",
    playerEmail: "Spelarens e-post",
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
    freeTierLimitPlayer: "Gratisversionen: Max 3 spelare kan sparas.",
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
      bonusWeightingDesc: "Multiplikator för bonusaktioner",
      draftRestored: "Din pågående match återställdes.",
      saveShort: "Spara match"
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
    freeFeature2Player: "Spara upp till 3 spelare",
    freeFeature3: "Enkel matchhistorik",
    premiumFeature1: "Molnsynkronisering",
    premiumFeature2: "Avancerad statistik",
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
    success: {
      title: "Betalningen gick igenom",
      subscriptionBody: "Din prenumeration är nu aktiv.",
      creditsBody: "Dina krediter är tillagda. De ligger kvar på kontot tills du använder dem.",
      emailNote: "Ett kvitto är på väg till din mejl.",
      backToApp: "Tillbaka till appen",
      toDashboard: "Till dashboarden",
      cancelledTitle: "Betalningen avbröts",
      cancelledBody: "Ingenting har debiterats.",
      cancelledNote: "Du kan prova igen när du vill.",
      tryAgain: "Prova igen",
      genericTitle: "Tack",
      genericBody: "Din betalning har gått igenom."
    },
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

    // Billing
    billing: {
      pastDueTitle: "Betalningen gick inte igenom",
      pastDueBody: "Vi kunde inte dra betalningen för din prenumeration — oftast ett kort som gått ut. Uppdatera uppgifterna så fortsätter allt som vanligt.",
      pastDueAction: "Uppdatera betalsätt",
      pastDueOpening: "Öppnar…"
    },

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
