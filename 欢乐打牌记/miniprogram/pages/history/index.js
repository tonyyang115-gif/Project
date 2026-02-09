// pages/history/index.js
import { storage } from '../../utils/storage';
import { formatDateTime } from '../../utils/utils';

Page({
  data: {
    history: [],
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const history = storage.getHistory();
    this.setData({
      history,
    });
  },

  viewHistory(e) {
    const index = e.currentTarget.dataset.index;
    const room = this.data.history[index];
    wx.showModal({
      title: '历史详情',
      content: `房间ID: ${room.roomId}\n对局数: ${room.rounds.length}\n玩家数: ${room.players.length}`,
      showCancel: false,
    });
  },

  formatDateTime,
});









