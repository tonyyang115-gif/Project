// utils/api.js - 房间API服务
const DB_COLLECTION_ROOMS = 'rooms';

// 初始化云开发
let db = null;
let _ = null;

function initCloud() {
  if (!db) {
    // 检查 wx.cloud 是否可用
    if (!wx.cloud) {
      console.warn('wx.cloud 不可用');
      return false;
    }

    try {
      // 尝试初始化数据库
      db = wx.cloud.database();
      _ = db.command;
      
      // 如果成功，尝试触发应用层的云开发初始化（如果还未初始化）
      try {
        const app = getApp();
        if (app && typeof app.initCloud === 'function' && !app.globalData.cloudInitialized) {
          app.initCloud();
        }
      } catch (appError) {
        // 忽略获取app实例失败的情况
      }
      
      return true;
    } catch (e) {
      // 如果初始化失败，可能是因为 access_token 缺失（多账号调试模式）
      // 尝试延迟初始化
      if (e.errMsg && (e.errMsg.includes('access_token') || e.errMsg.includes('missing'))) {
        console.warn('云开发初始化需要登录，将在使用前重试:', e.errMsg);
        // 尝试通过应用层重新初始化
        try {
          const app = getApp();
          if (app && typeof app.initCloud === 'function') {
            app.initCloud();
          }
        } catch (appError) {
          console.warn('无法通过应用层重新初始化云开发', appError);
        }
      } else {
        console.error('云开发初始化失败，请确保已开通云开发服务', e);
      }
      return false;
    }
  }
  return db !== null;
}

// 带重试机制的数据库操作包装函数
async function dbOperationWithRetry(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 确保云开发已初始化
      if (!initCloud()) {
        // 如果是第一次尝试，尝试重新初始化
        if (attempt === 0) {
          try {
            const app = getApp();
            if (app && typeof app.initCloud === 'function') {
              app.initCloud();
              // 等待一小段时间让初始化完成
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (appError) {
            console.warn('无法通过应用层重新初始化云开发', appError);
          }
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('云开发未初始化');
      }

      // 执行数据库操作
      return await operation(db, _);
    } catch (error) {
      const errorMsg = error.errMsg || error.message || '';
      
      // 检查是否是 access_token 相关错误
      const isAccessTokenError = errorMsg.includes('access_token') || 
                                 errorMsg.includes('missing') ||
                                 errorMsg.includes('41001');
      
      if (isAccessTokenError && attempt < maxRetries - 1) {
        console.warn(`数据库操作失败 (尝试 ${attempt + 1}/${maxRetries}): access_token 缺失，等待后重试...`);
        
        // 尝试通过应用层重新初始化
        try {
          const app = getApp();
          if (app && typeof app.initCloud === 'function') {
            app.initCloud();
          }
        } catch (appError) {
          console.warn('无法通过应用层重新初始化云开发', appError);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        continue;
      }
      
      // 如果不是 access_token 错误，或者是最后一次尝试，抛出错误
      throw error;
    }
  }
  
  throw new Error('数据库操作失败：已达到最大重试次数');
}

// 房间API
export const roomApi = {
  // 创建房间
  async createRoom(roomData) {
    try {
      const result = await dbOperationWithRetry(async (db) => {
        return await db.collection(DB_COLLECTION_ROOMS).add({
          data: {
            ...roomData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      });

      return {
        success: true,
        message: '创建成功',
        data: {
          ...roomData,
          _id: result._id,
          createdAt: roomData.createdAt,
        },
      };
    } catch (error) {
      console.error('创建房间失败', error);
      const errorMsg = error.errMsg || error.message || '';
      let errorMessage = '创建房间失败';
      
      if (errorMsg.includes('access_token') || errorMsg.includes('missing') || errorMsg.includes('41001')) {
        errorMessage = '账号登录未完成，请稍等片刻后重试';
      } else {
        errorMessage = errorMsg || '创建房间失败';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null,
      };
    }
  },

  // 获取房间信息
  async getRoom(roomId) {
    // 确保 roomId 是字符串类型
    const roomIdStr = String(roomId).trim();
    if (!roomIdStr) {
      return {
        success: false,
        message: '房间ID不能为空',
        data: null,
      };
    }

    try {
      const result = await dbOperationWithRetry(async (db) => {
        return await db.collection(DB_COLLECTION_ROOMS)
          .where({
            roomId: roomIdStr,
          })
          .get();
      });

      if (result.data && result.data.length > 0) {
        const roomData = result.data[0];
        // 确保返回的数据结构完整
        return {
          success: true,
          message: '获取成功',
          data: {
            ...roomData,
            players: roomData.players || [],
            rounds: roomData.rounds || [],
            roomId: roomData.roomId || roomIdStr,
          },
        };
      } else {
        return {
          success: false,
          message: '房间不存在，请检查房间ID是否正确',
          data: null,
        };
      }
    } catch (error) {
      console.error('获取房间失败', error);
      // 提供更详细的错误信息
      let errorMessage = '获取房间失败';
      const errorMsg = error.errMsg || error.message || '';
      
      if (errorMsg.includes('access_token') || errorMsg.includes('missing') || errorMsg.includes('41001')) {
        errorMessage = '账号登录未完成，请稍等片刻后重试';
      } else if (errorMsg.includes('permission')) {
        errorMessage = '数据库权限不足，请检查云开发数据库权限设置';
      } else if (errorMsg.includes('network')) {
        errorMessage = '网络错误，请检查网络连接';
      } else if (errorMsg.includes('未初始化')) {
        errorMessage = '云开发未初始化，请检查配置';
      } else {
        errorMessage = errorMsg || '获取房间失败';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null,
        error: error,
      };
    }
  },

  // 加入房间（添加玩家）
  async joinRoom(roomId, player) {
    try {
      // 先获取房间信息（已经包含重试机制）
      const roomResult = await this.getRoom(roomId);
      if (!roomResult.success || !roomResult.data) {
        return roomResult;
      }

      const room = roomResult.data;

      // 检查玩家是否已在房间中
      if (room.players && room.players.find(p => p.id === player.id)) {
        return {
          success: true,
          message: '玩家已在房间中',
          data: room,
        };
      }

      // 检查房间是否已满
      if (room.players && room.players.length >= 8) {
        return {
          success: false,
          message: '房间已满',
          data: null,
        };
      }

      // 更新房间，添加玩家（使用重试机制）
      const updatedPlayers = [...(room.players || []), player];
      await dbOperationWithRetry(async (db) => {
        return await db.collection(DB_COLLECTION_ROOMS)
          .doc(room._id)
          .update({
            data: {
              players: updatedPlayers,
              updatedAt: Date.now(),
            },
          });
      });

      // 重新获取更新后的房间数据
      const updatedRoom = await this.getRoom(roomId);
      return {
        success: true,
        message: '加入房间成功',
        data: updatedRoom.data,
      };
    } catch (error) {
      console.error('加入房间失败', error);
      const errorMsg = error.errMsg || error.message || '';
      let errorMessage = '加入房间失败';
      
      if (errorMsg.includes('access_token') || errorMsg.includes('missing') || errorMsg.includes('41001')) {
        errorMessage = '账号登录未完成，请稍等片刻后重试';
      } else {
        errorMessage = errorMsg || '加入房间失败';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null,
      };
    }
  },

  // 更新房间数据
  async updateRoom(roomId, updateData) {
    try {
      const roomResult = await this.getRoom(roomId);
      if (!roomResult.success || !roomResult.data) {
        return {
          success: false,
          message: '房间不存在',
          data: null,
        };
      }

      const room = roomResult.data;

      // 使用重试机制更新房间
      await dbOperationWithRetry(async (db) => {
        return await db.collection(DB_COLLECTION_ROOMS)
          .doc(room._id)
          .update({
            data: {
              ...updateData,
              updatedAt: Date.now(),
            },
          });
      });

      // 重新获取更新后的房间数据
      const updatedRoom = await this.getRoom(roomId);
      return {
        success: true,
        message: '更新成功',
        data: updatedRoom.data,
      };
    } catch (error) {
      console.error('更新房间失败', error);
      const errorMsg = error.errMsg || error.message || '';
      let errorMessage = '更新房间失败';
      
      if (errorMsg.includes('access_token') || errorMsg.includes('missing') || errorMsg.includes('41001')) {
        errorMessage = '账号登录未完成，请稍等片刻后重试';
      } else {
        errorMessage = errorMsg || '更新房间失败';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null,
      };
    }
  },

  // 监听房间数据变化（实时同步）
  watchRoom(roomId, callback) {
    if (!initCloud()) {
      console.error('云开发未初始化');
      return null;
    }

    try {
      const watcher = db.collection(DB_COLLECTION_ROOMS)
        .where({
          roomId: roomId,
        })
        .watch({
          onChange: (snapshot) => {
            if (snapshot.docChanges && snapshot.docChanges.length > 0) {
              const change = snapshot.docChanges[0];
              if (change.doc) {
                callback({
                  success: true,
                  data: change.doc,
                  changeType: change.queueType, // 'init' | 'update' | 'enqueue' | 'dequeue'
                });
              }
            }
          },
          onError: (error) => {
            console.error('监听房间数据失败', error);
            callback({
              success: false,
              message: error.errMsg || '监听失败',
              data: null,
            });
          },
        });

      return watcher;
    } catch (error) {
      console.error('监听房间数据失败', error);
      return null;
    }
  },

  // 关闭监听
  closeWatch(watcher) {
    if (watcher && watcher.close) {
      try {
        watcher.close();
      } catch (error) {
        // 忽略websocket未连接的错误（非致命错误）
        if (error && error.message && error.message.includes('websocket')) {
          console.warn('关闭watch时websocket未连接（可忽略）', error.message);
        } else {
          console.error('关闭watch失败', error);
        }
      }
    }
  },
};

