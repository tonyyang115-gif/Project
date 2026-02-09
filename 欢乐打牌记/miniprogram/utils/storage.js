// utils/storage.js
const STORAGE_KEY_USER = 'hdpj_user_profile';
const STORAGE_KEY_HISTORY = 'hdpj_history';
const STORAGE_KEY_CURRENT_ROOM = 'hdpj_current_room';

export const storage = {
  // 用户信息
  getUserProfile() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('读取用户信息失败', e);
    }
    return null;
  },

  setUserProfile(profile) {
    try {
      wx.setStorageSync(STORAGE_KEY_USER, JSON.stringify(profile));
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
  },

  // 历史记录
  getHistory() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('读取历史记录失败', e);
    }
    return [];
  },

  setHistory(history) {
    try {
      wx.setStorageSync(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('保存历史记录失败', e);
    }
  },

  // 当前房间
  getCurrentRoom() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY_CURRENT_ROOM);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('读取当前房间失败', e);
    }
    return null;
  },

  setCurrentRoom(room) {
    try {
      wx.setStorageSync(STORAGE_KEY_CURRENT_ROOM, JSON.stringify(room));
    } catch (e) {
      console.error('保存当前房间失败', e);
    }
  },

  clearCurrentRoom() {
    try {
      wx.removeStorageSync(STORAGE_KEY_CURRENT_ROOM);
    } catch (e) {
      console.error('清除当前房间失败', e);
    }
  },
};









