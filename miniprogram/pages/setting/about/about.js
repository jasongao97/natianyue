// pages/setting/about/about.js
Page({
  data: {
    version: '1.0.0',
    description: '在这里，快速简单的发现群里的共同空闲时间，解决哪天约的千古难题，让群约更简单。',
    QA: [
      {
        question: '我的头像（昵称）显示错误 / 我想换头像？',
        answer: '您可以在设置中将最新的微信头像和昵称同步过来。'
      }, {
        question: '群约分享码怎么使用？',
        answer: '您可以将群约分享码分享给好友或朋友圈，他人扫描小程序码后便可进入群约计划进行报名。'
      }, {
        question: '发起人能做什么？',
        answer: '发起人可以修改群约信息并视报名情况选择最终确定的时间，并推送通知给订阅的用户。'
      }, {
        question: '我能不能关闭一些选项？',
        answer: '您可以在发起计划后，锁定一些选项，使得选项更加具有针对性。'
      }, {
        question: '约时段模式下没有我想要的模板怎么办？',
        answer: '我们即将推出更多模板，您也可以新建自己的模板，可以方便的多次使用。'
      }
    ],
    updates: [
      {
        date: '2020-09-20',
        version: '1.0.0',
        detail: '升级时段模式兼容更多场景 实时展示结果'
      },
      {
        date: '2019-07-17',
        version: '0.7.0',
        detail: 'AI 预测群约类型（已下线）'
      },
      {
        date: '2018-11-05',
        version: '0.6.1',
        detail: '优化界面逻辑 计划类型改进'
      }, {
        date: '2018-02-02',
        version: '0.5.1',
        detail: '发起人 结束提醒功能'
      }, {
        date: '2017-11-22',
        version: '0.4.0',
        detail: '更完整的结果展示 优先筛选'
      }, {
        date: '2017-09-19',
        version: '0.2.3',
        detail: '全新界面 三种群约类型'
      }
    ],
    credits: [
      {
        title: '拖拽排序、侧滑组件重点参考',
        description: 'https://github.com/wxp-ui/wxp-ui',
        url: 'https://github.com/wxp-ui/wxp-ui'
      },
      {
        title: '猫咪图片来自',
        description: 'unsplash @miklevasilyev',
        url: 'https://unsplash.com/photos/NodtnCsLdTE'
      }
    ]
  },

  /**
   * 转发消息
   */
  onShareAppMessage: function () {
    return {
      title: '推荐你用这个小程序搞定群约时间难题',
      path: '/pages/index/index',
      imageUrl: '../../../images/share.png',
    }
  },

  handleGetUrl: function ({ currentTarget }) {
    const { index } = currentTarget.dataset
    const data = this.data.credits[index].url
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({
          title: `成功复制 ${data}`,
          icon: 'none'
        })
      }
    })
  }
})