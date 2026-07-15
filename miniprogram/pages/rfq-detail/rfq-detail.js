const api = require('../../utils/api');
const format = require('../../utils/format');
const app = getApp();

Page({
  data: {
    rfq: null,
    items: [],
    suppliers: [],
    images: [],
    loading: true,
  },

  onLoad(options) {
    if (options.id) {
      this.rfqId = options.id;
      this.loadRfq();
    }
  },

  onShow() {
    if (this.rfqId) {
      this.loadRfq();
    }
  },

  async loadRfq() {
    try {
      await app.ensureLogin();
      const res = await api.get(`/api/v1/rfqs/${this.rfqId}`);
      const rfq = res.data;
      this.setData({
        rfq,
        items: rfq.items || [],
        suppliers: rfq.suppliers || [],
        images: rfq.images || [],
        loading: false,
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  getStatusInfo(status) {
    return format.getStatusInfo(status);
  },

  // ----- Actions -----

  onAddItem() {
    wx.navigateTo({
      url: `/pages/rfq-edit-item/rfq-edit-item?rfqId=${this.rfqId}`,
    });
  },

  onEditItem(e) {
    const itemId = e.currentTarget.dataset.itemId;
    wx.navigateTo({
      url: `/pages/rfq-edit-item/rfq-edit-item?rfqId=${this.rfqId}&itemId=${itemId}`,
    });
  },

  async onDeleteItem(e) {
    const itemId = e.currentTarget.dataset.itemId;
    const result = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这个行项目吗？',
    });

    if (!result.confirm) return;

    try {
      await api.delete(`/api/v1/rfqs/${this.rfqId}/items/${itemId}`);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadRfq();
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  onScanImage() {
    wx.navigateTo({
      url: `/pages/image-recognize/image-recognize?rfqId=${this.rfqId}`,
    });
  },

  async onDeleteImage(e) {
    const imageId = e.currentTarget.dataset.imageId;
    try {
      await api.delete(`/api/v1/rfqs/${this.rfqId}/images/${imageId}`);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadRfq();
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  onSendRfq() {
    wx.navigateTo({
      url: `/pages/send-rfq/send-rfq?rfqId=${this.rfqId}`,
    });
  },

  onViewQuotes() {
    wx.navigateTo({
      url: `/pages/rfq-quotes/rfq-quotes?rfqId=${this.rfqId}`,
    });
  },

  async onCloseRfq() {
    const result = await wx.showModal({
      title: '关闭询价',
      content: '确定要关闭这个询价单吗？关闭后不可再接受报价。',
    });

    if (!result.confirm) return;

    try {
      await api.post(`/api/v1/rfqs/${this.rfqId}/close`);
      wx.showToast({ title: '已关闭', icon: 'success' });
      this.loadRfq();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async onExport(e) {
    const type = e.currentTarget.dataset.type;

    wx.showLoading({ title: '生成中...' });

    try {
      const token = require('../../utils/auth').getToken();
      const url = `http://localhost:3000/api/v1/rfqs/${this.rfqId}/export/${type}`;

      const res = await wx.downloadFile({
        url,
        header: { Authorization: `Bearer ${token}` },
      });

      if (res.statusCode === 200) {
        wx.openDocument({
          filePath: res.tempFilePath,
          success: () => wx.hideLoading(),
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '无法打开文件', icon: 'none' });
          },
        });
      } else {
        wx.hideLoading();
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },
});
