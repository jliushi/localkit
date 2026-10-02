// Starter resumes (fictional people and companies) and the offline writing-help phrase library.
import { lang, uid, newModule, blankDoc, bullets, emptyEntry, esc } from './resume-data.js';

const E = (org, role, start, end, bl = []) => ({ ...emptyEntry(), id: uid('e'), org, role, start, end, desc: bl.length ? bullets(bl) : '' });
const I = (t, x) => (typeof x === 'number' ? { id: uid('i'), t, lv: x } : { id: uid('i'), t, d: x || '' });
const mod = (type, o = {}) => ({ ...newModule(type, { blank: true }), ...o });

function build({ name, tpl, basic, job, intro, education, work, intern, project, campus, skills, cert, award, langs, hobby, titles = {} }) {
  const mods = [];
  const b = mod('basic'); b.d = { ...b.d, ...basic }; mods.push(b);
  if (job) { const j = mod('job'); j.d = job; mods.push(j); }
  if (intro) mods.push(mod('eval', { text: `<p>${intro}</p>` }));
  if (education) mods.push(mod('education', { entries: education }));
  if (work) mods.push(mod('work', { entries: work }));
  if (intern) mods.push(mod('intern', { entries: intern }));
  if (project) mods.push(mod('project', { entries: project }));
  if (campus) mods.push(mod('campus', { entries: campus }));
  if (skills) mods.push(mod('skills', { items: skills }));
  if (cert) mods.push(mod('cert', { items: cert }));
  if (award) mods.push(mod('award', { items: award }));
  if (langs) mods.push(mod('lang', { items: langs }));
  if (hobby) mods.push(mod('hobby', { items: hobby }));
  for (const m of mods) if (titles[m.type]) m.title = titles[m.type];
  const d = blankDoc(name);
  d.tpl = tpl; d.modules = mods;
  return d;
}

const EN = {
  se: () => build({
    name: 'Software engineer', tpl: 'tech',
    basic: { name: 'Alex Morgan', headline: 'Senior Backend Engineer', phone: '+1 555 0142 7788', email: 'alex.morgan@example.com', city: 'Austin, TX', site: 'github.com/alexmorgan-dev' },
    intro: 'Backend engineer with 7 years of experience building high-traffic payment and data platforms in Go and Java. Comfortable owning a service from design to on-call, and mentoring junior engineers.',
    work: [
      E('Northwind Cloud', 'Senior Backend Engineer', '2021.03', '', ['Led the redesign of the <b>payments ledger</b> service (Go, PostgreSQL), cutting p99 latency from 480 ms to 120 ms at 3,000 requests/s.', 'Introduced contract tests and a canary pipeline, reducing production incidents by <b>40%</b> in two quarters.', 'Mentored 4 engineers; two were promoted within 18 months.']),
      E('Brightlane Systems', 'Software Engineer', '2018.07', '2021.02', ['Built an event-driven ingestion pipeline (Kafka, Spark) processing <b>2 TB/day</b> for the analytics team.', 'Migrated 12 services from VMs to Kubernetes, saving about $9k per month in infrastructure cost.']),
    ],
    project: [E('Open-source: rate-limiter', 'Maintainer', '2020', '2023', ['Distributed token-bucket rate limiter in Go with Redis; <b>1.8k GitHub stars</b>, used by 40+ companies.'])],
    education: [E('University of Texas at Austin', 'B.S. Computer Science', '2014.09', '2018.05', ['GPA 3.8 / 4.0; ACM programming contest regional finalist.'])],
    skills: [I('Go', 95), I('Java', 85), I('PostgreSQL', 90), I('Kubernetes', 80), I('Kafka', 80), I('Python', 70), I('System design', 90), I('AWS', 80)],
    cert: [I('AWS Certified Solutions Architect – Associate', '2022')],
    langs: [I('English', 'Native'), I('Spanish', 'Professional')],
  }),
  pm: () => build({
    name: 'Product manager', tpl: 'sidebar',
    basic: { name: 'Priya Raman', headline: 'Senior Product Manager', phone: '+44 7700 900123', email: 'priya.raman@example.com', city: 'London, UK', site: 'linkedin.com/in/priyaraman' },
    intro: 'Product manager with 6 years in B2B SaaS. Strong at turning customer research into a prioritised roadmap and shipping with design and engineering. Grew self-serve revenue 2.4x in two years.',
    work: [
      E('Lumen Analytics', 'Senior Product Manager', '2020.06', '', ['Owned the onboarding and billing roadmap for a 60k-user product; lifted trial-to-paid conversion from 9% to <b>14%</b>.', 'Ran 25+ customer interviews per quarter; discovered the “shared dashboards” need that became a $1.2M ARR feature.', 'Defined OKRs with 3 engineering squads and shipped 11 releases on schedule.']),
      E('Fieldwork Labs', 'Associate Product Manager', '2017.09', '2020.05', ['Launched the mobile app MVP in 14 weeks; reached <b>50k downloads</b> in the first quarter.', 'Built an A/B testing framework adopted by the whole product team.']),
    ],
    education: [E('London School of Economics', 'MSc Management', '2015.09', '2016.12'), E('University of Leeds', 'BSc Business Information Systems', '2012.09', '2015.06')],
    skills: [I('Roadmapping', 92), I('SQL', 80), I('A/B testing', 85), I('User research', 88), I('Figma', 70), I('Jira', 85)],
    cert: [I('Pragmatic Product Management', '2021'), I('Google Analytics 4', '2023')],
    langs: [I('English', 'Native'), I('Tamil', 'Native'), I('French', 'Intermediate')],
  }),
  design: () => build({
    name: 'Designer', tpl: 'banner',
    basic: { name: 'Mia Chen', headline: 'Product Designer (UX / UI)', phone: '+1 555 0199 3021', email: 'mia.chen@example.com', city: 'Seattle, WA', site: 'miachen.design' },
    intro: 'Product designer with 5 years of experience designing consumer and fintech apps. I combine research, interaction design and a tidy design system to ship interfaces people finish tasks in.',
    work: [
      E('Cobalt Bank', 'Senior Product Designer', '2021.08', '', ['Redesigned the mobile money-transfer flow; task success rose from 71% to <b>92%</b> in usability tests.', 'Built a design system of 120 components in Figma, shortening design-to-dev handoff by 35%.', 'Led a team of 3 designers across 2 product squads.']),
      E('Paperplane Studio', 'UI / UX Designer', '2019.03', '2021.07', ['Delivered 14 client apps and websites for retail, health and education brands.', 'Introduced weekly design critiques and a shared component library.']),
    ],
    project: [E('Plantly – plant care app', 'Designer & researcher', '2022.01', '2022.06', ['Self-initiated project: 12 user interviews, 3 prototypes; case study viewed 8k times.'])],
    education: [E('Rhode Island School of Design', 'B.F.A. Graphic Design', '2015.09', '2019.05')],
    skills: [I('Figma', 95), I('Prototyping', 90), I('User research', 80), I('Design systems', 90), I('Illustration', 70), I('HTML / CSS', 60)],
    award: [I('Red Dot Award: Communication Design', '2022'), I('Awwwards Honorable Mention', '2021')],
    langs: [I('English', 'Native'), I('Mandarin', 'Fluent')],
  }),
  sales: () => build({
    name: 'Sales', tpl: 'intl',
    basic: { name: 'Daniel Okafor', headline: 'Enterprise Account Executive', phone: '+1 555 0108 4410', email: 'daniel.okafor@example.com', city: 'Chicago, IL' },
    intro: 'Account executive with 8 years of enterprise software sales. Consistently above quota; strong at multi-stakeholder deals, forecasting and building long-term customer relationships.',
    work: [
      E('Stackwell Software', 'Enterprise Account Executive', '2019.02', '', ['Closed <b>$3.4M</b> in new ARR in 2023 (138% of quota); ranked #2 of 40 reps.', 'Built a pipeline of 60+ target accounts with outbound sequencing; 22% meeting-to-opportunity rate.', 'Negotiated a 3-year, $850k contract with a Fortune 500 retailer, shortening the sales cycle by 5 weeks.']),
      E('Harbor Telecom', 'Account Manager', '2015.08', '2019.01', ['Managed a $2.1M book of business with 96% renewal rate.', 'Upsold managed-security services to 18 existing customers (+$410k).']),
    ],
    education: [E('Ohio State University', 'B.A. Business Administration, Marketing', '2011.09', '2015.05')],
    skills: [I('Salesforce', 90), I('MEDDICC', 85), I('Negotiation', 90), I('Forecasting', 80), I('Cold outreach', 85)],
    award: [I('President’s Club 2021 and 2023', ''), I('Rookie of the Year – Harbor Telecom', '2016')],
    langs: [I('English', 'Native'), I('Igbo', 'Conversational')],
  }),
  grad: () => build({
    name: 'Fresh graduate', tpl: 'minimal',
    basic: { name: 'Jamie Lee', headline: 'Junior Data Analyst', phone: '+1 555 0117 6532', email: 'jamie.lee@example.com', city: 'Boston, MA' },
    intro: 'Statistics graduate with analytics internship experience and a data-driven senior project. Looking for a junior analyst role to turn data into decisions.',
    education: [E('Boston University', 'B.S. Statistics, minor in Economics', '2021.09', '2025.05', ['GPA 3.7 / 4.0, Dean’s List 6 semesters.', 'Coursework: Regression, Machine Learning, Databases, Experimental Design.'])],
    intern: [E('Beacon Retail', 'Data Analyst Intern', '2024.06', '2024.08', ['Built a weekly sales dashboard in Tableau used by 15 store managers.', 'Cleaned and joined 1.2M transaction rows with SQL and Python; found a pricing error worth about $18k a month.'])],
    project: [E('Capstone: bike-share demand forecast', 'Team lead (4 members)', '2025.01', '2025.04', ['Forecast hourly demand with gradient boosting; reduced error by <b>18%</b> vs. baseline.'])],
    campus: [E('Data Science Club', 'Vice President', '2023.09', '2025.05', ['Organised 10 workshops with an average of 45 attendees.'])],
    skills: [I('SQL', 85), I('Python (pandas)', 80), I('Tableau', 75), I('R', 70), I('Excel', 85)],
    award: [I('Dean’s List', '2022–2025'), I('Hackathon 2nd place', '2024')],
    langs: [I('English', 'Native'), I('Korean', 'Intermediate')],
    titles: { campus: 'Leadership' },
  }),
};

const ZH = {
  se: () => build({
    name: '软件工程师', tpl: 'tech',
    basic: { name: '陈思远', headline: '后端开发工程师', phone: '138 0000 1234', email: 'chensiyuan@example.com', city: '杭州', site: 'github.com/chensy-dev' },
    job: { pos: '高级后端工程师', city: '杭州 / 上海', salary: '35-45K', start: '1 个月内' },
    intro: '6 年后端开发经验，熟悉高并发交易与数据平台，主力语言 Go / Java。能独立负责服务从设计到上线、值班的全流程，乐于带新人。',
    work: [
      E('云帆科技有限公司', '高级后端工程师', '2021.03', '', ['主导<b>交易账务系统</b>重构（Go + MySQL），峰值 3000 QPS 下 P99 延迟由 480ms 降至 120ms。', '推动契约测试与灰度发布流程，两个季度内线上故障下降 <b>40%</b>。', '带教 4 名新同学，其中 2 人 18 个月内晋升。']),
      E('星海信息技术公司', '后端开发工程师', '2018.07', '2021.02', ['搭建基于 Kafka + Flink 的实时数据管道，日处理数据 <b>2TB</b>，支撑 BI 报表与风控。', '将 12 个服务从虚拟机迁移至 Kubernetes，每月节省云成本约 6 万元。']),
    ],
    project: [E('开源项目：分布式限流组件', '核心维护者', '2020', '2023', ['基于 Go + Redis 实现令牌桶限流，GitHub <b>1.8k Star</b>，被 40+ 公司使用。'])],
    education: [E('浙江大学', '计算机科学与技术 · 本科', '2014.09', '2018.06', ['GPA 3.8/4.0，校级一等奖学金，ACM 区域赛入围。'])],
    skills: [I('Go', 95), I('Java', 85), I('MySQL', 90), I('Kubernetes', 80), I('Kafka', 80), I('Python', 70), I('系统设计', 90)],
    cert: [I('阿里云 ACP 云计算认证', '2022')],
    langs: [I('英语', 'CET-6 · 流利读写'), I('日语', '日常交流')],
  }),
  pm: () => build({
    name: '产品经理', tpl: 'sidebar',
    basic: { name: '林雅婷', headline: '高级产品经理', phone: '139 0000 5678', email: 'linyating@example.com', city: '上海', gender: '女' },
    job: { pos: '高级产品经理（B 端 / SaaS）', city: '上海', salary: '30-40K', start: '随时到岗' },
    intro: '6 年 B 端 SaaS 产品经验，擅长把用户调研转化为有优先级的路线图，并推动设计与研发按期交付。两年内带动自助付费收入增长 2.4 倍。',
    work: [
      E('流明数据科技', '高级产品经理', '2020.06', '', ['负责拥有 6 万用户产品的新手引导与计费模块，试用转付费率由 9% 提升至 <b>14%</b>。', '每季度完成 25+ 场用户访谈，发现“共享看板”需求并上线，贡献 <b>120 万</b>年度经常性收入。', '与 3 个研发小组共同制定 OKR，按期交付 11 个版本。']),
      E('田野实验室', '产品经理', '2017.09', '2020.05', ['14 周内完成移动端 MVP 上线，首季度下载量 <b>5 万</b>。', '搭建 A/B 测试流程并在团队内推广。']),
    ],
    education: [E('复旦大学', '工商管理硕士', '2015.09', '2017.06'), E('华东师范大学', '信息管理与信息系统 · 本科', '2011.09', '2015.06')],
    skills: [I('产品规划', 92), I('数据分析（SQL）', 80), I('A/B 测试', 85), I('用户研究', 88), I('Axure / Figma', 75), I('Jira', 85)],
    cert: [I('PMP 项目管理专业人士', '2021'), I('NPDP 产品经理国际认证', '2022')],
    langs: [I('普通话', '母语'), I('英语', '雅思 7.0')],
  }),
  design: () => build({
    name: '设计师', tpl: 'banner',
    basic: { name: '苏念', headline: 'UI/UX 产品设计师', phone: '137 0000 9021', email: 'sunian@example.com', city: '深圳', site: 'sunian.design' },
    job: { pos: '高级产品设计师', city: '深圳 / 广州', salary: '25-35K', start: '1 个月内' },
    intro: '5 年消费与金融类 App 设计经验。把用户研究、交互设计和设计规范结合起来，让用户更顺畅地完成任务。',
    work: [
      E('蓝鲸银行（科技部）', '高级产品设计师', '2021.08', '', ['重构手机银行转账流程，可用性测试任务成功率由 71% 提升至 <b>92%</b>。', '在 Figma 中建立含 120 个组件的设计系统，设计到开发的交接时间缩短 35%。', '带领 3 名设计师支持 2 个产品团队。']),
      E('纸飞机设计工作室', 'UI/UX 设计师', '2019.03', '2021.07', ['为零售、健康和教育品牌交付 14 个 App 与网站项目。', '推动每周设计评审，沉淀共享组件库。']),
    ],
    project: [E('Plantly 植物养护 App（个人项目）', '设计与研究', '2022.01', '2022.06', ['12 次用户访谈、3 版原型；案例在设计社区浏览量 <b>8 千</b>+。'])],
    education: [E('中国美术学院', '视觉传达设计 · 本科', '2015.09', '2019.06')],
    skills: [I('Figma', 95), I('交互原型', 90), I('用户研究', 80), I('设计系统', 90), I('插画', 70), I('HTML / CSS', 60)],
    award: [I('红点设计奖 · 传达设计', '2022'), I('Awwwards 荣誉提名', '2021')],
    langs: [I('普通话', '母语'), I('英语', 'CET-6')],
  }),
  sales: () => build({
    name: '销售', tpl: 'classic',
    basic: { name: '王志强', headline: '大客户销售经理', phone: '186 0000 4410', email: 'wangzhiqiang@example.com', city: '北京', gender: '男' },
    job: { pos: '大客户销售经理', city: '北京', salary: '25-40K + 提成', start: '2 周内' },
    intro: '8 年企业软件销售经验，连续多年超额完成指标。擅长多角色决策链的大客户项目、销售预测与长期客户关系经营。',
    work: [
      E('磐石软件', '大客户销售经理', '2019.02', '', ['2023 年新签合同额 <b>340 万</b>元（完成指标 138%），在 40 名销售中排名第 2。', '通过电话+社交触达建立 60+ 目标客户池，会议转商机率 22%。', '与某世界 500 强零售企业谈成 3 年 85 万元合同，销售周期缩短 5 周。']),
      E('海港通信', '客户经理', '2015.08', '2019.01', ['维护 210 万元存量客户，续约率 96%。', '向 18 家老客户增售安全托管服务，新增收入 41 万元。']),
    ],
    education: [E('对外经济贸易大学', '市场营销 · 本科', '2011.09', '2015.06')],
    skills: [I('Salesforce / CRM', 90), I('商务谈判', 90), I('销售预测', 80), I('大客户开发', 85), I('方案演示', 85)],
    award: [I('公司年度“金牌销售”', '2021、2023'), I('新人王 · 海港通信', '2016')],
    langs: [I('普通话', '母语'), I('英语', '商务沟通')],
  }),
  grad: () => build({
    name: '应届毕业生', tpl: 'compact',
    basic: { name: '李明轩', headline: '数据分析师（应届）', phone: '135 0000 6532', email: 'limingxuan@example.com', city: '北京', gender: '男', birth: '2003.05' },
    job: { pos: '数据分析师', city: '北京 / 上海', salary: '面议', start: '2025 年 7 月' },
    intro: '统计学专业应届毕业生，有数据分析实习与完整的毕业项目经历，熟练使用 SQL 与 Python，希望通过数据分析帮助业务决策。',
    education: [E('中国人民大学', '统计学 · 本科（辅修经济学）', '2021.09', '2025.06', ['GPA 3.7/4.0，专业前 10%，连续 3 年获校级奖学金。', '主修：回归分析、机器学习、数据库原理、实验设计。'])],
    intern: [E('启明零售集团', '数据分析实习生', '2024.06', '2024.08', ['使用 Tableau 搭建门店销售周报看板，供 15 位店长日常使用。', '用 SQL + Python 清洗并关联 120 万行交易数据，发现一处定价错误，约挽回每月 <b>1.2 万</b>元损失。'])],
    project: [E('毕业设计：共享单车需求预测', '组长（4 人）', '2025.01', '2025.04', ['使用梯度提升模型预测小时级需求，误差较基线降低 <b>18%</b>。'])],
    campus: [E('数据科学社', '副社长', '2023.09', '2025.06', ['组织 10 场技术分享，平均每场 45 人参加。', '策划校内数据分析大赛，吸引 120 名同学报名。'])],
    skills: [I('SQL', 85), I('Python（pandas）', 80), I('Tableau', 75), I('R 语言', 70), I('Excel', 85)],
    award: [I('校级一等奖学金', '2023'), I('全国大学生数学建模竞赛省二等奖', '2024')],
    langs: [I('英语', 'CET-6 · 580')],
    hobby: [I('篮球'), I('摄影'), I('阅读')],
  }),
};

export const SAMPLE_IDS = ['se', 'pm', 'design', 'sales', 'grad'];
export const sampleDoc = (id) => (lang === 'zh' ? ZH : EN)[id]();

// ---------------------------------------------------------------- writing help
const P = {
  en: {
    verbs: ['Led', 'Built', 'Designed', 'Launched', 'Improved', 'Reduced', 'Increased', 'Automated', 'Negotiated', 'Coordinated', 'Delivered', 'Analysed', 'Migrated', 'Mentored', 'Streamlined', 'Owned'],
    bank: {
      se: {
        work: ['Designed and shipped a <b>[service]</b> handling [N] requests/s with p99 latency under [N] ms.', 'Reduced infrastructure cost by <b>[N]%</b> by right-sizing workloads and introducing autoscaling.', 'Introduced code review and automated tests, cutting regressions by [N]%.', 'Led the migration of [N] services to [Kubernetes / the cloud] with zero downtime.', 'Debugged and fixed a production bottleneck, improving throughput by [N]x.', 'Mentored [N] junior engineers and ran weekly design reviews.', 'Built CI/CD pipelines that cut release time from [N] hours to [N] minutes.'],
        skills: ['Go', 'Java', 'Python', 'TypeScript', 'React', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'System design', 'Git'],
        eval: ['Software engineer with [N] years of experience building reliable, high-traffic services. Strong in system design, debugging and mentoring.'],
      },
      pm: {
        work: ['Owned the roadmap for <b>[product area]</b>, serving [N] users and growing [metric] by [N]%.', 'Ran [N] customer interviews per quarter and turned insights into prioritised requirements.', 'Aligned design, engineering and sales on a launch plan; shipped [N] releases on schedule.', 'Defined success metrics and OKRs; improved conversion from [N]% to [N]%.', 'Used A/B tests to validate [N] features, retiring [N] that did not move the metric.', 'Wrote PRDs and user stories adopted as the team template.'],
        skills: ['Roadmapping', 'User research', 'A/B testing', 'SQL', 'Prioritisation', 'PRD writing', 'Figma', 'Jira', 'Stakeholder management', 'Go-to-market'],
        eval: ['Product manager with [N] years in [domain]. Turns customer research into a clear roadmap and ships with engineering and design.'],
      },
      design: {
        work: ['Redesigned the <b>[flow]</b>, raising task success from [N]% to [N]% in usability tests.', 'Built and maintained a design system of [N] components used by [N] designers and engineers.', 'Ran [N] user interviews and usability sessions to validate prototypes before development.', 'Partnered with engineering to ship pixel-accurate UI; cut handoff time by [N]%.', 'Led visual direction for the [brand / campaign], reaching [N] customers.'],
        skills: ['Figma', 'Prototyping', 'User research', 'Design systems', 'Interaction design', 'Visual design', 'Accessibility', 'Illustration', 'Motion', 'HTML / CSS'],
        eval: ['Product designer with [N] years of experience in [domain], combining research, interaction and visual design to ship usable interfaces.'],
      },
      sales: {
        work: ['Closed <b>$[N]</b> in new revenue ([N]% of quota), ranking #[N] of [N] reps.', 'Built a pipeline of [N]+ target accounts through outbound outreach and referrals.', 'Negotiated a multi-year contract worth $[N] with [type of customer].', 'Maintained a [N]% renewal rate across a $[N] book of business.', 'Shortened the average sales cycle by [N] weeks through multi-threading and better qualification.', 'Trained [N] new hires on discovery and demo best practices.'],
        skills: ['Prospecting', 'Negotiation', 'CRM (Salesforce)', 'Forecasting', 'Discovery calls', 'Demos', 'Account management', 'Cold outreach', 'Contract closing'],
        eval: ['Sales professional with [N] years selling [product type] to [customer type]; consistently above quota.'],
      },
      grad: {
        work: ['Completed a [N]-month internship at <b>[company]</b>, supporting [team] with [task].', 'Built [deliverable] using [tool], used by [N] colleagues each week.', 'Analysed [N] rows of data and found [insight] worth [value].', 'Organised [N] events as [role], with an average of [N] attendees.', 'Led a team of [N] students on [project]; ranked [N] among [N] teams.', 'Maintained a GPA of [N] and received [scholarship].'],
        skills: ['Microsoft Office', 'Excel', 'Python', 'SQL', 'Communication', 'Teamwork', 'Presentation', 'Research', 'Time management'],
        eval: ['Recent [major] graduate with internship experience in [field]. Quick learner looking to contribute as a [role].'],
      },
    },
  },
  zh: {
    verbs: ['主导', '负责', '搭建', '设计', '推动', '优化', '提升', '降低', '落地', '协调', '梳理', '复盘', '迁移', '带领', '独立完成', '从 0 到 1'],
    bank: {
      se: {
        work: ['设计并上线<b>[系统名称]</b>，支撑峰值 [N] QPS，P99 延迟低于 [N]ms。', '通过容量评估与弹性伸缩，将基础设施成本降低 <b>[N]%</b>。', '引入代码评审与自动化测试，线上回归问题减少 [N]%。', '主导 [N] 个服务向 [Kubernetes / 云平台] 迁移，实现零停机切换。', '定位并修复线上性能瓶颈，吞吐提升 [N] 倍。', '带教 [N] 名新人，每周组织技术方案评审。', '搭建 CI/CD 流水线，发布耗时由 [N] 小时缩短至 [N] 分钟。'],
        skills: ['Go', 'Java', 'Python', 'TypeScript', 'React', 'MySQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', '系统设计', '微服务', 'Linux', 'Git'],
        eval: ['[N] 年后端开发经验，熟悉高并发服务设计与性能调优，具备良好的沟通与带教能力。'],
      },
      pm: {
        work: ['负责<b>[产品模块]</b>的规划与迭代，服务 [N] 用户，[指标] 提升 [N]%。', '每季度开展 [N] 场用户访谈，沉淀需求并输出优先级清单。', '协同设计、研发与运营制定上线计划，按期交付 [N] 个版本。', '制定核心指标与 OKR，将转化率由 [N]% 提升至 [N]%。', '通过 A/B 实验验证 [N] 个功能，及时下线 [N] 个效果不佳的方案。', '撰写 PRD 与用户故事，被团队采纳为标准模板。'],
        skills: ['产品规划', '用户研究', 'A/B 测试', 'SQL', '需求优先级', 'PRD 撰写', 'Axure', 'Figma', 'Jira', '跨部门协作', '商业分析'],
        eval: ['[N] 年[行业]产品经验，擅长从用户研究出发制定清晰的路线图，并推动研发与设计落地。'],
      },
      design: {
        work: ['重新设计<b>[流程名称]</b>，可用性测试任务成功率由 [N]% 提升至 [N]%。', '搭建并维护含 [N] 个组件的设计系统，供 [N] 位设计师与研发使用。', '开展 [N] 场用户访谈与可用性测试，在开发前验证原型。', '与研发紧密协作保证还原度，设计交接时间缩短 [N]%。', '主导 [品牌 / 活动] 视觉方向，触达 [N] 用户。'],
        skills: ['Figma', '交互原型', '用户研究', '设计系统', '交互设计', '视觉设计', '无障碍设计', '插画', '动效', 'HTML / CSS'],
        eval: ['[N] 年[领域]产品设计经验，结合用户研究、交互与视觉设计，交付易用的界面。'],
      },
      sales: {
        work: ['完成新增销售额 <b>[N] 万元</b>（指标完成率 [N]%），在 [N] 名销售中排名第 [N]。', '通过主动拓展与转介绍建立 [N]+ 个目标客户池。', '与[客户类型]谈成金额 [N] 万元的多年期合同。', '维护 [N] 万元存量客户，续约率 [N]%。', '通过多线程沟通与更精准的商机判断，销售周期缩短 [N] 周。', '培训 [N] 名新人掌握需求挖掘与产品演示。'],
        skills: ['客户开发', '商务谈判', 'CRM 系统', '销售预测', '需求挖掘', '产品演示', '客户关系管理', '电话销售', '合同签约'],
        eval: ['[N] 年[产品类型]销售经验，面向[客户类型]，业绩持续超额达成。'],
      },
      grad: {
        work: ['在<b>[公司]</b>完成为期 [N] 个月的实习，协助[团队]完成[工作内容]。', '使用 [工具] 搭建 [成果]，供 [N] 位同事每周使用。', '分析 [N] 条数据，发现[结论]，预计价值 [金额]。', '作为[角色]组织 [N] 场活动，平均每场 [N] 人参加。', '带领 [N] 人团队完成[项目]，在 [N] 支队伍中排名第 [N]。', '专业排名前 [N]%，获[奖学金名称]。'],
        skills: ['Office 办公', 'Excel', 'Python', 'SQL', '沟通表达', '团队协作', '演讲汇报', '资料检索', '时间管理'],
        eval: ['[专业]应届毕业生，有[领域]实习经历，学习能力强，希望以[岗位]身份为团队创造价值。'],
      },
    },
  },
};
export const PHRASES = P[lang];
export const ROLE_IDS = SAMPLE_IDS;
export { esc };
