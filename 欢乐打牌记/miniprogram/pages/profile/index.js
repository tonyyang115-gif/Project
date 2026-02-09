// pages/profile/index.js
import { storage } from '../../utils/storage';
import { generateUser, PRESET_AVATARS } from '../../utils/constants';

Page({
  data: {
    currentUser: null,
    editName: '',
    editAvatar: '',
    activeEditField: null,
    presetAvatars: PRESET_AVATARS.slice(0, 5),
    totalRounds: 0,
    historyCount: 0,
  },

  onLoad() {
    this.loadUserProfile();
    this.loadHistoryStats();
  },

  onShow() {
    this.loadUserProfile();
    this.loadHistoryStats();
  },

  loadUserProfile() {
    const saved = storage.getUserProfile();
    const user = generateUser(true, saved || undefined);
    this.setData({
      currentUser: user,
      editName: user.name,
      editAvatar: user.avatarUrl,
    });
  },

  loadHistoryStats() {
    const history = storage.getHistory();
    const currentRoom = storage.getCurrentRoom();
    let totalRounds = 0;

    history.forEach((room) => {
      totalRounds += room.rounds.length;
    });

    if (currentRoom) {
      totalRounds += currentRoom.rounds.length;
    }

    this.setData({
      totalRounds,
      historyCount: history.length,
    });
  },

  editName() {
    this.setData({
      activeEditField: 'name',
    });
  },

  editAvatar() {
    this.setData({
      activeEditField: 'avatar',
    });
  },

  onNameInput(e) {
    this.setData({
      editName: e.detail.value,
    });
  },

  saveName() {
    const name = this.data.editName.trim();
    if (!name) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none',
      });
      return;
    }

    const user = { ...this.data.currentUser };
    user.name = name;

    storage.setUserProfile({
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    this.setData({
      currentUser: user,
      activeEditField: null,
    });

    wx.showToast({
      title: '保存成功',
      icon: 'success',
    });
  },

  selectPresetAvatar(e) {
    const url = e.currentTarget.dataset.url;
    this.setData({
      editAvatar: url,
    });
  },

  uploadAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          editAvatar: tempFilePath,
        });
      },
      fail: (err) => {
        console.error('选择图片失败', err);
      },
    });
  },

  saveAvatar() {
    const user = { ...this.data.currentUser };
    user.avatarUrl = this.data.editAvatar;

    storage.setUserProfile({
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    this.setData({
      currentUser: user,
      activeEditField: null,
    });

    wx.showToast({
      title: '保存成功',
      icon: 'success',
    });
  },

  cancelEdit() {
    this.setData({
      activeEditField: null,
      editName: this.data.currentUser ? this.data.currentUser.name : '',
      editAvatar: this.data.currentUser ? this.data.currentUser.avatarUrl : '',
    });
  },

  viewHistory() {
    wx.navigateTo({
      url: '/pages/history/index',
    });
  },
});
