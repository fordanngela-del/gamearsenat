import React, { useState } from 'react';
import { GameKey, GameRuleSection } from '../types/game';
import { BookOpen, Zap, Crown, Target, Lightbulb, CheckCircle2, ChevronRight, Swords } from 'lucide-react';
import { playSound } from '../utils/audio';

export const GAME_RULES: GameRuleSection[] = [
  {
    gameKey: 'echecs',
    title: 'Échecs Impériaux',
    subtitle: 'Le duel des rois et maîtres stratèges',
    objective:
      'Mettre le Roi adverse en position d\'échec et mat, c\'est-à-dire menacé de capture sans aucune case de fuite légale.',
    howToPlay: [
      'Les blancs jouent en premier, puis les joueurs alternent à chaque coup.',
      'Chaque pièce a son déplacement unique : les pions avancent tout droit et capturent en diagonale, les cavaliers sautent en L, les fous glissent en diagonale, les tours en ligne droite et la reine dans toutes les directions.',
      'Un pion atteignant la dernière rangée adverse est automatiquement promu en Reine impériale.',
      'Chaque joueur dispose d\'une pendule numérique de temps pour gérer sa réflexion.',
    ],
    specialRules: [
      'Échec au Roi : obligation absolue de parer la menace (déplacer le roi, intercaler une pièce ou capturer l\'attaquant).',
      'Pat : si le joueur dont c\'est le tour n\'est pas en échec mais n\'a aucun coup légal, la partie se termine par un match nul.',
    ],
    hackingPower:
      '⚡ Rembobinage Temporel : annule le dernier coup joué par l\'adversaire et te redonne l\'initiative.',
    empirePower:
      '👑 Chaque pièce capturée rapporte 1 couronne royale. L\'échec et mat final attribue 3 couronnes supplémentaires.',
    proTips: [
      'Contrôle immédiatement les 4 cases centrales (d4, e4, d5, e5) avec tes pions et cavaliers.',
      'Développe tes pièces mineures rapidement avant de lancer une attaque prématurée avec ta reine.',
    ],
  },
  {
    gameKey: 'dames',
    title: 'Dames Royales',
    subtitle: 'La stratégie pure du damier à prise obligatoire',
    objective:
      'Capturer ou bloquer l\'ensemble des pions adverses pour les empêcher de jouer tout coup légal.',
    howToPlay: [
      'Les pions se déplacent d\'une case en diagonale vers l\'avant sur les cases sombres du damier.',
      'Lorsqu\'un pion adverse se trouve sur une case diagonale adjacente et que la case située derrière est libre, le saut et la prise sont OBLIGATOIRES.',
      'Si après une prise un autre saut est immédiatement possible avec le même pion, le joueur doit enchaîner la prise (rafle multiple).',
      'Un pion atteignant la dernière rangée devient une Dame couronnée (♛), pouvant se déplacer vers l\'avant comme vers l\'arrière.',
    ],
    specialRules: [
      'Priorité absolue à la prise : si tu peux capturer, tu ne peux pas effectuer un déplacement simple.',
      'La Dame peut sauter vers l\'arrière pour capturer.',
    ],
    hackingPower:
      '⚡ Frappe Furtive : neutralise et retire instantanément un pion adverse du damier à ton tour.',
    empirePower:
      '👑 Chaque pion capturé ou Dame couronnée rapporte des couronnes impériales.',
    proTips: [
      'Garde tes pions de base sur la première rangée le plus longtemps possible pour empêcher l\'ennemi de faire une Dame.',
      'Prépare des pièges de sacrifice pour forcer l\'adversaire à prendre et t\'offrir une rafle de plusieurs pions.',
    ],
  },
  {
    gameKey: 'ludo',
    title: 'Ludo Arena',
    subtitle: 'La grande course des 4 clans vers le sanctuaire',
    objective:
      'Être le premier joueur à faire parcourir le circuit complet à ses 4 pions et les rentrer sains et saufs à la maison centrale.',
    howToPlay: [
      'Lance le dé à ton tour. Obtenir un 6 est indispensable pour sortir un pion de ton camp de départ vers la case d\'envol.',
      'Tout 6 obtenu t\'accorde immédiatement un lancer de dé supplémentaire.',
      'Les pions avancent dans le sens des aiguilles d\'une montre sur la piste commune de 52 cases.',
      'Une fois la boucle terminée, le pion remonte sa colonne de couleur protégée jusqu\'à l\'arrivée (case 56).',
    ],
    specialRules: [
      'Capture ennemie : atterrir exactement sur une case occupée par un pion adverse le renvoie directement dans son camp de départ !',
      'Cases Étoiles (★) : ces cases de sanctuaire protègent tes pions contre toute capture ennemie.',
    ],
    hackingPower:
      '⚡ Dé Truqué : force un 6 absolu à ton prochain lancer pour sortir un pion ou rejouer.',
    empirePower:
      '👑 Chaque capture d\'un pion adverse octroie une couronne. La victoire totale décerne 3 couronnes royales.',
    proTips: [
      'Réfugie-toi dès que possible sur les cases étoiles pour attendre le passage des rivaux sans danger.',
      'Répartis tes pions sur la piste pour maximiser tes chances de capturer les retardataires.',
    ],
  },
  {
    gameKey: 'monopoly',
    title: 'Empire Monopoly Tycoon',
    subtitle: 'L\'empire financier, l\'immobilier de luxe et la faillite rivale',
    objective:
      'Bâtir le plus grand empire immobilier, faire fructifier sa trésorerie et acculer ses rivaux à la faillite.',
    howToPlay: [
      'Lance les deux dés et progresse sur les 40 cases du plateau prestigieux.',
      'Achète les avenues disponibles pour percevoir des loyers dès qu\'un concurrent y séjourne.',
      'Constitue un monopole complet (toutes les propriétés d\'une même couleur) pour doubler le loyer de base et débloquer les constructions.',
      'Bâtis des villas (🏠) puis érige des Grands Hôtels (🏨) pour multiplier tes loyers jusqu\'à x100 !',
    ],
    specialRules: [
      'Passage par Départ : chaque tour complet autour du plateau rapporte +200 💰.',
      'Cartes Chance & Caisse : tire des cartes dorées apportant primes de bourse ou taxes d\'aménagement.',
      'Prison : purge ton tour ou utilise une carte de sortie pour retrouver ta liberté d\'investisseur.',
    ],
    hackingPower:
      '⚡ Siphon Bancaire : pirate les comptes suisses d\'un rival et transfère 150 💰 directement dans ta trésorerie.',
    empirePower:
      '👑 Chaque acquisition immobilière et monopole constitué te confère des couronnes impériales.',
    proTips: [
      'Les groupes Orange et Rouge sont les plus rentables du jeu car ils se situent juste après la sortie de prison.',
      'Investis en priorité dans 3 maisons par terrain : c\'est le seuil où le ratio loyer/coût explose.',
    ],
  },
  {
    gameKey: 'fruitslasher',
    title: 'Fruit Arena (Ninja Slasher)',
    subtitle: 'L\'arène des guerriers et des lames tranchantes',
    objective:
      'Trancher un maximum de fruits propulsés à haute vitesse par les 4 canons d\'angle pour battre le score record avant la fin du chrono.',
    howToPlay: [
      'Glisse ta souris, ton doigt sur écran tactile ou clique rapidement sur les fruits en plein vol pour déclencher un coup de sabre.',
      'Les 4 canons tirent en continu des pastèques 🍉, ananas 🍍, pommes 🍎, oranges 🍊, bananes 🍌 et fraises 🍓.',
      'Enchaîne les tranches rapides sans rater de cible pour faire monter la jauge de COMBO (x2, x3, x5 !).',
      'Le ninja ou bot ayant accumulé le plus de points à la fin du compte à rebours de 45 secondes remporte l\'arène.',
    ],
    specialRules: [
      'Bombes piégées (💣) : trancher une bombe déclenche une explosion qui te déduit 50 points et t\'étourdit momentanément !',
      'Ananas d\'or impérial (🍍) : fruit très rare rapportant 50 points et une chance de couronne immédiate.',
    ],
    hackingPower:
      '⚡ Chrono-Freeze : fige l\'ensemble des fruits en apesanteur pendant 3 secondes pour te permettre un massacre chirurgical.',
    empirePower:
      '👑 Réaliser des combos x3 ou trancher l\'Ananas d\'Or confère des couronnes de maîtrise.',
    proTips: [
      'Attends que plusieurs fruits se croisent au centre de l\'arène pour exécuter une seule tranche multi-cibles dévastatrice.',
      'Garde toujours un œil sur les canons pour anticiper la trajectoire des bombes.',
    ],
  },
];

export const RulesView: React.FC = () => {
  const [selectedGameKey, setSelectedGameKey] = useState<GameKey>('echecs');

  const currentRule = GAME_RULES.find((r) => r.gameKey === selectedGameKey) || GAME_RULES[0];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-['Barlow_Condensed']">
          Guide & <span className="text-[#00f59b]">Règles officielles</span>
        </h1>
        <p className="text-base sm:text-lg text-[#8da0b5] font-medium mt-1">
          Découvre les règles, les pouvoirs de piratage ⚡, le mode Empire Roi 👑 et les tactiques
          pro de chaque arène de GameArena.
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {GAME_RULES.map((rule) => {
          const isSelected = selectedGameKey === rule.gameKey;
          return (
            <button
              key={rule.gameKey}
              onClick={() => {
                playSound('click');
                setSelectedGameKey(rule.gameKey);
              }}
              className={`px-4 sm:px-6 py-3 rounded-xl font-extrabold text-base sm:text-lg tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#00f59b] text-[#032014] shadow-[0_0_18px_rgba(0,245,155,0.35)]'
                  : 'bg-[#0e1722] text-[#8da0b5] border border-[#1c2b3b] hover:text-white hover:border-[#00f59b]/40'
              }`}
            >
              <span>{rule.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Rules Card Container */}
      <div className="rounded-2xl border-2 border-[#1c2b3b] bg-[#0e1722] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Title Banner */}
        <div className="border-b border-[#1c2b3b] pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase text-white font-['Barlow_Condensed'] flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#00f59b]" />
              <span>{currentRule.title}</span>
            </h2>
            <p className="text-sm sm:text-base text-[#8da0b5] font-medium mt-0.5">
              {currentRule.subtitle}
            </p>
          </div>
        </div>

        {/* 1. Objective */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#00f59b]/40 bg-[#073a2b]/30">
          <h3 className="text-lg font-black uppercase text-[#00f59b] flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span>Objectif de la partie</span>
          </h3>
          <p className="text-base sm:text-lg text-[#eaf2ff] font-semibold leading-relaxed">
            {currentRule.objective}
          </p>
        </div>

        {/* 2. Step-by-Step Rules */}
        <div>
          <h3 className="text-xl font-black uppercase text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00f59b]" />
            <span>Déroulement du jeu</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRule.howToPlay.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#1c2b3b] bg-[#070d14] flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-[#00f59b]/20 border border-[#00f59b] text-[#00f59b] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm sm:text-base text-[#eaf2ff] font-medium leading-snug">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Special Powers: Hacking & Empire Roi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Hacking Mode Box */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#ffd84d]/40 bg-[#1c1808]/60 space-y-2">
            <h4 className="text-base sm:text-lg font-black uppercase text-[#ffd84d] flex items-center gap-2 font-['Barlow_Condensed']">
              <Zap className="w-5 h-5 fill-current" />
              <span>Pouvoir Mode Hacking ⚡</span>
            </h4>
            <p className="text-sm sm:text-base text-[#eaf2ff] font-medium leading-relaxed">
              {currentRule.hackingPower}
            </p>
          </div>

          {/* Empire Roi Mode Box */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#ff3d71]/40 bg-[#2b0c16]/60 space-y-2">
            <h4 className="text-base sm:text-lg font-black uppercase text-[#ff3d71] flex items-center gap-2 font-['Barlow_Condensed']">
              <Crown className="w-5 h-5 fill-current" />
              <span>Règle Mode Empire Roi 👑</span>
            </h4>
            <p className="text-sm sm:text-base text-[#eaf2ff] font-medium leading-relaxed">
              {currentRule.empirePower}
            </p>
          </div>
        </div>

        {/* 4. Pro Tips */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#1c2b3b] bg-[#0a121b]">
          <h3 className="text-lg font-black uppercase text-[#ffd84d] flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5" />
            <span>Conseils & Astuces de Maître</span>
          </h3>
          <ul className="space-y-2">
            {currentRule.proTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-[#8da0b5]">
                <ChevronRight className="w-4 h-4 text-[#00f59b] shrink-0 mt-1" />
                <span className="text-[#eaf2ff]">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
