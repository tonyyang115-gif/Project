// pages/history/index.ts
import { storage } from '../../utils/storage';
import { RoomState } from '../../types';
import { formatDateTime } from '../../utils/utils';

Page({
  data: {
    history: [] as RoomState[],
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

  viewHistory(e: any) {
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









