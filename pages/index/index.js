const app = getApp()

Page({
  data: {
    text: '',
    displayText: '',
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
    marqueeText: '',
    marqueeDistance: 0,
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
    if (isMarquee) {
      this.stopScroll()
      this.startMarquee()
    } else {
      this.stopMarquee()
    }
  },

  togglePlay() {
    if (!this.data.text.trim()) {
      wx.showToast({
        title: '请先输入文字',
        icon: 'none'
      })
      return
    }

    const isPlaying = !this.data.isPlaying
    this.setData({ 
      isPlaying,
      displayText: this.data.text
    })

    if (isPlaying) {
      if (this.data.isMarquee) {
        this.startMarquee()
      } else {
        this.startScroll()
      }
      this.saveHistory()
    } else {
      this.pauseScroll()
    }
  },

  startScroll() {
    const that = this
    const { scrollSpeed, scrollTop, textHeight, windowHeight } = this.data
    
    if (textHeight <= windowHeight) {
      wx.showToast({
        title: '文字内容较少，无需滚动',
        icon: 'none'
      })
      return
    }

    this.clearAllTimers()
    
    const timer = setInterval(() => {
      let newScrollTop = that.data.scrollTop + scrollSpeed
      if (newScrollTop >= textHeight - windowHeight + 100) {
        newScrollTop = textHeight - windowHeight + 100
        that.pauseScroll()
      }
      that.setData({ scrollTop: newScrollTop })
    }, 30)

    this.setData({ timer })
  },

  pauseScroll() {
    this.setData({ isPlaying: false })
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  stopScroll() {
    this.pauseScroll()
    this.setData({ scrollTop: 0 })
  },

  resetScroll() {
    this.pauseScroll()
    this.setData({ 
      scrollTop: 0,
      isPlaying: false,
      marqueeDistance: 0
    })
    this.stopMarquee()
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

  startMarquee() {
    const that = this
    this.stopMarquee()
    
    const marqueeText = this.data.text.replace(/\n/g, '  ')
    this.setData({ 
      marqueeText,
      marqueeDistance: 0
    })

    if (!marqueeText.trim()) return

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
    }
    if (this.data.marqueeTimer) {
      clearInterval(this.data.marqueeTimer)
    }
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
        displayText: item.text,
        fontSize: item.options.fontSize || 32,
        scrollSpeed: item.options.scrollSpeed || 2,
        isMirror: item.options.isMirror || false,
        isMarquee: item.options.isMarquee || false
      })
    }
  },

  onTextAreaReady(e) {
    const that = this
    const query = wx.createSelectorQuery()
    query.select('.text-content').boundingClientRect(function(rect) {
      if (rect) {
        that.setData({ textHeight: rect.height })
      }
    }).exec()
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
          this.resetScroll()
          this.setData({
            text: '',
            displayText: ''
          })
        }
      }
    })
  }
})
