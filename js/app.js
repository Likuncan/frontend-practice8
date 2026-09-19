/* ==========================================================
   迷你版校园信息中心 - 交互逻辑（第六部分 第二步）
   职责：
   1. 自习室按楼层 / 开放状态筛选（数据写死在 JS 数组）
   2. 加载 data/data.json，用 ECharts 渲染使用量柱状图
   ========================================================== */

/* ---------- 一、自习室数据（题目允许直接写死在 JS 数组） ---------- */
const STUDY_ROOMS = [
  { id: 1, name: '第一自习室', floor: 1, open: true,  seats: 120, occupied: 86  },
  { id: 2, name: '第二自习室', floor: 1, open: true,  seats: 80,  occupied: 80  },
  { id: 3, name: '第三自习室', floor: 2, open: true,  seats: 100, occupied: 45  },
  { id: 4, name: '第四自习室', floor: 2, open: false, seats: 60,  occupied: 0   },
  { id: 5, name: '考研自习室', floor: 3, open: true,  seats: 150, occupied: 132 },
  { id: 6, name: '静音自习室', floor: 3, open: true,  seats: 90,  occupied: 61  },
  { id: 7, name: '电子阅览室', floor: 4, open: true,  seats: 70,  occupied: 28  },
  { id: 8, name: '通宵自习室', floor: 4, open: false, seats: 50,  occupied: 0   }
];

/* ---------- 二、自习室筛选与列表渲染 ---------- */
const roomListEl = document.getElementById('roomList');
const floorFilterEl = document.getElementById('floorFilter');
const statusFilterEl = document.getElementById('statusFilter');
const resultCountEl = document.getElementById('resultCount');

function getFilters() {
  return {
    floor: floorFilterEl.value,   // 'all' 或 '1'~'4'
    status: statusFilterEl.value  // 'all' | 'open' | 'closed'
  };
}

function filterRooms(rooms, { floor, status }) {
  return rooms.filter(function (room) {
    const floorMatched = floor === 'all' || String(room.floor) === floor;
    const statusMatched =
      status === 'all' ||
      (status === 'open' && room.open) ||
      (status === 'closed' && !room.open);
    return floorMatched && statusMatched;
  });
}

function roomCardHTML(room) {
  const statusClass = room.open ? 'text-bg-success' : 'text-bg-secondary';
  const statusText = room.open ? '开放中' : '已关闭';
  const occupancyRate = room.seats > 0
    ? Math.round((room.occupied / room.seats) * 100)
    : 0;

  return (
    '<div class="col-12 col-md-6 col-xl-4">' +
      '<div class="card h-100">' +
        '<div class="card-body">' +
          '<div class="d-flex justify-content-between align-items-start">' +
            '<h3 class="h6 card-title mb-1">' + room.name + '</h3>' +
            '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
          '<p class="card-text text-muted small mb-2">' + room.floor + ' 楼 · 共 ' + room.seats + ' 个座位</p>' +
          '<p class="card-text small mb-0">已占用 ' + room.occupied + ' 个（' + occupancyRate + '%）</p>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function renderRooms() {
  const filtered = filterRooms(STUDY_ROOMS, getFilters());
  resultCountEl.textContent = '共 ' + filtered.length + ' 间';

  if (filtered.length === 0) {
    roomListEl.innerHTML =
      '<div class="col-12">' +
        '<div class="alert alert-warning mb-0" role="alert">没有符合筛选条件的自习室，请调整楼层或开放状态后重试。</div>' +
      '</div>';
    return;
  }

  // 整体替换，保证切换筛选时旧结果被清空
  roomListEl.innerHTML = filtered.map(roomCardHTML).join('');
}

function bindRoomFilters() {
  // change 事件：选择后即时生效
  floorFilterEl.addEventListener('change', renderRooms);
  statusFilterEl.addEventListener('change', renderRooms);
}

/* ---------- 三、使用统计：加载 data.json 并渲染 ECharts 柱状图 ---------- */
const chartEl = document.getElementById('usageChart');
const chartNoticeEl = document.getElementById('chartNotice');
const chartSourceEl = document.getElementById('chartSource');

// 全程只维护一个 ECharts 实例，不重复 init、不替换容器
let usageChart = null;

function showChartNotice(message, isError) {
  chartEl.classList.add('d-none');
  chartNoticeEl.classList.remove('d-none');
  chartNoticeEl.textContent = message;
  chartNoticeEl.className = isError
    ? 'alert alert-danger mb-0'
    : 'alert alert-warning mb-0';
}

function renderChart(data) {
  const rooms = Array.isArray(data.rooms) ? data.rooms : [];

  if (rooms.length === 0) {
    showChartNotice('暂无使用量数据（data.json 中 rooms 为空）。', false);
    return;
  }

  chartNoticeEl.classList.add('d-none');
  chartEl.classList.remove('d-none');

  if (usageChart === null) {
    usageChart = echarts.init(chartEl);
    window.addEventListener('resize', function () {
      usageChart.resize();
    });
  }

  // option 中 xAxis / yAxis 统一使用对象写法
  usageChart.setOption({
    title: {
      text: data.title || '各自习室使用量',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: function (value) {
        return value + ' ' + (data.unit || '');
      }
    },
    grid: { left: 64, right: 24, top: 64, bottom: 56 },
    xAxis: {
      type: 'category',
      data: rooms.map(function (room) { return room.name; }),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      name: data.unit || '',
      minInterval: 1
    },
    series: [
      {
        name: data.title || '使用量',
        type: 'bar',
        data: rooms.map(function (room) { return room.usage; }),
        itemStyle: { color: '#0d6efd' },
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

  fetch('data/data.json')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      // 数据来源如实标注到页面
      if (data.source) {
        chartSourceEl.textContent = '数据来源：data/data.json · ' + data.source;
      }
      renderChart(data);
    })
    .catch(function () {
      // 断网 / 文件改名 / JSON 格式错误：显示明确提示，不抛未捕获异常
      showChartNotice('使用量数据加载失败，请检查网络连接，或确认 data/data.json 文件存在且格式正确。', true);
    });
}

/* ---------- 四、启动 ---------- */
bindRoomFilters();
renderRooms();
loadChart();
