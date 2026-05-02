const app = getApp()

Page({
  data: {
    text: '',
    fontSize: 32,
    scrollSpeed: 2,
    isPlaying: false,
    isFullScreen: false,
    isMirror: false,
    theme: 'light',
    isMarquee: false,
    scrollTop: 0,
    textHeight: 0,
    windowHeight: 0,
    showControlPanel: true,
    marqueeDistance: 0,
    isTeleprompterMode: false,
    timer: null,
    marqueeTimer: null
  },

  onLoad(options) {
    this.initData()
    this.getSystemInfo()
    
    if (options.historyId) {
      this.loadHistoryItem(options.historyId)
    }
  },

  onUnload() {
    this.clearAllTimers()
  },

  onShow() {
    this.initData()
  },

  initData() {
    const { theme, fontSize, scrollSpeed } = app.globalData
    this.setData({
      theme,
      fontSize,
      scrollSpeed
    })
  },

  getSystemInfo() {
    const res = wx.getSystemInfoSync()
    this.setData({
      windowHeight: res.windowHeight
    })
  },

  onTextInput(e) {
    this.setData({
      text: e.detail.value
    })
  },

  onFontSizeChange(e) {
    const fontSize = parseInt(e.detail.value)
    this.setData({ fontSize })
    wx.setStorageSync('fontSize', fontSize)
    app.globalData.fontSize = fontSize
    
    if (this.data.isTeleprompterMode) {
      setTimeout(() => {
        this.measureTextHeight()
      }, 100)
    }
  },

  onSpeedChange(e) {
    const scrollSpeed = parseFloat(e.detail.value)
    this.setData({ scrollSpeed })
    wx.setStorageSync('scrollSpeed', scrollSpeed)
    app.globalData.scrollSpeed = scrollSpeed
  },

  toggleTheme() {
    const theme = this.data.theme === 'light' ? 'dark' : 'light'
    this.setData({ theme })
    wx.setStorageSync('theme', theme)
    app.globalData.theme = theme
  },

  toggleFullScreen() {
    const isFullScreen = !this.data.isFullScreen
    this.setData({ 
      isFullScreen,
      showControlPanel: !isFullScreen
    })
    wx.setNavigationBarHidden({
      hidden: isFullScreen
    })
  },

  toggleMirror() {
    this.setData({
      isMirror: !this.data.isMirror
    })
  },

  toggleMarquee() {
    const isMarquee = !this.data.isMarquee
    this.setData({ isMarquee })
    
    if (this.data.isPlaying) {
      if (isMarquee) {
        this.stopScroll()
        this.startMarquee()
      } else {
        this.stopMarquee()
        this.startScroll()
      }
    }
  },

  startTeleprompter() {
    if (!this.data.text.trim()) {
      wx.showToast({
        title: '请先输入文字',
        icon: 'none'
      })
      return
    }

    this.setData({
      isTeleprompterMode: true,
      scrollTop: 0,
      marqueeDistance: 0
    })

    this.saveHistory()

    setTimeout(() => {
      this.measureTextHeight()
    }, 150)
  },

  measureTextHeight() {
    const that = this
    const query = wx.createSelectorQuery()
    query.select('.text-content').boundingClientRect(function(rect) {
      if (rect) {
        that.setData({ textHeight: rect.height })
      }
    }).exec()
  },

  togglePlay() {
    if (!this.data.isTeleprompterMode) {
      this.startTeleprompter()
      return
    }

    const isPlaying = !this.data.isPlaying
    this.setData({ isPlaying })

    if (isPlaying) {
      if (this.data.isMarquee) {
        this.startMarquee()
      } else {
        this.startScroll()
      }
    } else {
      this.pauseAll()
    }
  },

  startScroll() {
    const that = this
    this.clearAllTimers()

    const timer = setInterval(() => {
      let newScrollTop = that.data.scrollTop + that.data.scrollSpeed
      const maxScroll = Math.max(0, that.data.textHeight - (that.data.windowHeight * 0.6))
      
      if (newScrollTop >= maxScroll) {
        newScrollTop = maxScroll
        that.pauseAll()
      }
      that.setData({ scrollTop: newScrollTop })
    }, 30)

    this.setData({ timer })
  },

  pauseAll() {
    this.setData({ isPlaying: false })
    this.clearAllTimers()
  },

  stopScroll() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  startMarquee() {
    const that = this
    this.clearAllTimers()

    const marqueeTimer = setInterval(() => {
      let distance = that.data.marqueeDistance + that.data.scrollSpeed
      that.setData({ marqueeDistance: distance })
    }, 30)

    this.setData({ marqueeTimer })
  },

  stopMarquee() {
    if (this.data.marqueeTimer) {
      clearInterval(this.data.marqueeTimer)
      this.setData({ marqueeTimer: null })
    }
  },

  clearAllTimers() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
    if (this.data.marqueeTimer) {
      clearInterval(this.data.marqueeTimer)
      this.setData({ marqueeTimer: null })
    }
  },

  resetScroll() {
    this.pauseAll()
    this.setData({ 
      scrollTop: 0,
      marqueeDistance: 0
    })
  },

  exitTeleprompter() {
    this.pauseAll()
    this.setData({
      isTeleprompterMode: false,
      isPlaying: false,
      scrollTop: 0,
      marqueeDistance: 0,
      isFullScreen: false,
      showControlPanel: true
    })
    wx.setNavigationBarHidden({
      hidden: false
    })
  },

  increaseSpeed() {
    const newSpeed = Math.min(this.data.scrollSpeed + 0.5, 10)
    this.setData({ scrollSpeed: newSpeed })
    wx.setStorageSync('scrollSpeed', newSpeed)
    app.globalData.scrollSpeed = newSpeed
    wx.showToast({
      title: `速度: ${newSpeed.toFixed(1)}`,
      icon: 'none'
    })
  },

  decreaseSpeed() {
    const newSpeed = Math.max(this.data.scrollSpeed - 0.5, 0.5)
    this.setData({ scrollSpeed: newSpeed })
    wx.setStorageSync('scrollSpeed', newSpeed)
    app.globalData.scrollSpeed = newSpeed
    wx.showToast({
      title: `速度: ${newSpeed.toFixed(1)}`,
      icon: 'none'
    })
  },

  saveHistory() {
    if (!this.data.text.trim()) return
    
    app.saveHistory(this.data.text, {
      fontSize: this.data.fontSize,
      scrollSpeed: this.data.scrollSpeed,
      isMirror: this.data.isMirror,
      isMarquee: this.data.isMarquee
    })
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  loadHistoryItem(historyId) {
    const historyList = app.globalData.historyList
    const item = historyList.find(h => h.id === parseInt(historyId))
    if (item) {
      this.setData({
        text: item.text,
        fontSize: item.options.fontSize || 32,
        scrollSpeed: item.options.scrollSpeed || 2,
        isMirror: item.options.isMirror || false,
        isMarquee: item.options.isMarquee || false
      })
    }
  },

  toggleControlPanel() {
    this.setData({
      showControlPanel: !this.data.showControlPanel
    })
  },

  clearText() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有文字吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            text: ''
          })
        }
      }
    })
  }
})
