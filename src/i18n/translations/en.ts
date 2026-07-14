export const en: Record<string, string> = {
  // Navigation
  'nav.home': 'Home',
  'nav.prepare': 'Prepare',
  'nav.interview': 'Interview',
  'nav.report': 'Report',
  'nav.replay': 'Replay',
  'nav.settings': 'Settings',

  // Language switcher
  'language.en': 'EN',
  'language.zh': '中',

  // Home
  'home.hero.badge': 'Explainable AI Interview',
  'home.hero.subtitle': 'AI Interviews That Show You WHY',
  'home.hero.description':
    'An explainable AI interview system that combines behavior tree-driven follow-ups, multi-agent collaboration, and structured evaluation — so you never just get a score, you understand the reasoning behind it.',
  'home.hero.cta': 'Start Interview',
  'home.highlights.title': 'Why ExpSupInterviewer?',
  'home.highlights.behaviorTree.title': 'Behavior Tree Follow-ups',
  'home.highlights.behaviorTree.desc':
    'Smart follow-up questions driven by behavior trees, ensuring every interview path is logical, adaptive, and deeply probing.',
  'home.highlights.multiAgent.title': 'Multi-Agent Collaboration',
  'home.highlights.multiAgent.desc':
    'Multiple AI agents work together — interviewer, evaluator, and matcher — each specialized for their role in the interview process.',
  'home.highlights.pydantic.title': 'PydanticAI Evaluation',
  'home.highlights.pydantic.desc':
    'Structured, type-safe assessment using PydanticAI models that deliver consistent and reliable scoring across all dimensions.',
  'home.highlights.eas.title': 'EAS Semantic Matching',
  'home.highlights.eas.desc':
    'Deep semantic matching between your resume and job description, identifying alignment gaps and strengths with precision.',
  'home.highlights.replay.title': 'Decision Replay',
  'home.highlights.replay.desc':
    'Full process replay — see exactly how each AI decision was made, from question selection to evaluation scoring.',
  'home.steps.title': 'How It Works',
  'home.steps.upload.title': 'Upload Resume',
  'home.steps.upload.desc': 'Upload your resume in PDF / DOCX / TXT / MD format for AI-powered parsing and analysis.',
  'home.steps.jd.title': 'Input Job Description',
  'home.steps.jd.desc': 'Paste the target job description so the AI can tailor the interview.',
  'home.steps.interview.title': 'Start Interview',
  'home.steps.interview.desc':
    'Begin your AI-driven interview with smart follow-ups and real-time evaluation.',
  'home.steps.report.title': 'Get Report',
  'home.steps.report.desc': 'Receive a detailed, multi-dimensional report with actionable insights.',
  'home.compare.title': 'ExpSupInterviewer vs Traditional AI',
  'home.compare.feature': 'Feature',
  'home.compare.us': 'ExpSupInterviewer',
  'home.compare.them': 'Traditional AI',
  'home.compare.followUpLogic': 'Follow-up Logic',
  'home.compare.evaluationMethod': 'Evaluation Method',
  'home.compare.resumeMatching': 'Resume Matching',
  'home.compare.decisionTransparency': 'Decision Transparency',
  'home.compare.multiDimensional': 'Multi-dimensional Assessment',
  'home.cta.title': 'Ready to Improve Your Interview Skills?',
  'home.cta.button': 'Start Interview',

  // Prepare
  'prepare.step.upload': 'Upload Resume',
  'prepare.step.jd': 'Job Description',
  'prepare.step.report': 'Match Report',
  'prepare.resume.title': 'Resume',
  'prepare.jd.title': 'Job Description',
  'prepare.jd.placeholder': 'Paste the job description here...',
  'prepare.maxRounds.label': 'Number of Questions',
  'prepare.maxRounds.hint': 'Set the total number of interview questions. A report will be generated after completion.',
  'prepare.analyze': 'Analyze Match',
  'prepare.analyzing': 'Analyzing...',

  // ResumeUploader
  'resumeUploader.mode.pdf': 'Upload File',
  'resumeUploader.mode.text': 'Paste Text',
  'resumeUploader.file.drop': 'Drag & drop your resume file',
  'resumeUploader.file.browse': 'Supports PDF / DOCX / TXT / MD, or click to browse',
  'resumeUploader.text.placeholder': 'Paste your resume text here...',
  'resumeUploader.parse': 'Parse Resume',
  'resumeUploader.parsing': 'Parsing resume...',
  'resumeUploader.parsed.success': 'Resume parsed successfully',
  'resumeUploader.reupload': 'Re-upload',
  'resumeUploader.error.noInput': 'Please provide resume file or text',

  // MatchReport
  'matchReport.matchScore': 'Match Score',
  'matchReport.great': 'Great match! You\'re well-aligned with this role.',
  'matchReport.decent': 'Decent match. Some areas to strengthen.',
  'matchReport.low': 'Low match. Consider addressing the gaps below.',
  'matchReport.skillsAnalysis': 'Skills Analysis',
  'matchReport.status.matched': 'Matched',
  'matchReport.status.partial': 'Partial',
  'matchReport.status.missing': 'Missing',
  'matchReport.suggestions': 'Suggestions',
  'matchReport.startInterview': 'Start Interview',
  'matchReport.matchMode.hybrid': 'Semantic Match',
  'matchReport.matchMode.llmOnly': 'LLM Match',
  'matchReport.similarity': 'Similarity',

  // Interview
  'interview.ready.title': 'Ready to Start?',
  'interview.ready.description':
    'Your resume and job description are loaded. Begin your AI-driven interview.',
  'interview.ready.descriptionEmpty':
    'Please complete the Prepare step first — upload a resume and job description.',
  'interview.ready.start': 'Start Interview',
  'interview.ready.starting': 'Starting...',
  'interview.ready.goToPrepare': 'Go to Prepare',
  'interview.restoring': 'Restoring interview progress...',
  'interview.title': 'Interview',
  'interview.round': 'Round {{round}} of {{total}}',
  'interview.thinking': 'Thinking...',
  'interview.complete': 'Interview Complete!',
  'interview.viewReport': 'View Report',
  'interview.input.placeholder': 'Type your answer...',
  'interview.send': 'Send',
  'interview.realtimeScores': 'Real-time Scores',
  'interview.relevance': 'Relevance',
  'interview.depth': 'Depth',
  'interview.completeness': 'Completeness',
  'interview.aiReasoning': 'AI Reasoning',

  // Report
  'report.generating': 'Generating report...',
  'report.noData': 'No report data available',
  'report.startNew': 'Start New Interview',
  'report.title': 'Interview Report',
  'report.overall': 'Overall: {{score}}/{{max}}',
  'report.dimensionRadar': 'Dimension Radar',
  'report.dimensionScores': 'Dimension Scores',
  'report.progress': 'Progress',
  'report.suggestions': 'Improvement Suggestions',
  'report.viewReplay': 'View Decision Replay',
  'report.newInterview': 'New Interview',

  // Replay
  'replay.title': 'Decision Replay',
  'replay.history.title': 'Interview History',
  'replay.history.loading': 'Loading...',
  'replay.history.empty': 'No interview history yet',
  'replay.history.unnamed': 'Unnamed Candidate',
  'replay.history.resume': 'Resume Interview',
  'replay.history.questions': 'questions',
  'replay.status.finished': 'Finished',
  'replay.status.ongoing': 'Ongoing',
  'replay.messages': '{{count}} messages',
  'replay.scoredAnswers': '{{count}} scored answers',
  'replay.backToList': 'Back to List',
  'replay.viewReport': 'View Report',
  'replay.newInterview': 'New Interview',

  // Charts
  'report.chart.noData': 'No previous interview data yet',
  'report.chart.score': 'Score',
  'report.chart.interview': 'Interview {{num}}',

  // Matcher suggestions
  'matcher.suggestion.jdmissing': 'JD does not mention {{skill}}, consider showcasing related experience',
  'matcher.suggestion.considerLearning': 'Consider learning {{skill}}',

  // Decision detail
  'thinking.decision': 'Decision:',
  'decisionDetail.followUp': 'Decision: follow-up',
  'quality.good': 'good',
  'quality.vague': 'vague',
  'quality.shallow': 'shallow',
  'quality.no_data': 'no data',
  'quality.irrelevant': 'irrelevant',

  // Chat
  'chat.expand': 'Show more',
  'chat.collapse': 'Show less',

  // Error Boundary
  'errorBoundary.title': 'Something went wrong',
  'errorBoundary.description':
    'The application encountered an unexpected error. You can try going back home or refresh the page.',
  'errorBoundary.goHome': 'Go Home',
  'errorBoundary.retry': 'Retry',

  // Interview engine end message
  'interview.endMessage':
    'Thank you for your time. The interview is now complete. You can view your detailed report.',

  // Report dimensions and suggestions
  'report.dim.relevance': 'Relevance',
  'report.dim.starMethod': 'STAR Method',
  'report.dim.logic': 'Logic',
  'report.dim.completeness': 'Completeness',
  'report.dim.jobFit': 'Job Fit',
  'report.suggestion.relevance': 'Stay more focused on the question core when answering',
  'report.suggestion.starMethod':
    'Use STAR method (Situation-Task-Action-Result) to structure answers',
  'report.suggestion.logic': 'Express causal relationships clearly, state conclusions before details',
  'report.suggestion.completeness': 'Ensure each answer covers background, action, and result',
  'report.suggestion.jobFit':
    'Proactively showcase experience and skills directly relevant to the role',

  // Question bank
  'q1.text':
    'Can you walk me through a project you\'re most proud of? Describe your role, the technologies you used, and the impact it had.',
  'q1.followUp.vague':
    'Could you be more specific about your project? What was the exact scope and what did you personally implement?',
  'q1.reason.vague': 'Answer too short to assess project experience',
  'q1.followUp.no_data':
    'You mentioned some technologies but no concrete outcomes. What measurable results did the project achieve?',
  'q1.reason.no_data': 'No quantifiable data or outcomes mentioned',
  'q1.followUp.shallow':
    'Can you dive deeper into the technical challenges you faced and how you overcame them?',
  'q1.reason.shallow': 'Answer lacks technical depth',

  'q2.text':
    'Describe a technical problem you encountered that required deep investigation. How did you diagnose and resolve it?',
  'q2.followUp.vague':
    'That\'s quite brief. Could you elaborate on the specific technical issue and the debugging process you followed?',
  'q2.reason.vague': 'Answer is too vague to evaluate technical ability',
  'q2.followUp.shallow':
    'You described the problem at a high level. Can you explain the root cause and the technical details of your solution?',
  'q2.reason.shallow': 'Technical explanation lacks depth',
  'q2.followUp.irrelevant':
    'It seems like your answer may not be addressing a technical problem. Can you share an experience specifically about debugging or solving a technical issue?',
  'q2.reason.irrelevant': 'Answer doesn\'t relate to technical problem-solving',

  'q3.text':
    'Tell me about a time when you had a disagreement with a teammate. How did you handle it and what was the outcome?',
  'q3.followUp.vague':
    'Could you provide more details about the disagreement? What were the different viewpoints and how did you find common ground?',
  'q3.reason.vague': 'Answer lacks specifics about collaboration',
  'q3.followUp.no_data':
    'You mentioned a disagreement but didn\'t share the resolution process. What specific steps did you take to resolve the conflict?',
  'q3.reason.no_data': 'No concrete examples of conflict resolution',
  'q3.followUp.shallow':
    'How did the team dynamics change after this experience? What did you learn about effective collaboration?',
  'q3.reason.shallow': 'Answer doesn\'t show depth in understanding teamwork',

  'q4.text':
    'Describe a situation where you had to make a decision with incomplete information. What was your approach and what happened?',
  'q4.followUp.vague':
    'Can you give more context about the situation? What information were you missing and what were the stakes?',
  'q4.reason.vague': 'Answer is too brief to evaluate problem-solving',
  'q4.followUp.no_data':
    'What criteria or framework did you use to make your decision? Can you quantify the outcome?',
  'q4.reason.no_data': 'No structured approach or measurable outcome described',
  'q4.followUp.irrelevant':
    'This doesn\'t seem to address decision-making under uncertainty. Can you think of a time when you had to act without all the facts?',
  'q4.reason.irrelevant': 'Answer doesn\'t relate to the question about decision-making',

  'q5.text':
    'Why are you interested in this role? How does your background and experience align with what we\'re looking for?',
  'q5.followUp.vague':
    'Your answer is quite general. Can you point to specific experiences or skills that directly relate to this position?',
  'q5.reason.vague': 'Answer too vague to assess job fit',
  'q5.followUp.no_data':
    'You haven\'t mentioned concrete examples. Which of your past achievements are most relevant to this role and why?',
  'q5.reason.no_data': 'No evidence provided to support job fit claim',
  'q5.followUp.shallow':
    'Beyond surface-level interest, what specifically about this role excites you and how would you contribute in the first 90 days?',
  'q5.reason.shallow': 'Answer shows only shallow understanding of the role',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Manage LLM service configurations',
  'settings.llmConfigs': 'LLM Configurations',
  'settings.addConfig': 'Add Configuration',
  'settings.editConfig': 'Edit Configuration',
  'settings.name': 'Name',
  'settings.baseUrl': 'Base URL',
  'settings.apiKey': 'API Key',
  'settings.model': 'Model',
  'settings.namePlaceholder': 'e.g. Xinghuo',
  'settings.baseUrlPlaceholder': 'e.g. https://api.example.com/v1',
  'settings.apiKeyPlaceholder': 'Enter API key (leave blank to keep unchanged)',
  'settings.modelPlaceholder': 'e.g. astron-code-latest',
  'settings.save': 'Save',
  'settings.cancel': 'Cancel',
  'settings.activate': 'Activate',
  'settings.active': 'Active',
  'settings.edit': 'Edit',
  'settings.delete': 'Delete',
  'settings.confirmDelete': 'Are you sure you want to delete this configuration?',
  'settings.empty': 'No LLM configurations yet. Add one to get started.',
  'settings.loading': 'Loading...',
  'settings.fallbackNotice': 'When no configuration is active, the default .env configuration will be used.',
};
