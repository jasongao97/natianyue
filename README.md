# 哪天约 - 微信小程序

> 在这里，快速简单的发现群里的共同空闲时间，解决哪天约的千古难题，让群约更简单。

![intro](intro.png)

哪天约是一个帮助群约计划时间的微信小程序，用户可以指定范围建立群约并分享，参与者各自选择自己合适的时间，最终选出最好的时间点。本小程序首个版本上线于 2017 年，经过 3 年时间迭代更新，已积累 8 万用户。2020 年 8 月，团队围绕「[小程序云开发挑战赛](https://cloud.tencent.com/act/event/cloudbase-acc)」进行重大功能迭代，其中后端完全迁移至小程序云开发，具体项目特性说明如下。

## 特性

- 原生微信小程序开发 + 云开发
- transition 与 animation 实现自然的 加载/警告/转场 动画
- 云开发数据库实现报名结果实时推送
- 云存储持久化用户头像、小程序码、Excel 表格
- 微信开放接口实现文字安全检测、订阅消息推送

## 仓库结构

- **/couldfunctions** 云函数 (13个)

  - archivePlan - 归档群约
  - closePlan - 结束报名
  - createPlan - 新建群约
  - editParticipation - 编辑报名
  - editPlan - 编辑群约
  - editPlanLock - 编辑锁定选项
  - getPlanCode - 获取群约小程序码
  - getPlanXLSX - 获取群约导出 Excel 表格
  - login - 登录
  - register - 注册
  - reopenPlan - 重新开启报名
  - subscribePlan - 订阅群约通知
  - updateUser - 更新用户信息

- **/miniprogram** 小程序

  - */components* 组件
    - avatar - 头像
    - btn - 按钮
    - calendar-picker - 日期选择器
    - container - 容器
    - drag-list - 拖拽列表
    - footer - 页脚
    - half-modal - 半屏模态弹框
    - navigation-bar - 导航栏
    - plan-list - 群约列表 (支持滑动删除)
    - section - 段落

  - */icons* 图标

  - */images* 图片/插画

  - */pages* 页面
    - createPlan - 创建群约
    - editParticipation - 编辑报名
    - editPlan - 编辑群约
    - index - 首页
    - plan - 群约详情
    - qrShare - 群约分享码
    - setting - 设置
    - setting/about - 关于
    - setting/deletedPlan - 已删除的群约
    - setting/segmentSetting - 选项模板管理
    - setting/segmentSetting/publicSetting - 公共模板库

  - */style* 公共样式

  - */util* 工具函数
    - date - 日期处理
    - option - 选项处理
    - tools.wxs - wxs 工具模块

## 数据库集合设计

- **users** - 用户
  - _id: string
  - _openid: string - OPENID
  - _registeredAt: date - 注册时间
  - info: object - 用户信息
  - savedPlans: array - 保存的群约
  - deletedPlans: array - 删除的群约
  - segmentSettings: array - 时间选项模板

- **plans** - 群约
  - _id: string
  - _createAt: date - 创建时间
  - _creator: string - 发起人
  - _updatedAt: date - 更新时间
  - code: string - 分享码ID
  - option: object - 选项配置
  - participation: array - 参与者ID及报名信息
  - remark: string - 备注
  - subscribers: array - 订阅者ID
  - title: string - 标题

- **segment_settings** - 公共时间选项模板
  - _id: string
  - draft: boolean - 是否为草稿
  - name: string - 标题
  - segments: array - 时间选项

## 部署

1. 克隆或下载本仓库并导入微信开发者工具
2. 注册小程序并修改 `project.config.json` 中的 `appid`
3. 使用云开发控制台建立 3 个数据库集合: `users`, `plans`, `segment_settings`（数据权限均为: 所有用户可读, 仅创建者可读写）
4. 上传并部署 `/cloudfunctions` 中全部 13 个 云函数
5. 预览/上传 后即可使用
6. （可选）打开订阅消息功能
   1. 进入微信公众平台小程序管理，选择功能-订阅消息-添加模板（标题: 报名结果提醒, 关键词: 活动名称、报名结果、活动人数）
   2. 修改 `/cloudfunctions/closePlan/config.js` 和 `/miniprogram/config.js` 中的 `templateId` 为上一步中建立的模板ID
7. （可选）编辑 `/miniprogram/config.js` 中的 `env` 修改运行环境
