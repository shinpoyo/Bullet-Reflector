import { Player, SkillDefinition, SkillId } from '../types/game';

export const SKILL_DEFINITIONS: Record<SkillId, SkillDefinition> = {
  MULTI_MIRROR: {
    id: 'MULTI_MIRROR',
    name: 'Multi-Mirror Laser',
    nameJa: 'マルチ・スプリット',
    description: 'PERFECTパリィ時、弾が3WAYレーザーに分裂し直近の敵群へ一斉ホーミング！',
    icon: '✨',
    maxLevel: 3,
  },
  PARRY_WINDOW: {
    id: 'PARRY_WINDOW',
    name: 'Just Focus Window',
    nameJa: 'ジャストフレーム拡張',
    description: 'PERFECT/GREATの判定距離と猶予が+20%拡大。パリィが格段に成功しやすくなる。',
    icon: '🛡️',
    maxLevel: 4,
  },
  EXPLOSIVE_RICOCHET: {
    id: 'EXPLOSIVE_RICOCHET',
    name: 'Cluster Blast',
    nameJa: '跳弾エクスプロージョン',
    description: '反射弾着弾時に高威力の爆発ショックウェーブが発生し、周囲の敵を巻き込む。',
    icon: '💥',
    maxLevel: 3,
  },
  MAGNET_CORE: {
    id: 'MAGNET_CORE',
    name: 'Magnetic Core',
    nameJa: 'マグネットコア',
    description: '経験値クリスタルの自動吸引範囲が+60%拡大。安全な位置からEXPを高速回収。',
    icon: '🧲',
    maxLevel: 4,
  },
  TESLA_DISCHARGE: {
    id: 'TESLA_DISCHARGE',
    name: 'Tesla Discharge',
    nameJa: 'テスラ放電オーラ',
    description: '一定周期で自機から誘導電撃ボルトを放ち、周囲の敵を自動迎撃する。',
    icon: '⚡',
    maxLevel: 3,
  },
  CORE_REINFORCE: {
    id: 'CORE_REINFORCE',
    name: 'Core Repair & Expand',
    nameJa: 'コア増強＆リペア',
    description: '最大HPが+30拡張され、現在のHPが全回復する。',
    icon: '❤️',
    maxLevel: 3,
  },
  TACKLE_BOOST: {
    id: 'TACKLE_BOOST',
    name: 'Kinetic Ram',
    nameJa: '突進インパクト',
    description: 'スリングショット発射速度+25%、敵へのビリヤード体当たりダメージ+50%。',
    icon: '💨',
    maxLevel: 3,
  },
  TRICKSHOT_MASTER: {
    id: 'TRICKSHOT_MASTER',
    name: 'Bank Shot Master',
    nameJa: 'トリックマスター',
    description: '壁バウンド（バンクショット）のダメージ倍率が x2.0 から x3.2 へ大幅強化。',
    icon: '🎱',
    maxLevel: 3,
  },
};

export function getRandomSkillChoices(player: Player, count = 3): SkillDefinition[] {
  const available = Object.values(SKILL_DEFINITIONS).filter((skill) => {
    const currentLvl = player.skills[skill.id] || 0;
    return currentLvl < skill.maxLevel;
  });

  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function applySkillToPlayer(player: Player, skillId: SkillId) {
  const currentLevel = (player.skills[skillId] || 0) + 1;
  player.skills[skillId] = currentLevel;

  switch (skillId) {
    case 'MULTI_MIRROR':
      player.multiMirrorLevel = currentLevel;
      break;
    case 'PARRY_WINDOW':
      player.parryWindowMultiplier = 1 + currentLevel * 0.2;
      break;
    case 'EXPLOSIVE_RICOCHET':
      player.explosiveLevel = currentLevel;
      break;
    case 'MAGNET_CORE':
      player.magnetRadius = 110 + currentLevel * 75;
      break;
    case 'TESLA_DISCHARGE':
      player.teslaLevel = currentLevel;
      break;
    case 'CORE_REINFORCE':
      player.maxHp += 30;
      player.hp = player.maxHp; // Full heal!
      break;
    case 'TACKLE_BOOST':
      player.tackleMultiplier = 1 + currentLevel * 0.5;
      break;
    case 'TRICKSHOT_MASTER':
      player.bankMultiplier = 2.0 + currentLevel * 1.2; // x3.2, x4.4...
      break;
  }
}
