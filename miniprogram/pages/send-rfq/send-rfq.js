const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    rfqId: '',
    suppliers: [],
    selectedIds: [],
    keyword: '',
    sending: false,
  },

  onLoad(options) {
    if (options.rfqId) {
      this.setData({ rfqId: options.rfqId });
      this.loadSuppliers();
    }
  },

  async loadSuppliers() {
    try {
      await app.ensureLogin();
      // Load all suppliers (no pagination for selection)
      const res = await api.get('/api/v1/suppliers', { limit: 100, q: this.data.keyword });
      this.setData({ suppliers: res.data || [] });
    } catch (err) {
      wx.showToast({ title: '加载供应商失败', icon: 'none' });
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadSuppliers();
  },

  onToggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    let selectedIds = [...this.data.selectedIds];
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter(sid => sid !== id);
    } else {
      selectedIds.push(id);
    }
    this.setData({ selectedIds });
  },

  onSelectAll() {
    if (this.data.selectedIds.length === this.data.suppliers.length) {
      this.setData({ selectedIds: [] });
    } else {
      this.setData({ selectedIds: this.data.suppliers.map(s => s.id) });
    }
  },

  async onSend() {
    if (this.data.selectedIds.length === 0) {
      wx.showToast({ title: '请选择至少一个供应商', icon: 'none' });
      return;
    }

    if (this.data.sending) return;
    this.setData({ sending: true });

    try {
      await app.ensureLogin();
      await api.post(`/api/v1/rfqs/${this.data.rfqId}/send`, {
        supplier_ids: this.data.selectedIds,
      });
      wx.showToast({ title: `已发送给${this.data.selectedIds.length}个供应商`, icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: '发送失败', icon: 'none' });
    } finally {
      this.setData({ sending: false });
    }
  },
});
