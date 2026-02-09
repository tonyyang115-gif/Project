// pages/home/index.js
import { storage } from '../../utils/storage';
import { generateUser, PRESET_AVATARS } from '../../utils/constants';

Page({
  data: {
    currentUser: null,
    showProfileModal: false,
    editName: '',
    editAvatar: '',
    activeEditField: null,
    presetAvatars: PRESET_AVATARS.slice(0, 5),
    totalRounds: 0,
    historyCount: 0,
    sharedRoomId: null,
    showJoinRoomModal: false,
    inputRoomId: '',
  },

  onLoad(options) {
    this.loadUserProfile();
    this.loadHistoryStats();
    
    // 检查是否从分享链接打开
    if (options.roomId) {
      this.setData({
        sharedRoomId: options.roomId,
      });
      // 自动显示加入房间提示
      setTimeout(() => {
        wx.showModal({
          title: '加入房间',
          content: `收到房间邀请，房间ID：${options.roomId}，是否加入？`,
          confirmText: '加入',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.joinRoomById(options.roomId);
            }
          },
        });
      }, 500);
    }
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

  openProfileModal() {
    this.setData({
      showProfileModal: true,
      activeEditField: null,
    });
  },

  closeProfileModal() {
    this.setData({
      showProfileModal: false,
      activeEditField: null,
    });
  },

  createRoom() {
    const user = this.data.currentUser;
    if (!user) return;

    const newRoom = {
      roomId: Math.floor(100000 + Math.random() * 900000).toString(),
      players: [user],
      rounds: [],
      createdAt: Date.now(),
    };

    storage.setCurrentRoom(newRoom);
    wx.navigateTo({
      url: '/pages/room/index',
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

  joinRoom() {
    // 如果有分享的房间ID，直接使用
    if (this.data.sharedRoomId) {
      this.joinRoomById(this.data.sharedRoomId);
    } else {
      // 否则显示输入房间ID的模态框
      this.setData({
        showJoinRoomModal: true,
        inputRoomId: '',
      });
    }
  },

  onRoomIdInput(e) {
    this.setData({
      inputRoomId: e.detail.value,
    });
  },

  confirmJoinRoom() {
    const roomId = this.data.inputRoomId.trim();
    if (!roomId) {
      wx.showToast({
        title: '请输入房间ID',
        icon: 'none',
      });
      return;
    }

    if (!/^\d{6}$/.test(roomId)) {
      wx.showToast({
        title: '房间ID为6位数字',
        icon: 'none',
      });
      return;
    }

    this.joinRoomById(roomId);
  },

  cancelJoinRoom() {
    this.setData({
      showJoinRoomModal: false,
      inputRoomId: '',
    });
  },

  joinRoomById(roomId) {
    const user = this.data.currentUser;
    if (!user) {
      wx.showToast({
        title: '请先设置用户信息',
        icon: 'none',
      });
      return;
    }

    // 检查是否已有房间
    const currentRoom = storage.getCurrentRoom();
    if (currentRoom) {
      wx.showModal({
        title: '提示',
        content: '您当前已在房间中，是否离开当前房间并加入新房间？',
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.doJoinRoom(roomId, user);
          }
        },
      });
      return;
    }

    this.doJoinRoom(roomId, user);
  },

  doJoinRoom(roomId, user) {
    // 由于房间数据是本地存储，无法真正获取其他用户的房间数据
    // 这里创建一个新房间，但使用分享的房间ID
    // 实际使用中，房间数据应该存储在服务器上
    const newRoom = {
      roomId: roomId,
      players: [user],
      rounds: [],
      createdAt: Date.now(),
    };

    storage.setCurrentRoom(newRoom);
    
    this.setData({
      showJoinRoomModal: false,
      inputRoomId: '',
      sharedRoomId: null,
    });

    wx.navigateTo({
      url: '/pages/room/index',
    });

    wx.showToast({
      title: '已加入房间',
      icon: 'success',
    });
  },
});
