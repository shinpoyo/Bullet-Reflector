import React, { useEffect } from 'react';
import { Player, SkillDefinition } from '../types/game';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface LevelUpModalProps {
  player: Player;
  choices: SkillDefinition[];
  onSelectSkill: (skill: SkillDefinition) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  player,
  choices,
  onSelectSkill,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) {
        onSelectSkill(choices[0]);
      } else if (e.key === '2' && choices[1]) {
        onSelectSkill(choices[1]);
      } else if (e.key === '3' && choices[2]) {
        onSelectSkill(choices[2]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, onSelectSkill]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl flex flex-col items-center text-center max-h-[96dvh]">
        {/* Level Up Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-[11px] sm:text-xs font-mono font-bold mb-2 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>LEVEL UP! · LV. {player.level}</span>
        </div>

        <h2 className="text-xl sm:text-3xl font-black font-mono tracking-wider text-slate-100 mb-1">
          SELECT UPGRADE
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-3 sm:mb-6">
          Choose a core system enhancement to empower your ricochet mechanics.
        </p>

        {/* 3 Skill Choice Cards (Horizontal compact list on mobile, 3-column cards on desktop) */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2.5 sm:gap-4 w-full">
          {choices.map((skill, index) => {
            const currentLevel = player.skills[skill.id] || 0;
            const isNew = currentLevel === 0;

            return (
              <button
                key={skill.id}
                onClick={() => onSelectSkill(skill)}
                className="group relative flex flex-row sm:flex-col items-center sm:items-start p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-750 hover:border-cyan-400/80 shadow-lg hover:shadow-[0_0_25px_rgba(56,189,248,0.3)] active:scale-[0.98] transition-all cursor-pointer text-left gap-3"
              >
                {/* Number Badge */}
                <div className="absolute top-2 right-2 text-[9px] sm:text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 border border-slate-800 rounded px-1.5 py-0.5">
                  [{index + 1}]
                </div>

                {/* Skill Icon */}
                <div className="text-2xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-110 transition-transform shrink-0">
                  {skill.icon}
                </div>

                <div className="flex flex-col flex-1 min-w-0 pr-6 sm:pr-0">
                  {/* Level status & Skill Title */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold">
                      {isNew ? (
                        <span className="text-amber-400">NEW!</span>
                      ) : (
                        <span className="text-cyan-400">
                          Lv.{currentLevel} <span className="text-slate-400">→</span> {currentLevel + 1}
                        </span>
                      )}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                      {skill.nameJa}
                    </h3>
                  </div>

                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 hidden sm:block mb-1">
                    {skill.name}
                  </span>

                  {/* Description */}
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                    {skill.description}
                  </p>
                </div>

                {/* CTA Hover hint on desktop */}
                <div className="hidden sm:flex mt-3 pt-2.5 border-t border-slate-800/80 w-full items-center justify-between text-[11px] font-mono text-slate-400 group-hover:text-cyan-400">
                  <span>INSTALL</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Keyboard shortcut hint */}
        <p className="mt-3 sm:mt-5 text-[10px] sm:text-xs font-mono text-slate-500">
          <span className="sm:hidden">タップしてアップグレードを適用</span>
          <span className="hidden sm:inline">Press <strong className="text-slate-300">[1]</strong>, <strong className="text-slate-300">[2]</strong>, or <strong className="text-slate-300">[3]</strong> to select</span>
        </p>
      </div>
    </div>
  );
};
