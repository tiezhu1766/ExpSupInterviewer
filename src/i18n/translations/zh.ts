export const zh: Record<string, string> = {
  // Navigation
  'nav.home': '首页',
  'nav.prepare': '准备',
  'nav.interview': '面试',
  'nav.report': '报告',
  'nav.replay': '回放',
  'nav.settings': '设置',

  // Language switcher
  'language.en': 'EN',
  'language.zh': '中',

  // Home
  'home.hero.badge': '可解释 AI 面试',
  'home.hero.subtitle': '让你看懂为什么的 AI 面试',
  'home.hero.description':
    '一个可解释的人工智能面试系统，结合行为树驱动的追问、多智能体协作和结构化评估——让你不只得到一个分数，更理解背后的原因。',
  'home.hero.cta': '开始面试',
  'home.highlights.title': '为什么选择 ExpSupInterviewer？',
  'home.highlights.behaviorTree.title': '行为树追问',
  'home.highlights.behaviorTree.desc':
    '由行为树驱动的智能追问，确保每条面试路径都逻辑清晰、自适应且深入。',
  'home.highlights.multiAgent.title': '多智能体协作',
  'home.highlights.multiAgent.desc':
    '面试官、评估员和匹配员等多个 AI 智能体协同工作，各司其职。',
  'home.highlights.pydantic.title': 'PydanticAI 评估',
  'home.highlights.pydantic.desc':
    '使用 PydanticAI 模型进行结构化、类型安全的评估，在各维度上提供一致可靠的评分。',
  'home.highlights.eas.title': 'EAS 语义匹配',
  'home.highlights.eas.desc':
    '深度语义匹配你的简历与岗位描述，精准识别匹配差距与优势。',
  'home.highlights.replay.title': '决策回放',
  'home.highlights.replay.desc':
    '完整过程回放——从问题选择到评估打分，清楚看到每个 AI 决策是如何做出的。',
  'home.steps.title': '使用流程',
  'home.steps.upload.title': '上传简历',
  'home.steps.upload.desc': '上传 PDF / DOCX / TXT / MD 格式简历，由 AI 进行解析与分析。',
  'home.steps.jd.title': '输入岗位描述',
  'home.steps.jd.desc': '粘贴目标岗位描述，让 AI 定制面试内容。',
  'home.steps.interview.title': '开始面试',
  'home.steps.interview.desc': '开始 AI 驱动的面试，享受智能追问与实时评估。',
  'home.steps.report.title': '获取报告',
  'home.steps.report.desc': '获得多维度的详细报告与可操作的改进建议。',
  'home.compare.title': 'ExpSupInterviewer 与传统 AI 对比',
  'home.compare.feature': '功能',
  'home.compare.us': 'ExpSupInterviewer',
  'home.compare.them': '传统 AI',
  'home.compare.followUpLogic': '追问逻辑',
  'home.compare.evaluationMethod': '评估方式',
  'home.compare.resumeMatching': '简历匹配',
  'home.compare.decisionTransparency': '决策透明度',
  'home.compare.multiDimensional': '多维度评估',
  'home.cta.title': '准备好提升你的面试技巧了吗？',
  'home.cta.button': '开始面试',

  // Prepare
  'prepare.step.upload': '上传简历',
  'prepare.step.jd': '岗位描述',
  'prepare.step.report': '匹配报告',
  'prepare.resume.title': '简历',
  'prepare.jd.title': '岗位描述',
  'prepare.jd.placeholder': '在此粘贴岗位描述...',
  'prepare.maxRounds.label': '面试问题数量',
  'prepare.maxRounds.hint': '设置面试将要回答的问题总数，完成后系统自动生成评估报告',
  'prepare.analyze': '分析匹配度',
  'prepare.analyzing': '分析中...',

  // ResumeUploader
  'resumeUploader.mode.pdf': '上传文件',
  'resumeUploader.mode.text': '粘贴文本',
  'resumeUploader.file.drop': '拖拽简历文件到此处',
  'resumeUploader.file.browse': '支持 PDF / DOCX / TXT / MD，或点击浏览',
  'resumeUploader.text.placeholder': '在此粘贴简历文本...',
  'resumeUploader.parse': '解析简历',
  'resumeUploader.parsing': '正在解析简历...',
  'resumeUploader.parsed.success': '简历解析成功',
  'resumeUploader.reupload': '重新上传',
  'resumeUploader.error.noInput': '请提供简历文件或文本',

  // MatchReport
  'matchReport.matchScore': '匹配分数',
  'matchReport.great': '匹配度很高！你与这个岗位非常契合。',
  'matchReport.decent': '匹配度尚可，还有一些可以提升的地方。',
  'matchReport.low': '匹配度较低，建议针对以下差距进行补充。',
  'matchReport.skillsAnalysis': '技能分析',
  'matchReport.status.matched': '已匹配',
  'matchReport.status.partial': '部分匹配',
  'matchReport.status.missing': '缺失',
  'matchReport.suggestions': '提升建议',
  'matchReport.startInterview': '开始面试',
  'matchReport.matchMode.hybrid': '语义匹配',
  'matchReport.matchMode.llmOnly': 'LLM 匹配',
  'matchReport.similarity': '相似度',

  // Interview
  'interview.ready.title': '准备开始了吗？',
  'interview.ready.description': '简历和岗位描述已加载，开始你的 AI 面试吧。',
  'interview.ready.descriptionEmpty': '请先完成准备步骤——上传简历并填写岗位描述。',
  'interview.ready.start': '开始面试',
  'interview.ready.starting': '启动中...',
  'interview.ready.goToPrepare': '前往准备页',
  'interview.restoring': '正在恢复面试进度...',
  'interview.title': '面试',
  'interview.round': '第 {{round}} / {{total}} 轮',
  'interview.thinking': '思考中...',
  'interview.complete': '面试完成！',
  'interview.viewReport': '查看报告',
  'interview.input.placeholder': '输入你的回答...',
  'interview.send': '发送',
  'interview.realtimeScores': '实时评分',
  'interview.relevance': '相关性',
  'interview.depth': '深度',
  'interview.completeness': '完整性',
  'interview.aiReasoning': 'AI 推理',

  // Report
  'report.generating': '正在生成报告...',
  'report.noData': '暂无报告数据',
  'report.startNew': '开始新面试',
  'report.title': '面试报告',
  'report.overall': '总分：{{score}}/{{max}}',
  'report.dimensionRadar': '能力雷达',
  'report.dimensionScores': '维度得分',
  'report.progress': '进步曲线',
  'report.suggestions': '改进建议',
  'report.viewReplay': '查看决策回放',
  'report.newInterview': '新面试',

  // Replay
  'replay.title': '决策回放',
  'replay.history.title': '面试记录',
  'replay.history.loading': '加载中...',
  'replay.history.empty': '暂无面试记录',
  'replay.history.unnamed': '未命名候选人',
  'replay.history.resume': '恢复面试',
  'replay.history.questions': '题',
  'replay.status.finished': '已完成',
  'replay.status.ongoing': '进行中',
  'replay.messages': '{{count}} 条消息',
  'replay.scoredAnswers': '{{count}} 个已评分回答',
  'replay.backToList': '返回列表',
  'replay.viewReport': '查看报告',
  'replay.newInterview': '新面试',

  // Charts
  'report.chart.noData': '暂无历史面试数据',
  'report.chart.score': '分数',
  'report.chart.interview': '第 {{num}} 次面试',

  // Matcher suggestions
  'matcher.suggestion.jdmissing': '岗位描述未提及 {{skill}}，建议展示相关经验',
  'matcher.suggestion.considerLearning': '建议学习 {{skill}}',

  // Decision detail
  'thinking.decision': '决策：',
  'decisionDetail.followUp': '决策：追问',
  'quality.good': '良好',
  'quality.vague': '模糊',
  'quality.shallow': '浅显',
  'quality.no_data': '无数据',
  'quality.irrelevant': '不相关',

  // Chat
  'chat.expand': '展开全文',
  'chat.collapse': '收起',

  // Error Boundary
  'errorBoundary.title': '出错了',
  'errorBoundary.description':
    '应用遇到了意外错误。你可以尝试返回首页，或刷新页面重试。',
  'errorBoundary.goHome': '返回首页',
  'errorBoundary.retry': '重试',

  // Interview engine end message
  'interview.endMessage': '感谢你的时间，面试已结束。你可以查看详细报告。',

  // Report dimensions and suggestions
  'report.dim.relevance': '相关性',
  'report.dim.starMethod': 'STAR 法则',
  'report.dim.logic': '逻辑性',
  'report.dim.completeness': '完整性',
  'report.dim.jobFit': '岗位匹配',
  'report.suggestion.relevance': '回答时更聚焦于问题核心',
  'report.suggestion.starMethod': '使用 STAR 法则（情境-任务-行动-结果）组织回答',
  'report.suggestion.logic': '清晰表达因果关系，先结论后细节',
  'report.suggestion.completeness': '确保每个回答都包含背景、行动和结果',
  'report.suggestion.jobFit': '主动展示与岗位直接相关的经验和技能',

  // Question bank
  'q1.text':
    '请介绍一个你最有成就感的项目。你在其中扮演什么角色，使用了哪些技术，带来了什么影响？',
  'q1.followUp.vague':
    '能否更具体地描述这个项目？范围是什么，你个人具体实现了哪些内容？',
  'q1.reason.vague': '回答过短，无法评估项目经验',
  'q1.followUp.no_data':
    '你提到了一些技术，但没有具体成果。这个项目取得了哪些可衡量的结果？',
  'q1.reason.no_data': '未提及可量化的数据或成果',
  'q1.followUp.shallow':
    '能否更深入地谈谈你遇到的技术挑战，以及你是如何克服的？',
  'q1.reason.shallow': '回答缺乏技术深度',

  'q2.text': '请描述一次你需要深入调查的技术问题。你是如何诊断并解决的？',
  'q2.followUp.vague':
    '回答比较简短。能否详细说明具体的技术问题，以及你遵循的排查过程？',
  'q2.reason.vague': '回答过于模糊，无法评估技术能力',
  'q2.followUp.shallow':
    '你只是概括性地描述了问题。能否解释根本原因和解决方案的技术细节？',
  'q2.reason.shallow': '技术解释缺乏深度',
  'q2.followUp.irrelevant':
    '你的回答似乎没有针对技术问题。能否分享一次具体关于调试或解决技术问题的经历？',
  'q2.reason.irrelevant': '回答与技术问题解决无关',

  'q3.text': '请讲述一次你与团队成员产生分歧的经历。你是如何处理的，结果如何？',
  'q3.followUp.vague':
    '能否提供更多细节？双方观点分别是什么，你们是如何达成一致的？',
  'q3.reason.vague': '回答缺乏协作细节',
  'q3.followUp.no_data':
    '你提到了分歧，但没有说明解决过程。你具体采取了哪些步骤来解决冲突？',
  'q3.reason.no_data': '没有冲突解决的具体例子',
  'q3.followUp.shallow':
    '这次经历后团队氛围有什么变化？你对高效协作有了哪些新的理解？',
  'q3.reason.shallow': '回答没有体现对团队合作的深入理解',

  'q4.text': '请描述一次你需要在信息不完整的情况下做决策的经历。你采取了什么方法，结果如何？',
  'q4.followUp.vague':
    '能否提供更多背景？你缺少哪些信息，当时的风险是什么？',
  'q4.reason.vague': '回答过短，无法评估问题解决能力',
  'q4.followUp.no_data':
    '你使用了什么标准或框架来做决策？能否量化结果？',
  'q4.reason.no_data': '没有描述结构化方法或可衡量的结果',
  'q4.followUp.irrelevant':
    '这似乎没有回答在不确定性下做决策的问题。能否想想一次你不得不在没有掌握全部事实时就行动的经历？',
  'q4.reason.irrelevant': '回答与决策问题无关',

  'q5.text': '你为什么对这个岗位感兴趣？你的背景和经验如何匹配我们的需求？',
  'q5.followUp.vague':
    '你的回答比较笼统。能否指出与这个岗位直接相关的具体经历或技能？',
  'q5.reason.vague': '回答过于模糊，无法评估岗位匹配度',
  'q5.followUp.no_data':
    '你没有提到具体的例子。你过去哪些成就与这个岗位最相关，为什么？',
  'q5.reason.no_data': '没有提供证据支持岗位匹配的说法',
  'q5.followUp.shallow':
    '除了表面兴趣，这个岗位的哪些方面让你兴奋？你入职前 90 天会如何贡献？',
  'q5.reason.shallow': '回答只体现了对岗位的浅显理解',

  // Settings
  'settings.title': '设置',
  'settings.subtitle': '管理 LLM 服务配置',
  'settings.llmConfigs': 'LLM 配置',
  'settings.addConfig': '新增配置',
  'settings.editConfig': '编辑配置',
  'settings.name': '名称',
  'settings.baseUrl': 'Base URL',
  'settings.apiKey': 'API Key',
  'settings.model': '模型',
  'settings.namePlaceholder': '例如：讯飞星火',
  'settings.baseUrlPlaceholder': '例如：https://api.example.com/v1',
  'settings.apiKeyPlaceholder': '输入 API Key（留空则保持不变）',
  'settings.modelPlaceholder': '例如：astron-code-latest',
  'settings.save': '保存',
  'settings.cancel': '取消',
  'settings.activate': '激活',
  'settings.active': '已激活',
  'settings.edit': '编辑',
  'settings.delete': '删除',
  'settings.confirmDelete': '确定要删除这条配置吗？',
  'settings.empty': '暂无 LLM 配置，请添加一条。',
  'settings.loading': '加载中...',
  'settings.fallbackNotice': '未激活任何配置时将使用 .env 中的默认配置。',
};
