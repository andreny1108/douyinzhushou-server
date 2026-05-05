import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Tag, message, Spin } from 'antd';
import { SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { balance, phones } from '../api';

const CARRIER_MAP = { mobile: { label: '移动', color: 'blue' }, unicom: { label: '联通', color: 'red' }, telecom: { label: '电信', color: 'green' } };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lowBalanceList, setLowBalanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [querying, setQuerying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        balance.summary(),
        phones.list({ low_balance: 'true', limit: 100 }),
      ]);
      setSummary(s);
      setLowBalanceList(p.data || []);
    } catch (err) {
      message.error('加载失败：' + err);
    } finally {
      setLoading(false);
    }
  };

  const queryAll = async () => {
    setQuerying(true);
    try {
      const r = await balance.queryAll();
      message.success(`查询完成：${r.succeeded}/${r.total} 成功`);
      load();
    } catch (err) {
      message.error('查询失败：' + err);
    } finally {
      setQuerying(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { title: '手机号', dataIndex: 'phone' },
    { title: '归属人', dataIndex: 'owner_name' },
    { title: '运营商', dataIndex: 'carrier', render: c => <Tag color={CARRIER_MAP[c]?.color}>{CARRIER_MAP[c]?.label}</Tag> },
    { title: '当前余额', dataIndex: 'current_balance', render: v => v !== null ? `¥${v}` : '-' },
    { title: '预警阈值', dataIndex: 'low_balance_threshold', render: v => `¥${v}` },
  ];

  const totalByCarrier = (carrier) => summary?.byCarrier?.find(r => r.carrier === carrier)?.total || 0;

  return (
    <Spin spinning={loading}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="移动号码" value={totalByCarrier('mobile')} prefix="📱" /></Card></Col>
        <Col span={6}><Card><Statistic title="联通号码" value={totalByCarrier('unicom')} prefix="📡" /></Card></Col>
        <Col span={6}><Card><Statistic title="电信号码" value={totalByCarrier('telecom')} prefix="📶" /></Card></Col>
        <Col span={6}><Card><Statistic title="低余额预警" value={summary?.lowBalanceCount || 0} prefix={<WarningOutlined style={{ color: 'orange' }} />} valueStyle={{ color: 'orange' }} /></Card></Col>
      </Row>

      <Card
        title="低余额手机号"
        extra={<Button icon={<SyncOutlined />} loading={querying} onClick={queryAll}>立即查询所有余额</Button>}
      >
        <Table
          rowKey="id"
          dataSource={lowBalanceList}
          columns={columns}
          pagination={false}
          locale={{ emptyText: '暂无低余额手机号' }}
        />
      </Card>
    </Spin>
  );
}
