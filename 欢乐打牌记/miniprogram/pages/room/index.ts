// pages/room/index.ts
import { storage } from '../../utils/storage';
import { generateUser, MOCK_NAMES } from '../../utils/constants';
import { Player, RoomState, Round, Transaction } from '../../types';
import { formatTimeWithSeconds } from '../../utils/utils';

Page({
  data: {
    room: null as RoomState | null,
    currentUser: null as Player | null,
    showAddScoreModal: false,
    showTransferModal: false,
    showScoreDetailModal: false,
    showSettlementModal: false,
    showLeaveConfirm: false,
    scoreMode: 'quick' as 'quick' | 'manual',
    selectedWinner: null as string | null,
    selectedLosers: [] as string[],
    quickScoreAmount: '',
    tempScores: {} as Record<string, string>,
    transferTarget: null as Player | null,
    transferAmount: '',
    myRank: 1,
    myScore: 0,
    sortedPlayers: [] as Player[],
    scoreEvents: [] as any[],
    transfers: [] as Transaction[],
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const saved = storage.getUserProfile();
    const user = generateUser(true, saved || undefined);
    let room = storage.getCurrentRoom();

    if (!room) {
      wx.redirectTo({
        url: '/pages/home/index',
      });
      return;
    }

    if (saved) {
      const playerIndex = room.players.findIndex((p: Player) => p.id === 'host_user');
      if (playerIndex !== -1) {
        room.players[playerIndex] = { ...room.players[playerIndex], ...user };
      }
    }

    const myPlayer = room.players.find((p: Player) => p.id === user.id);
    const sorted = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
    const rank = sorted.findIndex((p) => p.id === user.id) + 1;

    this.setData({
      room,
      currentUser: user,
      myScore: myPlayer?.totalScore || 0,
      myRank: rank,
      sortedPlayers: sorted,
      scoreEvents: this.getScoreEvents(room),
    });

    storage.setCurrentRoom(room);
  },

  inviteFriend() {
    const room = this.data.room;
    if (!room) return;
    if (room.players.length >= 8) {
      wx.showToast({ title: '房间已满', icon: 'none' });
      return;
    }

    let newFriend = generateUser(false);
    while (room.players.find((p: Player) => p.name === newFriend.name)) {
      newFriend.name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
    }

    room.players.push(newFriend);
    this.setData({
      room,
      sortedPlayers: [...room.players].sort((a, b) => b.totalScore - a.totalScore),
    });
    storage.setCurrentRoom(room);
  },

  selectWinner(e: any) {
    const playerId = e.currentTarget.dataset.id;
    const losers = this.data.selectedLosers.filter((id: string) => id !== playerId);
    this.setData({
      selectedWinner: playerId,
      selectedLosers: losers,
    });
  },

  toggleLoser(e: any) {
    const playerId = e.currentTarget.dataset.id;
    const losers = this.data.selectedLosers;
    if (losers.includes(playerId)) {
      this.setData({
        selectedLosers: losers.filter((id: string) => id !== playerId),
      });
    } else {
      this.setData({
        selectedLosers: [...losers, playerId],
      });
    }
  },

  onQuickScoreInput(e: any) {
    this.setData({
      quickScoreAmount: e.detail.value,
    });
  },

  onManualScoreInput(e: any) {
    const playerId = e.currentTarget.dataset.id;
    const value = e.detail.value;
    const scores = { ...this.data.tempScores };
    scores[playerId] = value;
    this.setData({
      tempScores: scores,
    });
  },

  submitRound() {
    const { room, scoreMode, selectedWinner, selectedLosers, quickScoreAmount, tempScores } = this.data;
    if (!room) return;

    let numericScores: Record<string, number> = {};

    if (scoreMode === 'quick') {
      if (!selectedWinner || selectedLosers.length === 0 || !quickScoreAmount) {
        wx.showToast({ title: '请选择赢家、输家并输入分数', icon: 'none' });
        return;
      }
      const scorePerPerson = parseInt(quickScoreAmount, 10);
      if (isNaN(scorePerPerson) || scorePerPerson <= 0) {
        wx.showToast({ title: '请输入有效的分数', icon: 'none' });
        return;
      }

      const totalWin = scorePerPerson * selectedLosers.length;
      room.players.forEach((p: Player) => (numericScores[p.id] = 0));
      numericScores[selectedWinner] = totalWin;
      selectedLosers.forEach((loserId: string) => {
        numericScores[loserId] = -scorePerPerson;
      });
    } else {
      let roundTotal = 0;
      for (const p of room.players) {
        const val = parseInt(tempScores[p.id] || '0', 10);
        if (isNaN(val)) {
          wx.showToast({ title: '请输入有效的数字', icon: 'none' });
          return;
        }
        numericScores[p.id] = val;
        roundTotal += val;
      }
      if (roundTotal !== 0) {
        wx.showModal({
          title: '提示',
          content: `本局总分为 ${roundTotal} (不为0)。确定要提交吗？`,
          success: (res) => {
            if (res.confirm) {
              this.doSubmitRound(room, numericScores);
            }
          },
        });
        return;
      }
    }

    this.doSubmitRound(room, numericScores);
  },

  doSubmitRound(room: RoomState, numericScores: Record<string, number>) {
    const newRound: Round = {
      id: room.rounds.length + 1,
      scores: numericScores,
      timestamp: Date.now(),
    };

    const updatedPlayers = room.players.map((p: Player) => ({
      ...p,
      totalScore: p.totalScore + (numericScores[p.id] || 0),
    }));

    room.rounds = [newRound, ...room.rounds];
    room.players = updatedPlayers;

    const sorted = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
    const myPlayer = room.players.find((p: Player) => p.id === this.data.currentUser?.id);
    const rank = sorted.findIndex((p) => p.id === this.data.currentUser?.id) + 1;

    this.setData({
      room,
      sortedPlayers: sorted,
      myScore: myPlayer?.totalScore || 0,
      myRank: rank,
      scoreEvents: this.getScoreEvents(room),
      showAddScoreModal: false,
      selectedWinner: null,
      selectedLosers: [],
      quickScoreAmount: '',
      tempScores: {},
    });

    storage.setCurrentRoom(room);
  },

  onPlayerClick(e: any) {
    const playerId = e.currentTarget.dataset.id;
    const player = this.data.room?.players.find((p: Player) => p.id === playerId);
    if (!player || player.id === this.data.currentUser?.id) return;

    this.setData({
      transferTarget: player,
      transferAmount: '',
      showTransferModal: true,
    });
  },

  onTransferAmountInput(e: any) {
    this.setData({
      transferAmount: e.detail.value,
    });
  },

  submitTransfer() {
    const { room, transferTarget, transferAmount, currentUser } = this.data;
    if (!room || !transferTarget || !transferAmount || !currentUser) return;

    const amount = parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({ title: '请输入有效的正数积分', icon: 'none' });
      return;
    }

    const numericScores: Record<string, number> = {};
    room.players.forEach((p: Player) => (numericScores[p.id] = 0));
    numericScores[currentUser.id] = -amount;
    numericScores[transferTarget.id] = amount;

    this.doSubmitRound(room, numericScores);
    this.setData({
      showTransferModal: false,
      transferTarget: null,
      transferAmount: '',
    });
  },

  handleLeaveClick() {
    this.setData({
      showLeaveConfirm: true,
    });
  },

  confirmLeave() {
    const room = this.data.room;
    if (room && room.rounds.length > 0) {
      const history = storage.getHistory();
      history.unshift(room);
      storage.setHistory(history);
    }

    storage.clearCurrentRoom();
    wx.redirectTo({
      url: '/pages/home/index',
    });
  },

  cancelLeave() {
    this.setData({
      showLeaveConfirm: false,
    });
  },

  settleGame() {
    const room = this.data.room;
    if (!room) return;
    if (room.rounds.length === 0) {
      wx.showToast({ title: '还没有进行任何对局，无法结算。', icon: 'none' });
      return;
    }

    const transfers = this.calculateTransfers(room);
    this.setData({
      showSettlementModal: true,
      transfers,
    });
  },

  calculateTransfers(room: RoomState): Transaction[] {
    let balances = room.players.map((p: Player) => ({
      id: p.id,
      name: p.name,
      balance: p.totalScore,
    }));

    const transactions: Transaction[] = [];
    let debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
    let creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      transactions.push({
        fromName: debtor.name,
        toName: creditor.name,
        amount: amount,
      });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }
    return transactions;
  },

  getScoreEvents(room: RoomState) {
    return room.rounds
      .flatMap((round: Round) =>
        Object.entries(round.scores)
          .filter(([, score]) => score !== 0)
          .map(([playerId, score]) => ({
            uniqueId: `${round.id}-${playerId}`,
            playerId,
            score,
            timestamp: round.timestamp,
          }))
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  switchScoreMode(e: any) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      scoreMode: mode,
      selectedWinner: null,
      selectedLosers: [],
      quickScoreAmount: '',
      tempScores: {},
    });
  },

  openAddScoreModal() {
    const room = this.data.room;
    if (!room || room.players.length < 2) {
      wx.showToast({ title: '至少需要2人才能记分', icon: 'none' });
      return;
    }
    this.setData({
      showAddScoreModal: true,
      scoreMode: 'quick',
      selectedWinner: null,
      selectedLosers: [],
      quickScoreAmount: '',
      tempScores: {},
    });
  },

  closeModal(e: any) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [type]: false,
    });
  },

  openScoreDetail() {
    const room = this.data.room;
    if (!room) return;
    this.setData({
      showScoreDetailModal: true,
      scoreEvents: this.getScoreEvents(room),
    });
  },

  openProfileModal() {
    wx.navigateTo({
      url: '/pages/profile/index',
    });
  },

  formatTime: formatTimeWithSeconds,
});









