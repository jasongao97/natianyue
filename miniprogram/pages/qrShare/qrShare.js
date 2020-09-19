// pages/qrShare/qrShare.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    loaded: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { id } = options
    this.getCode(id)
  },

  /**
   * 获取分享码
   */
  getCode: async function (id) {
    const { info } = await app.getUser()
    if (!info.avatar) return
    const { avatar, nickName } = info

    const { result: { fileID, title } } = await wx.cloud.callFunction({
      name: 'getPlanCode',
      data: { id }
    })

    const { tempFilePath: codePath } = await wx.cloud.downloadFile({ fileID })
    const { tempFilePath: avatarPath } = await wx.cloud.downloadFile({ fileID: avatar })

    const titleSub = title.length > 14 ? title.substring(0, 14) : title

    const query = wx.createSelectorQuery()
    query.select('#share-code')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        canvas.width = 975
        canvas.height = 1275
        ctx.scale(3, 3)

        ctx.fillStyle = '#3DAE67'
        ctx.fillRect(0, 0, 325, 425)

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 355, 325, 70)
        ctx.fillRect(25, 155, 275, 175)

        ctx.font = 'normal 16px sans-serif'
        ctx.fillText(nickName + ' 邀请你参加群约', 25, 40)

        ctx.font = 'normal bold 20px sans-serif'
        ctx.fillText(titleSub, 25, 75)

        const icon = canvas.createImage()
        icon.src = '/icons/logo.png'
        icon.onload = () => {
          ctx.drawImage(icon, 20, 375, 30, 30)
        }

        ctx.fillStyle = '#888888'
        ctx.font = 'normal bold 14px sans-serif'
        ctx.fillText('哪天约', 58, 395)

        ctx.fillStyle = '#C4EBD3'
        ctx.font = 'normal normal 13px sans-serif'
        ctx.fillText('长按识别或扫一扫小程序码进入', 25, 130)

        const code = canvas.createImage()
        code.src = codePath
        code.onload = () => {
          ctx.drawImage(code, 90, 170, 145, 145)

          const avatar = canvas.createImage()
          avatar.src = avatarPath
          avatar.onload = () => {
            ctx.save()
            ctx.arc(162.5, 242.5, 27.5, 0, 2 * Math.PI)
            ctx.lineWidth = 4
            ctx.stroke()
            ctx.fill()
            ctx.clip()
            ctx.drawImage(avatar, 135, 215, 55, 55)

            wx.canvasToTempFilePath({
              width: 650,
              height: 850,
              canvas,
              success: ({ tempFilePath }) => {
                this.setData({
                  loaded: true
                })
                this.path = tempFilePath
              }
            })
          }
        }
      })
  },
  handleSave: function () {
    if (this.path) {
      wx.previewImage({
        urls: [this.path],
      })
    }
  }
})