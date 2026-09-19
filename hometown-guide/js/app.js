/* ==========================================================
   家乡文旅三维导览 - 交互逻辑（自主实践 第二步）
   职责：
   1. 家乡景点按类型 / 开放状态筛选（数据写死在 JS 数组）
   2. 加载 data/spots.json，用 ECharts 渲染客流量柱状图
   数据衔接：景点名称与 spots.json、三维场景标签三处一致
   ========================================================== */

/* ---------- 一、景点数据（题目允许直接写死在 JS 数组） ----------
   type: human 人文古迹 / nature 自然景观 / red 红色景点 / street 特色街区 */
const SPOTS = [
  { id: 1, name: '古城墙',       type: 'human',  open: true,  district: '城关区',       level: '4A', monthlyVisitors: 12800 },
  { id: 2, name: '文庙',         type: 'human',  open: true,  district: '老城区',       level: '3A', monthlyVisitors: 7600 },
  { id: 3, name: '青云山',       type: 'nature', open: true,  district: '青云山县',     level: '4A', monthlyVisitors: 15200 },
  { id: 4, name: '烈士纪念馆',   type: 'red',    open: false, district: '城关区',       level: '2A', monthlyVisitors: 5400 },
  { id: 5, name: '老街',         type: 'street', open: true,  district: '老城区',       level: '3A', monthlyVisitors: 18900 },
  { id: 6, name: '滨湖湿地公园', type: 'nature', open: true,  district: '滨湖新区',     level: '4A', monthlyVisitors: 13600 },
  { id: 7, name: '古戏台',       type: 'human',  open: true,  district: '老城区',       level: '2A', monthlyVisitors: 4200 },
  { id: 8, name: '民俗小吃街',   type: 'street', open: false, district: '城关区',       level: '—', monthlyVisitors: 9800 }
];

const TYPE_TEXT = {
  human: '人文古迹',
  nature: '自然景观',
  red: '红色景点',
  street: '特色街区'
};

const TYPE_BADGE_CLASS = {
  human: 'spot-badge-human',
  nature: 'spot-badge-nature',
  red: 'spot-badge-red',
  street: 'spot-badge-street'
};

/* ---------- 二、景点筛选与列表渲染 ---------- */
const spotListEl = document.getElementById('spotList');
const typeFilterEl = document.getElementById('typeFilter');
const statusFilterEl = document.getElementById('statusFilter');
const resultCountEl = document.getElementById('resultCount');

function getFilters() {
  return {
    type: typeFilterEl.value,    // 'all' | 'human' | 'nature' | 'red' | 'street'
    status: statusFilterEl.value // 'all' | 'open' | 'closed'
  };
}

function filterSpots(spots, { type, status }) {
  return spots.filter(function (spot) {
    const typeMatched = type === 'all' || spot.type === type;
    const statusMatched =
      status === 'all' ||
      (status === 'open' && spot.open) ||
      (status === 'closed' && !spot.open);
    return typeMatched && statusMatched;
  });
}

function spotCardHTML(spot) {
  const statusClass = spot.open ? 'text-bg-success' : 'text-bg-secondary';
  const statusText = spot.open ? '开放中' : '已关闭';

  return (
    '<div class="col-12 col-md-6 col-xl-4">' +
      '<div class="card h-100">' +
        '<div class="card-body">' +
          '<div class="d-flex justify-content-between align-items-start">' +
            '<h3 class="h6 card-title mb-1">' + spot.name + '</h3>' +
            '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
          '<div class="mb-2">' +
            '<span class="badge ' + TYPE_BADGE_CLASS[spot.type] + ' me-1">' + TYPE_TEXT[spot.type] + '</span>' +
            '<span class="badge text-bg-light text-dark border">' + spot.level + '</span>' +
          '</div>' +
          '<p class="card-text text-muted small mb-2">所属区域：' + spot.district + '</p>' +
          '<p class="card-text small mb-0">月客流量 ' + spot.monthlyVisitors.toLocaleString() + ' 人次</p>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function renderSpots() {
  const filtered = filterSpots(SPOTS, getFilters());
  resultCountEl.textContent = '共 ' + filtered.length + ' 处';

  if (filtered.length === 0) {
    spotListEl.innerHTML =
      '<div class="col-12">' +
        '<div class="alert alert-warning mb-0" role="alert">没有符合筛选条件的景点，请调整类型或开放状态后重试。</div>' +
      '</div>';
    return;
  }

  // 整体替换，保证切换筛选时旧结果被清空
  spotListEl.innerHTML = filtered.map(spotCardHTML).join('');
}

function bindSpotFilters() {
  // change 事件：选择后即时生效
  typeFilterEl.addEventListener('change', renderSpots);
  statusFilterEl.addEventListener('change', renderSpots);
}

/* ---------- 三、客流统计：加载 spots.json 并渲染 ECharts 柱状图 ---------- */
const chartEl = document.getElementById('visitorChart');
const chartNoticeEl = document.getElementById('chartNotice');
const chartSourceEl = document.getElementById('chartSource');

// 全程只维护一个 ECharts 实例，不重复 init、不替换容器
let visitorChart = null;

function showChartNotice(message, isError) {
  chartEl.classList.add('d-none');
  chartNoticeEl.classList.remove('d-none');
  chartNoticeEl.textContent = message;
  chartNoticeEl.className = isError
    ? 'alert alert-danger mb-0'
    : 'alert alert-warning mb-0';
}

function renderChart(data) {
  const spots = Array.isArray(data.spots) ? data.spots : [];

  if (spots.length === 0) {
    showChartNotice('暂无客流量数据（spots.json 中 spots 为空）。', false);
    return;
  }

  chartNoticeEl.classList.add('d-none');
  chartEl.classList.remove('d-none');

  if (visitorChart === null) {
    visitorChart = echarts.init(chartEl);
    window.addEventListener('resize', function () {
      visitorChart.resize();
    });
  }

  // option 中 xAxis / yAxis 统一使用对象写法
  visitorChart.setOption({
    title: {
      text: data.title || '各景点客流量',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: function (value) {
        return value.toLocaleString() + ' ' + (data.unit || '');
      }
    },
    grid: { left: 72, right: 24, top: 64, bottom: 56 },
    xAxis: {
      type: 'category',
      data: spots.map(function (spot) { return spot.name; }),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      name: data.unit || '',
      minInterval: 1
    },
    series: [
      {
        name: data.title || '客流量',
        type: 'bar',
        data: spots.map(function (spot) { return spot.visitors; }),
        itemStyle: { color: '#b45309' }, // 赭石暖色，与文旅主题统一
        label: { show: true, position: 'top' }
      }
    ]
  });
}

function loadChart() {
  // 断网时 ECharts CDN 可能未加载，先防御，避免 ReferenceError
  if (typeof echarts === 'undefined') {
    showChartNotice('图表库 ECharts 未能加载（可能处于断网状态），请联网后刷新页面。', true);
    return;
  }

  fetch('data/spots.json')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      // 数据来源如实标注到页面
      if (data.source) {
        chartSourceEl.textContent = '数据来源：data/spots.json · ' + data.source;
      }
      renderChart(data);
    })
    .catch(function () {
      // 断网 / 文件改名 / JSON 格式错误：显示明确提示，不抛未捕获异常
      showChartNotice('客流量数据加载失败，请检查网络连接，或确认 data/spots.json 文件存在且格式正确。', true);
    });
}

/* ---------- 四、启动 ---------- */
bindSpotFilters();
renderSpots();
loadChart();
