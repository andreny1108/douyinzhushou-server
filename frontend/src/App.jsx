import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import {
  PhoneOutlined, DashboardOutlined, UnorderedListOutlined,
  SettingOutlined, HistoryOutlined, LogoutOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PhoneList from './pages/PhoneList';
import RechargeRules from './pages/RechargeRules';
import Logs from './pages/Logs';

const { Header, Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/phones', icon: <PhoneOutlined />, label: '手机号管理' },
  { key: '/rules', icon: <UnorderedListOutlined />, label: '充值规则' },
  { key: '/logs', icon: <HistoryOutlined />, label: '操作日志' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

function PrivateLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const handleMenuClick = ({ key }) => navigate(key);
  const logout = () => { localStorage.removeItem('api_key'); navigate('/login'); };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
          手机号管理系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: token.colorBgContainer, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button type="text" icon={<LogoutOutlined />} onClick={logout}>退出</Button>
        </Header>
        <Content style={{ margin: 24, background: token.colorBgContainer, borderRadius: 8, padding: 24, minHeight: 360 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

function RequireAuth({ children }) {
  const key = localStorage.getItem('api_key');
  if (!key) return <Navigate to="/login" replace />;
  return <PrivateLayout>{children}</PrivateLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/phones" element={<RequireAuth><PhoneList /></RequireAuth>} />
      <Route path="/rules" element={<RequireAuth><RechargeRules /></RequireAuth>} />
      <Route path="/logs" element={<RequireAuth><Logs /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
