import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { recharge as rechargeApi } from '../api';
import dayjs from 'dayjs';

const STATUS_MAP = {
  pending: { label: '处理中', color: 'processing' },
  success: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'error' },
  timeout: { label: '超时', color: 'warning' },
};

const TRIGGER_MAP = { scheduled: '定时', manual: '手动', low_balance: '低余额' };
const CARRIER_MAP = { mobile: { label: '移动', color: 'blue' }, unicom: { label: '联通', color: 'red' }, telecom: { label: '电信', color: 'green' } };

export default function Logs() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  const load = async (p = page, status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (status) params.status = status;
      const r = await rechargeApi.logs(params);
      setData(r.data);
      setTotal(r.pagination.total);
    } catch (_) { message.error('加载失败'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRetry = async (id) => {
    try {
      await rechargeApi.retry(id);
      message.success('重试指令已发送');
      load();
    } catch (err) { message.error('重试失败：' + err); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '运营商', dataIndex: 'carrier', render: c => <Tag color={CARRIER_MAP[c]?.color}>{CARRIER_MAP[c]?.label}</Tag> },
    { title: '充值金额', dataIndex: 'amount', render: v => `¥${v}` },
    { title: '触发方式', dataIndex: 'trigger_type', render: v => TRIGGER_MAP[v] || v },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.label || v}</Tag> },
    { title: '充值前余额', dataIndex: 'balance_before', render: v => v !== null ? `¥${v}` : '-' },
    { title: '充值后余额', dataIndex: 'balance_after', render: v => v !== null ? `¥${v}` : '-' },
    { title: '时间', dataIndex: 'created_at', render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作',
      render: (_, r) => r.status === 'failed' ? (
        <Button size="small" type="link" icon={<ReloadOutlined />} onClick={() => handleRetry(r.id)}>重试</Button>
      ) : null,
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 'bold' }}>充值日志</span>
        <Space>
          <Select placeholder="筛选状态" allowClear style={{ width: 120 }} onChange={v => { setStatusFilter(v); load(1, v); }}>
            <Select.Option value="success">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
            <Select.Option value="pending">处理中</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => load()}>刷新</Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        pagination={{ total, current: page, pageSize: 20, onChange: p => { setPage(p); load(p); } }}
        expandable={{
          expandedRowRender: r => r.error_message ? <p style={{ color: 'red' }}>{r.error_message}</p> : <p>订单号: {r.adapter_order_id || '-'}</p>,
          rowExpandable: r => !!r.error_message || !!r.adapter_order_id,
        }}
      />
    </>
  );
}
