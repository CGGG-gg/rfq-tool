const api = require('../../utils/api');
const format = require('../../utils/format');
const app = getApp();

Page({
  data: {
    supplier: null,
    rfqs: [],
    categories: [],
    loading: true,
  },

  onLoad(options) {
    if (options.id) {
      this.supplierId = options.id;
      this.loadData();
    }
  },

  onShow() {
    if (this.supplierId) this.loadData();
  },

  async loadData() {
    try {
      await app.ensureLogin();
      const res = await api.get(`/api/v1/suppliers/${this.supplierId}`);
      const supplier = res.data;
      this.setData({
        supplier,
        rfqs: supplier.rfqs || [],
        categories: this.parseCategories(supplier.categories),
        loading: false,
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  parseCategories(catStr) {
    if (!catStr) return [];
    try {
      return typeof catStr === 'string' ? JSON.parse(catStr) : catStr;
    } catch (e) {
      return [];
    }
  },

  onEdit() {
    wx.navigateTo({
      url: `/pages/supplier-create/supplier-create?id=${this.supplierId}`,
    });
  },

  async onDelete() {
    const result = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这个供应商吗？',
    });

    if (!result.confirm) return;

    try {
      await api.delete(`/api/v1/suppliers/${this.supplierId}`);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  onTapRfq(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/rfq-detail/rfq-detail?id=${id}`,
    });
  },

  formatDate(dateStr) {
    return format.formatDate(dateStr);
  },
});
