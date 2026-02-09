// utils/constants.ts

export const MOCK_NAMES = ["快乐小狗", "熬夜冠军", "打牌高手", "雀神", "养生达人", "暴富", "锦鲤", "风清扬", "扫地僧"];

export const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sunny&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Trouble",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=c0aede",
];

export const generateUser = (isHost: boolean = false, savedProfile?: { name: string; avatarUrl: string }): any => {
  if (isHost && savedProfile) {
    return {
      id: "host_user",
      name: savedProfile.name,
      avatarUrl: savedProfile.avatarUrl,
      isHost: true,
      totalScore: 0
    };
  }
  
  if (isHost) {
    return {
      id: "host_user",
      name: "Tony",
      avatarUrl: PRESET_AVATARS[0],
      isHost: true,
      totalScore: 0
    };
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
    avatarUrl: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
    isHost: false,
    totalScore: 0
  };
};









