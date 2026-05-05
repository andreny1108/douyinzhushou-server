import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, InputNumber, Select, Switch, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rules } from '../api';

const TRIGGER_MAP = { monthly: '月度充值', low_balance: '低余额触发', both: '两者都触发' };

export default function RechargeRules() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try { setData(await rules.list()); } catch (_) { message.error('加载失败'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (values) => {
    try {
      await rules.create(values);
      message.success('规则已创建');
      setVisible(false);
      form.resetFields();
      load();
    } catch (err) { message.error('创建失败：' + err); }
  };

  const handleToggle = async (id) => {
    try { await rules.toggle(id); load(); } catch (_) { message.error('操作失败'); }
  };

  const handleDelete = async (id) => {
    try { await rules.remove(id); message.success('已删除'); load(); } catch (_) { message.error('删除失败'); }
  };

  const columns = [
    { title: '规则名', dataIndex: 'rule_name' },
    { title: '适用手机号', dataIndex: 'phone_id', render: v => v ? `ID: ${v}` : <Tag color="purple">全局默认</Tag> },
    { title: '充值金额', dataIndex: 'recharge_amount', render: v => `¥${v}` },
    { title: '触发方式', dataIndex: 'trigger_type', render: v => TRIGGER_MAP[v] || v },
    { title: '月度充值日', dataIndex: 'monthly_day', render: v => `每月 ${v} 号` },
    { title: '月度上限', dataIndex: 'max_monthly_recharge', render: v => `¥${v}` },
    { title: '状态', dataIndex: 'is_enabled', render: (v, r) => <Switch checked={!!v} onChange={() => handleToggle(r.id)} /> },
    {
      title: '操作',
      render: (_, r) => (
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 'bold' }}>充值规则管理</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setVisible(true)}>新建规则</Button>
      </div>
      <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={false} />

      <Modal title="新建充值规则" open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="rule_name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="如：运营团队默认充值规则" />
          </Form.Item>
          <Form.Item name="phone_id" label="手机号ID（留空=全局默认）">
            <InputNumber min={1} placeholder="留空表示全局规则" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="recharge_amount" label="充值金额（元）" rules={[{ required: true }]}>
            <Select>
              {[10, 20, 30, 50, 100, 200].map(v => <Select.Option key={v} value={v}>¥{v}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="trigger_type" label="触发方式" initialValue="both">
            <Select>
              <Select.Option value="monthly">每月固定日期</Select.Option>
              <Select.Option value="low_balance">余额不足时</Select.Option>
              <Select.Option value="both">两者都触发</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="monthly_day" label="每月充值日（1-28）" initialValue={1}>
            <InputNumber min={1} max={28} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="max_monthly_recharge" label="月度充值上限（元）" initialValue={200}>
            <InputNumber min={10} step={10} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>创建</Button>
        </Form>
      </Modal>
    </>
  );
}
