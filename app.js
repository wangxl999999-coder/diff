App({
  onLaunch() {
    const that = this
    const theme = wx.getStorageSync('theme') || 'light'
    const fontSize = wx.getStorageSync('fontSize') || 32
    const scrollSpeed = wx.getStorageSync('scrollSpeed') || 2
    this.globalData = {
      theme,
      fontSize,
      scrollSpeed,
      historyList: wx.getStorageSync('historyList') || []
    }
  },
  
  globalData: {
    theme: 'light',
    fontSize: 32,
    scrollSpeed: 2,
    historyList: []
  },

  saveHistory(text, options) {
    const historyList = this.globalData.historyList
    const item = {
      id: Date.now(),
      text: text,
      createTime: new Date().toLocaleString(),
      options: options || {}
    }
    historyList.unshift(item)
    if (historyList.length > 20) {
      historyList.pop()
    }
    this.globalData.historyList = historyList
    wx.setStorageSync('historyList', historyList)
  }
})
