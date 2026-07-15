const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    suppliers: [],
    page: 1,
    limit: 20,
    keyword: '',
    hasMore: false,
    loading: false,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData(true);
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
      const res = await api.get('/api/v1/suppliers', {
        page,
        limit: this.data.limit,
        q: this.data.keyword,
      });

      this.setData({
        suppliers: res.data || [],
        total: res.total || 0,
        hasMore: res.hasNext || false,
        page: res.page || 1,
      });
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      this.setData({ loading: false });
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
      const res = await api.get('/api/v1/suppliers', {
        page: this.data.page,
        limit: this.data.limit,
        q: this.data.keyword,
      });

      this.setData({
        suppliers: [...this.data.suppliers, ...(res.data || [])],
        hasMore: res.hasNext || false,
      });
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadData(true);
  },

  onTapSupplier(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/supplier-detail/supplier-detail?id=${id}`,
    });
  },

  onTapCreate() {
    wx.navigateTo({
      url: '/pages/supplier-create/supplier-create',
    });
  },
});
