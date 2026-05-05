import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, SyncOutlined, PayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { phones } from '../api';
import dayjs from 'dayjs';

const CARRIER_MAP = { mobile: { label: '移动', color: 'blue' }, unicom: { label: '联通', color: 'red' }, telecom: { label: '电信', color: 'green' } };

export default function PhoneList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [form] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const r = await phones.list({ page: p, limit: 20 });
      setData(r.data);
      setTotal(r.pagination.total);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (values) => {
    try {
      await phones.create(values);
      message.success('添加成功');
      setAddVisible(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error('添加失败：' + err);
    }
  };

  const handleQueryBalance = async (id) => {
    try {
      const r = await phones.queryBalance(id);
      message.success(r.success ? `余额：¥${r.balance}` : `查询失败：${r.errorMessage}`);
      load();
    } catch (err) {
      message.error('查询失败');
    }
  };

  const handleRecharge = async (values) => {
    try {
      await phones.recharge(selectedPhone.id, values.amount);
      message.success('充值指令已发送，请稍后刷新查看结果');
      setRechargeVisible(false);
      rechargeForm.resetFields();
    } catch (err) {
      message.error('充值失败：' + err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await phones.remove(id);
      message.success('已删除');
      load();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '归属人', dataIndex: 'owner_name' },
    { title: '运营商', dataIndex: 'carrier', render: c => <Tag color={CARRIER_MAP[c]?.color}>{CARRIER_MAP[c]?.label}</Tag> },
    {
      title: '当前余额',
      dataIndex: 'current_balance',
      render: (v, r) => {
        if (v === null) return <span style={{ color: '#999' }}>未查询</span>;
        const low = v < r.low_balance_threshold;
        return <span style={{ color: low ? 'orange' : 'inherit', fontWeight: low ? 'bold' : 'normal' }}>¥{v}</span>;
      },
    },
    { title: '最近查询', dataIndex: 'last_query_at', render: v => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'success' : 'default'}>{v === 'active' ? '正常' : '停用'}</Tag> },
    {
      title: '操作',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<SyncOutlined />} onClick={() => handleQueryBalance(r.id)}>查余额</Button>
          <Button size="small" type="primary" icon={<PayCircleOutlined />} onClick={() => { setSelectedPhone(r); setRechargeVisible(true); }}>充值</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 'bold' }}>手机号管理</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddVisible(true)}>添加手机号</Button>
      </div>

      <Table rowKey="id" dataSource={data} columns={columns} loading={loading}
        pagination={{ total, current: page, pageSize: 20, onChange: p => { setPage(p); load(p); } }} />

      {/* 添加弹窗 */}
      <Modal title="添加手机号" open={addVisible} onCancel={() => setAddVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, len: 11, message: '请输入11位手机号' }]}>
            <Input maxLength={11} placeholder="13800000000" />
          </Form.Item>
          <Form.Item name="owner_name" label="归属人" rules={[{ required: true }]}>
            <Input placeholder="张三" />
          </Form.Item>
          <Form.Item name="owner_id" label="员工ID（可选）">
            <Input placeholder="EMP001" />
          </Form.Item>
          <Form.Item name="low_balance_threshold" label="低余额预警阈值（元）" initialValue={10}>
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注（可选）">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>添加</Button>
        </Form>
      </Modal>

      {/* 充值弹窗 */}
      <Modal title={`充值 - ${selectedPhone?.phone}`} open={rechargeVisible} onCancel={() => setRechargeVisible(false)} footer={null}>
        <Form form={rechargeForm} layout="vertical" onFinish={handleRecharge}>
          <Form.Item name="amount" label="充值金额（元）" rules={[{ required: true }]}>
            <Select placeholder="选择充值面额">
              {[10, 20, 30, 50, 100, 200].map(v => <Select.Option key={v} value={v}>¥{v}</Select.Option>)}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>确认充值</Button>
        </Form>
      </Modal>
    </>
  );
}
