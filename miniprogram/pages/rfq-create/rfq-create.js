const api = require('../../utils/api');
const validators = require('../../utils/validators');
const app = getApp();

Page({
  data: {
    title: '',
    notes: '',
    items: [],
    saving: false,
  },

  onInputTitle(e) {
    this.setData({ title: e.detail.value });
  },

  onInputNotes(e) {
    this.setData({ notes: e.detail.value });
  },

  onAddItem() {
    wx.navigateTo({
      url: '/pages/rfq-edit-item/rfq-edit-item?action=new',
      events: {
        onItemDone: (item) => {
          const items = [...this.data.items, item];
          this.setData({ items });
        },
      },
    });
  },

  onRemoveItem(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items.filter((_, i) => i !== index);
    this.setData({ items });
  },

  onScanImage() {
    wx.navigateTo({
      url: '/pages/image-recognize/image-recognize',
      events: {
        onRecognized: (items) => {
          const allItems = [...this.data.items, ...items];
          this.setData({ items: allItems });
        },
      },
    });
  },

  async onSubmit() {
    const validation = validators.validateRfqForm(this.data);
    if (!validation.valid) {
      wx.showToast({ title: validation.errors.title || '请检查表单', icon: 'none' });
      return;
    }

    if (this.data.saving) return;
    this.setData({ saving: true });

    try {
      await app.ensureLogin();

      const res = await api.post('/api/v1/rfqs', {
        title: this.data.title.trim(),
        notes: this.data.notes.trim(),
        items: this.data.items,
      });

      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (err) {
      wx.showToast({ title: '创建失败: ' + err.message, icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onReset() {
    this.setData({
      title: '',
      notes: '',
      items: [],
    });
  },
});
