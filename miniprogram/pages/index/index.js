const api = require('../../utils/api');
const format = require('../../utils/format');
const app = getApp();

Page({
  data: {
    rfqs: [],
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
    status: '',
    keyword: '',
    loading: false,
    refreshing: false,
    statusFilter: [
      { value: '', label: '全部' },
      { value: 'draft', label: '草稿' },
      { value: 'sent', label: '已发送' },
      { value: 'quoted', label: '已报价' },
      { value: 'closed', label: '已关闭' },
    ],
    activeStatusIdx: 0,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // Refresh when returning from create/detail pages
    if (this.data.rfqs.length > 0) {
      this.loadData(true);
    }
  },

  onPullDownRefresh() {
    this.loadData(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  async loadData(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      await app.ensureLogin();

      const page = refresh ? 1 : this.data.page;
      const res = await api.get('/api/v1/rfqs', {
        page,
        limit: this.data.limit,
        status: this.data.status,
        q: this.data.keyword,
      });

      this.setData({
        rfqs: res.data || [],
        total: res.total || 0,
        hasMore: res.hasNext || false,
        page: res.page || 1,
      });
    } catch (err) {
      console.error('Failed to load RFQs:', err);
    } finally {
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({
      page: this.data.page + 1,
      loading: true,
    });

    try {
      const res = await api.get('/api/v1/rfqs', {
        page: this.data.page,
        limit: this.data.limit,
        status: this.data.status,
        q: this.data.keyword,
      });

      this.setData({
        rfqs: [...this.data.rfqs, ...(res.data || [])],
        hasMore: res.hasNext || false,
      });
    } catch (err) {
      console.error('Failed to load more RFQs:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onStatusTap(e) {
    const idx = e.currentTarget.dataset.index;
    const status = this.data.statusFilter[idx].value;
    this.setData({
      activeStatusIdx: idx,
      status,
    });
    this.loadData(true);
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadData(true);
  },

  onTapRfq(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/rfq-detail/rfq-detail?id=${id}`,
    });
  },

  onTapCreate() {
    wx.switchTab({
      url: '/pages/rfq-create/rfq-create',
    });
  },

  getStatusInfo(status) {
    return format.getStatusInfo(status);
  },

  formatDate(dateStr) {
    return format.formatDate(dateStr);
  },
});
