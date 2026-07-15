const api = require('../../utils/api');
const format = require('../../utils/format');
const app = getApp();

Page({
  data: {
    rfqId: '',
    rfq: null,
    suppliers: [],
    loading: true,
  },

  onLoad(options) {
    if (options.rfqId) {
      this.setData({ rfqId: options.rfqId });
      this.loadData();
    }
  },

  async loadData() {
    try {
      await app.ensureLogin();
      const res = await api.get(`/api/v1/rfqs/${this.data.rfqId}`);
      const rfq = res.data;
      this.setData({
        rfq,
        suppliers: rfq.suppliers || [],
        loading: false,
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onRecordQuote(e) {
    const supplier = e.currentTarget.dataset.supplier;
    // Show input for quote amount
    wx.showModal({
      title: `录入报价 - ${supplier.supplier_name}`,
      editable: true,
      placeholderText: '报价金额(元)',
      success: async (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content);
          if (isNaN(amount)) {
            wx.showToast({ title: '请输入有效数字', icon: 'none' });
            return;
          }
          try {
            await api.post(`/api/v1/rfqs/${this.data.rfqId}/suppliers/${supplier.supplier_id}/quote`, {
              quote_amount: amount,
              quote_notes: '',
            });
            wx.showToast({ title: '报价已记录', icon: 'success' });
            this.loadData();
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      },
    });
  },

  formatCurrency(num) {
    return format.formatCurrency(num);
  },

  formatDate(dateStr) {
    return format.formatDate(dateStr);
  },
});
