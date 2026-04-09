/**
 * JClaw Mock API Server
 * 用于验证 AI 是否按 skill 定义正确调用接口
 *
 * 启动：node mock-server/server.mjs
 * 地址：http://localhost:3001
 */

import { createServer } from 'http'

const PORT = 3001
const VALID_TOKENS = ['mock_token_pm', 'mock_token_cost', 'mock_token_admin']

// ── 颜色工具 ──────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
}

function log(method, path, status, token, note = '') {
  const statusColor = status < 300 ? c.green : status < 400 ? c.yellow : c.red
  const time = new Date().toLocaleTimeString()
  const tokenInfo = token ? `${c.cyan}[${token}]${c.reset}` : `${c.red}[无token]${c.reset}`
  console.log(
    `${c.gray}${time}${c.reset} ${c.bold}${method}${c.reset} ${path} ` +
    `${statusColor}${status}${c.reset} ${tokenInfo}${note ? ` ${c.gray}${note}${c.reset}` : ''}`
  )
}

// ── Mock 数据 ─────────────────────────────────────────────
const DIARY_LIST = [
  { id: 1, diaryDate: '2026-04-08', weatherCondition: '晴', temperature: '18-26°C', workContent: '3号楼B1层基础承台混凝土浇筑，完成总量约120m³', personnelCount: 42, machineUsage: '混凝土泵车2台、振捣棒6组', safetyRecord: '无异常，完成班前安全交底', createdBy: '张工', createdAt: '2026-04-08 18:30:00' },
  { id: 2, diaryDate: '2026-04-07', weatherCondition: '多云', temperature: '16-22°C', workContent: '2号楼标准层钢筋绑扎施工，完成第8层楼板钢筋', personnelCount: 38, machineUsage: '塔吊1台、钢筋弯曲机2台', safetyRecord: '高空作业安全检查已完成', createdBy: '李工', createdAt: '2026-04-07 17:45:00' },
  { id: 3, diaryDate: '2026-04-06', weatherCondition: '小雨', temperature: '14-18°C', workContent: '因雨停工半天，下午完成1号楼模板支设', personnelCount: 25, machineUsage: '汽车吊1台', safetyRecord: '雨天防滑措施已落实', createdBy: '王工', createdAt: '2026-04-06 16:20:00' },
  { id: 4, diaryDate: '2026-04-05', weatherCondition: '晴', temperature: '20-28°C', workContent: '地下室防水施工，完成北区外墙防水层铺设', personnelCount: 30, machineUsage: '热风枪8把、压辊机4台', safetyRecord: '通风良好，防火措施到位', createdBy: '张工', createdAt: '2026-04-05 18:00:00' },
  { id: 5, diaryDate: '2026-04-04', weatherCondition: '晴', temperature: '19-25°C', workContent: '4号楼桩基检测，完成12根试桩静载试验', personnelCount: 15, machineUsage: '静载试验设备1套', safetyRecord: '检测区域已设置警戒线', createdBy: '赵工', createdAt: '2026-04-04 17:30:00' },
  { id: 6, diaryDate: '2026-04-03', weatherCondition: '阴', temperature: '15-20°C', workContent: '临时设施整改，完善施工现场临水临电布置', personnelCount: 20, machineUsage: '无', safetyRecord: '临时用电检查合格', createdBy: '李工', createdAt: '2026-04-03 17:00:00' },
]

const STATISTICS = {
  year: 2026,
  month: 4,
  totalDays: 8,
  submittedDays: 6,
  missingDates: ['2026-04-01', '2026-04-02'],
  fillRate: 75.0,
  rating: '待改善',
}

// ── 路由处理 ──────────────────────────────────────────────
function parseToken(req) {
  const auth = req.headers['authorization'] || ''
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : null
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  })
  res.end(JSON.stringify(data, null, 2))
}

function parseQuery(url) {
  const idx = url.indexOf('?')
  if (idx === -1) return {}
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)))
}

const server = createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    })
    res.end()
    return
  }

  const token = parseToken(req)
  const urlPath = req.url.split('?')[0]

  // ── 认证检查 ──────────────────────────────────────────
  if (!token || !VALID_TOKENS.includes(token)) {
    log(req.method, urlPath, 401, token, '← token 无效')
    json(res, 401, { ok: false, code: 401, message: '认证失败：token 无效或缺失' })
    return
  }

  // ── GET /api/construction-diary/list ──────────────────
  if (req.method === 'GET' && urlPath === '/api/construction-diary/list') {
    const query = parseQuery(req.url)
    const pageNum = parseInt(query.pageNum || '1')
    const pageSize = parseInt(query.pageSize || '5')
    const start = (pageNum - 1) * pageSize
    const records = DIARY_LIST.slice(start, start + pageSize)

    log(req.method, req.url, 200, token, `← 返回 ${records.length} 条，共 ${DIARY_LIST.length} 条`)
    json(res, 200, {
      ok: true,
      data: {
        records,
        total: DIARY_LIST.length,
        pageNum,
        pageSize,
        pages: Math.ceil(DIARY_LIST.length / pageSize),
      },
    })
    return
  }

  // ── GET /api/construction-diary/statistics ────────────
  if (req.method === 'GET' && urlPath === '/api/construction-diary/statistics') {
    log(req.method, urlPath, 200, token, '← 返回月度统计')
    json(res, 200, { ok: true, data: STATISTICS })
    return
  }

  // ── GET /api/construction-diary/:id ──────────────────
  const detailMatch = urlPath.match(/^\/api\/construction-diary\/(\d+)$/)
  if (req.method === 'GET' && detailMatch) {
    const id = parseInt(detailMatch[1])
    const record = DIARY_LIST.find(d => d.id === id)
    if (!record) {
      log(req.method, urlPath, 404, token, '← 记录不存在')
      json(res, 404, { ok: false, code: 404, message: `未找到 ID 为 ${id} 的施工日志` })
      return
    }
    log(req.method, urlPath, 200, token, `← 返回 ${record.diaryDate} 日志详情`)
    json(res, 200, { ok: true, data: record })
    return
  }

  // ── 404 ──────────────────────────────────────────────
  log(req.method, urlPath, 404, token, '← 路由不存在')
  json(res, 404, { ok: false, code: 404, message: `路由不存在：${req.method} ${urlPath}` })
})

server.listen(PORT, () => {
  console.log(`\n${c.bold}${c.green}JClaw Mock API Server${c.reset}`)
  console.log(`${c.cyan}http://localhost:${PORT}${c.reset}\n`)
  console.log(`${c.gray}支持的端点：${c.reset}`)
  console.log(`  GET /api/construction-diary/list`)
  console.log(`  GET /api/construction-diary/statistics`)
  console.log(`  GET /api/construction-diary/:id`)
  console.log(`\n${c.gray}有效 token：${VALID_TOKENS.join(', ')}${c.reset}`)
  console.log(`\n${c.gray}等待请求...${c.reset}\n`)
})
