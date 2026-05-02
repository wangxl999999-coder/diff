const app = getApp()

Page({
  data: {
    historyList: [],
    theme: 'light'
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const theme = app.globalData.theme
    const historyList = app.globalData.historyList
    this.setData({
      theme,
      historyList
    })
  },

  useHistoryItem(e) {
    const id = e.currentTarget.dataset.id
    wx.redirectTo({
      url: `/pages/index/index?historyId=${id}`
    })
  },

  deleteHistoryItem(e) {
    const that = this
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条历史记录吗？',
      success(res) {
        if (res.confirm) {
          const historyList = that.data.historyList.filter(item => item.id !== id)
          app.globalData.historyList = historyList
          wx.setStorageSync('historyList', historyList)
          that.setData({ historyList })
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  clearAllHistory() {
    const that = this
    if (this.data.historyList.length === 0) {
      wx.showToast({
        title: '暂无历史记录',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '提示',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      success(res) {
        if (res.confirm) {
          app.globalData.historyList = []
          wx.setStorageSync('historyList', [])
          that.setData({ historyList: [] })
          wx.showToast({
            title: '已清空所有记录',
            icon: 'success'
          })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  previewHistory(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.historyList.find(h => h.id === id)
    if (item) {
      wx.showModal({
        title: '内容预览',
        content: item.text.length > 500 ? item.text.substring(0, 500) + '...' : item.text,
        showCancel: false,
        confirmText: '使用此内容',
        success: (res) => {
          if (res.confirm) {
            this.useHistoryItem(e)
          }
        }
      })
    }
  }
})
