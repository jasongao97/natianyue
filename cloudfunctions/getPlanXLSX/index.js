// 云函数入口文件
const cloud = require('wx-server-sdk')
const XLSX = require('xlsx')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 转换为中文日期
 * @param {Date} date - 日期
 */
const dateFormat = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}年${month}月${day}日`
}

/**
 * 计算日期偏移
 * @param {string|Date} input - 开始日期
 * @param {number} offset - 偏移天数
 */
const dateAdd = (input, offset) => {
  const date = new Date(input)
  date.setDate(date.getDate() + offset)
  return date
}

/**
 * 计算选项名称数组
 * @param {plan.option} option
 * @returns 返回结果
 */
const getOptionNameArray = (option) => {
  let optionNameArray = []
  if (option.mode === 'segment') {
    option.segments.forEach(segment => {
      for (let offset = 0; offset < option.range; offset++) {
        const date = dateFormat(dateAdd(option.startDate, offset))
        optionNameArray.push(date + ' ' + segment)
      }
    })
  }

  if (option.mode === 'day') {
    for (let offset = 0; offset < option.range; offset++) {
      const date = dateFormat(dateAdd(option.startDate, offset))
      optionNameArray.push(date)
    }
  }

  if (option.mode === 'list') {
    optionNameArray = option.list
  }

  return optionNameArray
}

/**
 * 自适应宽度
 * @param {array} arrayOfArray 
 */
function fitToColumn(arrayOfArray) {
  // get maximum character of each column
  return arrayOfArray[0].map((a, i) => ({ wch: Math.max(...arrayOfArray.map(a2 => a2[i].toString().length * 2)) }))
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event

  const { data: plan } = await db.collection('plans').doc(id).get()
  const { data: users } = await db.collection('users').where({
    _openid: _.in(plan.participations.map(e => e.openid))
  }).get()

  const workBook = XLSX.utils.book_new()

  // 第1页表格 报名结果
  const resultSheetData = [['标题', '备注'], [plan.title, plan.remark], ['', ''], ['选项', '选择人数'], ...getOptionNameArray(plan.option).map((name, i) => {
    return [name, plan.participations.reduce((acc, cur) => (acc + +cur.selection[i]), 0)]
  })]

  const resultSheet = XLSX.utils.aoa_to_sheet(resultSheetData)
  resultSheet['!cols'] = fitToColumn(resultSheetData)

  XLSX.utils.book_append_sheet(workBook, resultSheet, '报名结果')

  // 第2页表格 详细报名情况
  const participationSheetData = [['参与者昵称', ...getOptionNameArray(plan.option)]].concat(plan.participations.map(participation => {
    return [users.find(user => user._openid === participation.openid).info.nickName, ...participation.selection.split('')]
  }))

  const participationSheet = XLSX.utils.aoa_to_sheet(participationSheetData)
  participationSheet['!cols'] = fitToColumn(participationSheetData)

  XLSX.utils.book_append_sheet(workBook, participationSheet, '详细报名情况')

  const buffer = XLSX.write(workBook, { bookType: 'xlsx', type: 'buffer' })

  const timestamp = Date.now()

  const { fileID } = await cloud.uploadFile({
    cloudPath: `xlsx/${plan._id}-${timestamp}.xlsx`, // 上传至云端的路径
    fileContent: buffer, // 小程序临时文件路径
  })

  return { fileID }
}