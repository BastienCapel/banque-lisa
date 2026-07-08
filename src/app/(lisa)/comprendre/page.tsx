'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, TrendingUp, HelpCircle, GraduationCap, DollarSign, ArrowRight } from 'lucide-react';
import { FinancialParams } from '@/types';
import { fetchJson, isAuthRequiredError } from '@/lib/api-client';

export default function ComprendrePage() {
  const [params, setParams] = useState<FinancialParams | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const data = await fetchJson<FinancialParams>('/api/settings');
        setParams(data);
      } catch (err) {
        if (!isAuthRequiredError(err)) {
          console.error(err);
        }
      }
    };
    fetchParams();
  }, []);

  const dailyAllowance = params?.dailyAllowance ?? 2.10;
  const interestRatePct = ((params?.dailyInterestRate ?? 0.05) * 100).toFixed(0);
  const bonusRatePct = ((params?.finalBonusRate ?? 0.10) * 100).toFixed(0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center py-4">
        <div className="inline-flex rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white mb-3 shadow-md shadow-indigo-500/20">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Comprendre ma Banque d'été
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xl mx-auto">
          Découvre la magie des intérêts composés et comment cet outil t'aide à prendre de super décisions financières.
        </p>
      </div>

      {/* Grid: 3 Main Themes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Fonctionnement */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
            1. Le fonctionnement
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
            Chaque matin, tu reçois ton versement de <strong className="text-zinc-800 dark:text-zinc-200">{dailyAllowance.toFixed(2)} €</strong>. Tes retraits sont déduits du solde, et chaque soir, un intérêt de <strong>{interestRatePct}%</strong> s'applique sur ce qu'il te reste.
          </p>
        </div>

        {/* Card 2: Intérêts composés */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
            2. Les intérêts composés
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
            C'est l'effet "boule de neige". Les intérêts que tu gagnes aujourd'hui s'ajoutent à ton solde et génèrent à leur tour de nouveaux intérêts demain. Ton argent travaille tout seul, de plus en plus vite.
          </p>
        </div>

        {/* Card 3: Éducation financière */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
            3. Éducation financière
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
            Apprendre à arbitrer entre un achat plaisir immédiat et des gains futurs. C'est la clé pour budgétiser, comprendre la valeur du temps et de l'épargne pour réaliser tes grands projets.
          </p>
        </div>
      </div>

      {/* Detail Section 1: Fonctionnement */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="text-blue-500 text-lg">💡</span>
          Comment fonctionne ta cagnotte au quotidien ?
        </h3>
        
        <div className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed space-y-4">
          <p>
            L'application simule un compte épargne ultra performant avec un cycle quotidien :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <span className="text-lg block mb-1">🌅 Matin</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Versement de +{dailyAllowance.toFixed(2)} €</span>
              <p className="text-[10px] text-zinc-400 mt-1">Ton capital grandit régulièrement chaque jour de l'été.</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <span className="text-lg block mb-1">🛍️ Journée</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Retraits & dépenses</span>
              <p className="text-[10px] text-zinc-400 mt-1">Si tu as besoin de sous, tu formules une demande. Une fois validée par ton parent, le montant est retiré.</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <span className="text-lg block mb-1">🌌 Soir</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Intérêts de +{interestRatePct}%</span>
              <p className="text-[10px] text-zinc-400 mt-1">Calculés uniquement sur le solde restant. C'est le moment crucial !</p>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/20 p-4 rounded-2xl space-y-2 mt-4">
            <span className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1">
              ⚠️ Exemple concret : Le coût caché d'une glace à 5 €
            </span>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Imaginons que tu commences la journée avec 10 €. Le matin, tu as 12,10 €.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] pt-1">
              <div className="bg-white/80 dark:bg-zinc-900 p-3 rounded-xl border border-amber-100/50">
                <span className="font-bold text-emerald-600 block">Scénario A : Tu n'achètes rien</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Solde le soir : 12,10 €</li>
                  <li>Intérêt du soir (5%) : <strong className="text-zinc-800 dark:text-zinc-200">+0,61 €</strong></li>
                  <li>Solde final du jour : <strong>12,71 €</strong></li>
                </ul>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900 p-3 rounded-xl border border-amber-100/50">
                <span className="font-bold text-rose-600 block">Scénario B : Tu t'offres une glace à 5 €</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Solde après retrait : 7,10 €</li>
                  <li>Intérêt du soir (5%) : <strong className="text-zinc-800 dark:text-zinc-200">+0,36 €</strong> (tu perds 0,25 €)</li>
                  <li>Solde final du jour : <strong>7,46 €</strong></li>
                </ul>
              </div>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 pt-1 leading-normal">
              La glace à 5 € ne t'a pas coûté 5 € ; elle t'a coûté <strong>5,25 € dès le premier jour</strong>. Et comme ces 0,25 € d'intérêt manquants ne pourront pas générer d'intérêts le lendemain, l'écart va grandir de jour en jour. C'est le coût d'opportunité !
            </p>
          </div>
        </div>
      </section>

      {/* Detail Section 2: Intérêts Composés */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="text-violet-500 text-lg">❄️</span>
          La magie des Intérêts Composés : L'effet boule de neige
        </h3>
        
        <div className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed space-y-4">
          <p>
            Albert Einstein aurait dit : <em>"Les intérêts composés sont la huitième merveille du monde. Celui qui le comprend l'encaisse... celui qui ne le comprend pas le paie."</em>
          </p>
          <p>
            Pourquoi cette formule est-elle magique ? Contrairement aux intérêts simples (où l'on gagne toujours la même somme sur le capital de départ), les intérêts composés s'appliquent sur un total qui **grandit à chaque période**.
          </p>
          
          <div className="bg-indigo-50/50 border border-indigo-100 dark:bg-zinc-950/10 dark:border-indigo-900/10 p-5 rounded-2xl">
            <span className="font-bold text-indigo-950 dark:text-indigo-400 block mb-2">Visualiser la croissance :</span>
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left justify-around text-zinc-700 dark:text-zinc-300">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-400">Départ</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-white">10,00 €</span>
              </div>
              <ArrowRight className="hidden md:block h-4 w-4 text-indigo-400" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-400">Après 10 jours</span>
                <span className="text-base font-extrabold text-indigo-600">55,27 €</span>
                <span className="text-[9px] text-emerald-600 font-bold">Dont 24,27 € d'intérêts !</span>
              </div>
              <ArrowRight className="hidden md:block h-4 w-4 text-indigo-400" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-400">Après 20 jours</span>
                <span className="text-base font-extrabold text-indigo-700">129,56 €</span>
                <span className="text-[9px] text-emerald-600 font-bold">Dont 77,56 € d'intérêts !</span>
              </div>
              <ArrowRight className="hidden md:block h-4 w-4 text-indigo-400" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-400">Au 29ème jour (Bonus de {bonusRatePct}% inclus)</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">196,44 €</span>
                <span className="text-[9px] text-emerald-600 font-bold">Dont 128,44 € d'intérêts et bonus !</span>
              </div>
            </div>
          </div>
          
          <p>
            Au début, la croissance semble lente. Mais plus le temps passe, plus la pente de ta courbe s'accélère. C'est l'effet exponentiel. C'est pourquoi en épargnant tôt et régulièrement, de petites sommes finissent par devenir des trésors.
          </p>
        </div>
      </section>

      {/* Detail Section 3: Éducation financière */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="text-emerald-500 text-lg">🎓</span>
          Pourquoi cet outil est-il une superbe école de la finance ?
        </h3>
        
        <div className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed space-y-4">
          <p>
            Cette application n'est pas un simple carnet de comptes. Elle a été pensée comme un laboratoire d'expérimentation financière pour t'aider à développer trois supers réflexes pour ton avenir :
          </p>
          <ul className="space-y-3 list-none">
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✔️</span>
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">1. Pratiquer la "Gratification Différée" (Delayed Gratification)</strong>
                <p className="text-[11px] text-zinc-500 mt-0.5">Savoir résister à l'envie d'acheter immédiatement un petit objet ou une friandise pour conserver son capital et s'offrir quelque chose de beaucoup plus grand et satisfaisant à la fin.</p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✔️</span>
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">2. Budgétiser et planifier à l'aide de simulations</strong>
                <p className="text-[11px] text-zinc-500 mt-0.5">Grâce à l'onglet "Simulations", tu peux tester l'impact réel de tes envies de dépenses à l'avance. Cela t'évite de regretter un achat compulsif en voyant précisément combien d'argent en moins tu auras à la fin de l'été.</p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✔️</span>
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">3. Comprendre le "coût d'opportunité"</strong>
                <p className="text-[11px] text-zinc-500 mt-0.5">En économie, chaque choix implique un renoncement. Acheter un jeu aujourd'hui, c'est renoncer aux intérêts que cet argent aurait rapportés. Visualiser cet écart sur tes courbes réelles te donne les clés pour arbitrer intelligemment.</p>
              </div>
            </li>
          </ul>
          
          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-2xl text-[11px] text-purple-900 dark:text-purple-300 font-medium">
            💡 <strong>Le conseil du banquier :</strong> Avant chaque achat, pose-toi la question : <em>« Est-ce que cette dépense vaut plus pour moi aujourd'hui que tout l'argent (prix d'achat + intérêts perdus) que je n'aurai pas le 10 août ? »</em> Si la réponse est oui, fais-toi plaisir sans regret ! Si la réponse est non, garde ton argent placé et félicite-toi de faire grandir ta cagnotte !
          </div>
        </div>
      </section>
    </div>
  );
}
