const app = getApp();
const BASE = app.globalData.apiBase;

Page({
  data: {
    imagePath: '',       // 本地图片路径
    recognizing: false,  // 识别中
    recognized: false,   // 识别完成
    error: '',           // 错误信息
    items: [],           // 识别出的行项目
    source: '',          // 识别来源 (deepseek/kimi)
    rfqId: '',           // 服务端RFQ ID
  },

  // ─── 选择图片 ───
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFilePaths[0],
          recognized: false,
          error: '',
          items: [],
        });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          this.setData({ error: '选取图片失败: ' + err.errMsg });
        }
      },
    });
  },

  // ─── 开始识别 ───
  async startRecognize() {
    if (!this.data.imagePath) return;
    this.setData({ recognizing: true, error: '' });

    try {
      // 1. 上传图片
      const uploadRes = await this.uploadFile('/api/v1/uploads');
      if (!uploadRes.success) throw new Error(uploadRes.error || '上传失败');

      // 2. 创建临时 RFQ
      const rfqRes = await this.request('POST', '/api/v1/rfqs', {
        title: '图片识别 - ' + new Date().toLocaleString('zh-CN'),
        notes: 'AI 自动识别结果',
      });
      if (!rfqRes.success) throw new Error(rfqRes.error || '创建失败');
      const rfqId = rfqRes.data.id;
      this.setData({ rfqId });

      // 3. 关联图片到 RFQ
      await this.uploadFile('/api/v1/rfqs/' + rfqId + '/images');

      // 4. 触发 AI 识别
      const recRes = await this.request('POST', '/api/v1/rfqs/' + rfqId + '/recognize');
      if (!recRes.success || !recRes.data.items || !recRes.data.items.length) {
        throw new Error('未能从图片中识别到产品信息');
      }

      // 5. 展示结果
      this.setData({
        recognizing: false,
        recognized: true,
        items: recRes.data.items.map(item => ({
          product_name: item.product_name || '',
          specification: item.specification || '',
          quantity: item.quantity || 1,
          unit: item.unit || '个',
          target_price: item.target_price || '',
          delivery_date: item.delivery_date || '',
          remarks: item.remarks || '',
        })),
        source: '识别引擎: ' + (recRes.data.source || 'AI'),
      });

    } catch (err) {
      this.setData({
        recognizing: false,
        error: err.message || '识别失败，请重试',
      });
    }
  },

  // ─── 编辑识别结果 ───
  onItemChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const items = this.data.items;
    items[index][field] = e.detail.value;
    this.setData({ items });
  },

  // ─── 下载 Excel ───
  async downloadExcel() {
    await this.saveItems();
    this.download('/api/v1/rfqs/' + this.data.rfqId + '/export/excel');
  },

  // ─── 下载 PDF ───
  async downloadPDF() {
    await this.saveItems();
    this.download('/api/v1/rfqs/' + this.data.rfqId + '/export/pdf');
  },

  // ─── 保存修改后的行项目 ───
  async saveItems() {
    if (!this.data.rfqId || !this.data.items.length) return;

    const items = this.data.items.map(item => ({
      product_name: item.product_name,
      specification: item.specification || '',
      quantity: parseFloat(item.quantity) || 1,
      unit: item.unit || '个',
      target_price: item.target_price ? parseFloat(item.target_price) : null,
      delivery_date: item.delivery_date || null,
      remarks: item.remarks || '',
    }));

    await this.request('POST', '/api/v1/rfqs/' + this.data.rfqId + '/items/bulk', { items });
  },

  // ─── 下载文件 ───
  download(url) {
    wx.downloadFile({
      url: BASE + url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            fail: () => wx.showToast({ title: '无法打开文件', icon: 'none' }),
          });
        }
      },
      fail: () => wx.showToast({ title: '下载失败', icon: 'none' }),
    });
  },

  // ─── 重置 ───
  reset() {
    this.setData({
      imagePath: '', recognizing: false, recognized: false,
      error: '', items: [], source: '', rfqId: '',
    });
  },

  // ─── 工具方法 ───
  uploadFile(path) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: BASE + path,
        filePath: this.data.imagePath,
        name: 'images',
        success: (res) => {
          try { resolve(JSON.parse(res.data)); }
          catch (e) { reject(new Error('解析响应失败')); }
        },
        fail: (err) => reject(new Error(err.errMsg || '上传失败')),
      });
    });
  },

  request(method, path, data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: BASE + path,
        method,
        data,
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
          else reject(new Error(res.data?.error || '请求失败'));
        },
        fail: (err) => reject(new Error(err.errMsg || '网络错误')),
      });
    });
  },
});
