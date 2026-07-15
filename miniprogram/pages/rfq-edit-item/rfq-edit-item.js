const api = require('../../utils/api');
const validators = require('../../utils/validators');
const app = getApp();

Page({
  data: {
    isEdit: false,
    rfqId: '',
    itemId: '',
    form: {
      product_name: '',
      specification: '',
      quantity: '',
      unit: '个',
      target_price: '',
      delivery_date: '',
      remarks: '',
    },
    saving: false,
    units: ['个', '件', '台', '套', 'kg', '吨', '米', '把', '箱', '卷', '包', '批'],
  },

  onLoad(options) {
    if (options.rfqId) {
      this.setData({ rfqId: options.rfqId });
    }
    if (options.itemId) {
      this.setData({ isEdit: true, itemId: options.itemId });
      this.loadItem(options.itemId);
    } else {
      wx.setNavigationBarTitle({ title: '添加行项目' });
    }
  },

  async loadItem(itemId) {
    try {
      const res = await api.get(`/api/v1/rfqs/${this.data.rfqId}`);
      const item = res.data.items.find(i => i.id === itemId);
      if (item) {
        this.setData({
          form: {
            product_name: item.product_name || '',
            specification: item.specification || '',
            quantity: item.quantity || '',
            unit: item.unit || '个',
            target_price: item.target_price || '',
            delivery_date: item.delivery_date || '',
            remarks: item.remarks || '',
          },
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value,
    });
  },

  onSelectUnit(e) {
    const unit = e.currentTarget.dataset.unit;
    this.setData({ 'form.unit': unit });
  },

  async onSubmit() {
    const validation = validators.validateItemForm(this.data.form);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      wx.showToast({ title: firstError, icon: 'none' });
      return;
    }

    if (this.data.saving) return;
    this.setData({ saving: true });

    try {
      await app.ensureLogin();

      const itemData = {
        ...this.data.form,
        quantity: parseFloat(this.data.form.quantity) || 1,
        target_price: this.data.form.target_price ? parseFloat(this.data.form.target_price) : null,
      };

      if (this.data.isEdit) {
        await api.put(`/api/v1/rfqs/${this.data.rfqId}/items/${this.data.itemId}`, itemData);
        wx.showToast({ title: '已更新', icon: 'success' });
      } else if (this.data.rfqId) {
        await api.post(`/api/v1/rfqs/${this.data.rfqId}/items`, itemData);
        wx.showToast({ title: '已添加', icon: 'success' });
      } else {
        // New RFQ mode: return item data to parent page
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('onItemDone', itemData);
        wx.showToast({ title: '已添加', icon: 'success' });
      }

      setTimeout(() => wx.navigateBack(), 800);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },
});
