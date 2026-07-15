const api = require('../../utils/api');
const validators = require('../../utils/validators');
const app = getApp();

Page({
  data: {
    isEdit: false,
    supplierId: '',
    form: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      categories: '',
      notes: '',
    },
    saving: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, supplierId: options.id });
      wx.setNavigationBarTitle({ title: '编辑供应商' });
      this.loadSupplier(options.id);
    }
  },

  async loadSupplier(id) {
    try {
      await app.ensureLogin();
      const res = await api.get(`/api/v1/suppliers/${id}`);
      const supplier = res.data;
      const categories = supplier.categories
        ? (typeof supplier.categories === 'string'
          ? JSON.parse(supplier.categories)
          : supplier.categories
        ).join(', ')
        : '';

      this.setData({
        form: {
          name: supplier.name || '',
          contact_person: supplier.contact_person || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          categories,
          notes: supplier.notes || '',
        },
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async onSubmit() {
    const validation = validators.validateSupplierForm(this.data.form);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      wx.showToast({ title: firstError, icon: 'none' });
      return;
    }

    if (this.data.saving) return;
    this.setData({ saving: true });

    try {
      await app.ensureLogin();

      const data = {
        ...this.data.form,
        categories: this.data.form.categories
          ? this.data.form.categories.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      if (this.data.isEdit) {
        await api.put(`/api/v1/suppliers/${this.data.supplierId}`, data);
        wx.showToast({ title: '已更新', icon: 'success' });
      } else {
        await api.post('/api/v1/suppliers', data);
        wx.showToast({ title: '创建成功', icon: 'success' });
      }

      setTimeout(() => wx.navigateBack(), 800);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },
});
