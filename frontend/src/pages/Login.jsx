import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async ({ apiKey }) => {
    setLoading(true);
    try {
      await axios.get('/api/v1/health');
      // 验证 key
      await axios.get('/api/v1/balance/summary', { headers: { 'X-Api-Key': apiKey } });
      localStorage.setItem('api_key', apiKey);
      navigate('/');
    } catch (err) {
      message.error('API Key 无效，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>手机号管理系统</Title>
        </div>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: '请输入 API Key' }]}>
            <Input.Password prefix={<KeyOutlined />} placeholder="输入系统 API Key" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
