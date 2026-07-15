const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('rfq_suppliers').del();
  await knex('rfq_items').del();
  await knex('rfq_images').del();
  await knex('rfqs').del();
  await knex('suppliers').del();

  // Insert sample suppliers
  await knex('suppliers').insert([
    {
      id: uuidv4(),
      name: '深圳华强电子科技有限公司',
      contact_person: '张伟',
      phone: '13800138001',
      email: 'zhangwei@hq-electronics.cn',
      address: '深圳市福田区华强北路1002号',
      categories: JSON.stringify(['电子元器件', 'PCB板', '连接器']),
      notes: '一级供应商，合作5年',
    },
    {
      id: uuidv4(),
      name: '上海精密机械制造有限公司',
      contact_person: '李芳',
      phone: '13900139002',
      email: 'lifang@precision-machinery.cn',
      address: '上海市浦东新区张江高科技园区',
      categories: JSON.stringify(['机械加工件', '精密零件', '模具']),
      notes: '通过ISO9001认证',
    },
    {
      id: uuidv4(),
      name: '广州包装材料供应有限公司',
      contact_person: '王强',
      phone: '13700137003',
      email: 'wangqiang@gz-packaging.cn',
      address: '广州市白云区人和镇',
      categories: JSON.stringify(['包装材料', '纸箱', '泡沫', '胶带']),
      notes: '',
    },
    {
      id: uuidv4(),
      name: '北京五金交电有限公司',
      contact_person: '赵敏',
      phone: '13600136004',
      email: 'zhaomin@bj-hardware.cn',
      address: '北京市大兴区经济技术开发区',
      categories: JSON.stringify(['五金件', '紧固件', '工具']),
      notes: '价格实惠，交期稳定',
    },
    {
      id: uuidv4(),
      name: '苏州轴承制造有限公司',
      contact_person: '刘洋',
      phone: '13500135005',
      email: 'liuyang@sz-bearing.cn',
      address: '苏州市工业园区苏虹中路',
      categories: JSON.stringify(['轴承', '传动件', '密封件']),
      notes: '专注轴承制造15年',
    },
  ]);
};
