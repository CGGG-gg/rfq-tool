const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    rfqId: '',
    imagePath: '',
    imageUploaded: false,
    imageId: '',
    items: [],
    recognized: false,
    recognizing: false,
    source: '',
    editingItems: [],
  },

  onLoad(options) {
    if (options.rfqId) {
      this.setData({ rfqId: options.rfqId });
    }
  },

  // ----- Select/Capture Image -----

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFilePaths[0],
          imageUploaded: false,
          recognized: false,
          items: [],
        });
      },
    });
  },

  // ----- Upload Image -----

  async onUploadImage() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '上传中...' });

    try {
      await app.ensureLogin();

      const uploadUrl = this.data.rfqId
        ? `/api/v1/rfqs/${this.data.rfqId}/images`
        : '/api/v1/uploads';

      const formData = this.data.rfqId ? {} : {};

      // Use the single file upload path
      const res = await api.upload(uploadUrl, this.data.imagePath, formData, 'images');

      if (res.success && res.data) {
        const imageData = Array.isArray(res.data) ? res.data[0] : res.data;
        this.setData({
          imageUploaded: true,
          imageId: imageData.id,
        });
        wx.showToast({ title: '上传成功', icon: 'success' });
      }
    } catch (err) {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // ----- Recognize (AI/OCR) -----

  async onRecognize() {
    if (this.data.recognizing) return;
    this.setData({ recognizing: true });

    wx.showLoading({ title: 'AI识别中...' });

    try {
      await app.ensureLogin();

      let result;

      if (this.data.rfqId && this.data.imageId) {
        // Use RFQ-scoped recognition
        const res = await api.post(`/api/v1/rfqs/${this.data.rfqId}/recognize`);
        result = res.data;
      } else if (this.data.imagePath) {
        // Upload first, then recognize
        const uploadRes = await api.upload('/api/v1/uploads', this.data.imagePath, {}, 'images');
        if (!uploadRes.success || !uploadRes.data) {
          throw new Error('Upload failed');
        }
        const imageData = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;

        // Associate image with RFQ if we have one
        if (this.data.rfqId) {
          // Use the recognize endpoint
          const recRes = await api.post(`/api/v1/rfqs/${this.data.rfqId}/recognize`);
          result = recRes.data;
        } else {
          throw new Error('请先创建询价单再识别');
        }
      }

      if (result && result.items && result.items.length > 0) {
        this.setData({
          items: result.items,
          recognized: true,
          source: result.source,
          editingItems: JSON.parse(JSON.stringify(result.items)), // Deep copy for editing
        });
        wx.hideLoading();
      } else {
        wx.hideLoading();
        wx.showToast({ title: '未能识别到产品信息', icon: 'none' });
      }
    } catch (err) {
      console.error('Recognition failed:', err);
      wx.hideLoading();
      wx.showToast({ title: '识别失败: ' + err.message, icon: 'none' });
    } finally {
      this.setData({ recognizing: false });
    }
  },

  // ----- Edit Recognized Items -----

  onItemFieldChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const editingItems = [...this.data.editingItems];
    editingItems[index][field] = value;
    this.setData({ editingItems });
  },

  onRemoveItem(e) {
    const index = e.currentTarget.dataset.index;
    const editingItems = this.data.editingItems.filter((_, i) => i !== index);
    this.setData({ editingItems });
  },

  // ----- Confirm and Save -----

  async onConfirm() {
    if (this.data.editingItems.length === 0) {
      wx.showToast({ title: '没有可保存的项目', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      await app.ensureLogin();

      if (this.data.rfqId) {
        // Bulk insert into existing RFQ
        await api.post(`/api/v1/rfqs/${this.data.rfqId}/items/bulk`, {
          items: this.data.editingItems,
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '已导入' + this.data.editingItems.length + '个项目', icon: 'success' });

      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  onCancel() {
    wx.navigateBack();
  },
});
