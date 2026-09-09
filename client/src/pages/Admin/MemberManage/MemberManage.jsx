import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsers } from '../../../api/userApi';
import { useAuth } from '../../../hooks/useAuth';
import HomeFooter from '../../Home/HomeFooter';
import AdminHeader from '../AdminHeader';
import AdminSidebar from '../AdminSidebar';
import '../Admin.css';
import './MemberManage.css';

const USER_TYPE_LABEL = {
  customer: '일반 회원',
  seller: '판매자',
  admin: '관리자',
};

const USER_TYPE_OPTIONS = Object.keys(USER_TYPE_LABEL);

const MEMBER_TABS = [
  { id: 'all', label: '전체' },
  ...USER_TYPE_OPTIONS.map((id) => ({ id, label: USER_TYPE_LABEL[id] })),
];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function MemberManage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [members, setMembers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLoading) return;

    if (!user || !isAdmin) {
      alert('Admin 권한이 필요합니다.');
      navigate(user ? '/' : '/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return undefined;

    let cancelled = false;

    const loadMembers = async () => {
      setIsFetching(true);
      setError('');

      try {
        const result = await getUsers();
        if (!cancelled) {
          setMembers(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '회원 목록을 불러오지 못했습니다.');
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const filteredMembers = useMemo(() => {
    const byType =
      activeTab === 'all'
        ? members
        : members.filter((member) => member.user_type === activeTab);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return byType;

    return byType.filter((member) => {
      const userId = String(member.user_id || '').toLowerCase();
      const name = String(member.name || '').toLowerCase();
      const email = String(member.email || '').toLowerCase();
      const address = String(member.address || '').toLowerCase();
      return (
        userId.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        address.includes(q)
      );
    });
  }, [members, activeTab, searchQuery]);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="admin-page admin-page--loading">
        <p>권한을 확인하는 중...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminHeader
        user={user}
        onLogout={() => {
          logout();
          alert('로그아웃 되었습니다.');
          navigate('/', { replace: true });
        }}
      />

      <div className="admin-layout">
        <AdminSidebar />

        <main className="admin-main">
          <div className="member-manage__top">
            <div>
              <p className="member-manage__eyebrow">MEMBER MANAGEMENT</p>
              <h1 className="member-manage__title">회원 목록</h1>
              <p className="member-manage__desc">
                가입된 회원을 조회하고 유형·검색으로 필터링할 수 있습니다.
              </p>
            </div>
            <Link to="/admin" className="member-manage__back">
              ← Admin 대시보드
            </Link>
          </div>

          <div className="member-manage__summary">
            <div className="member-manage__summary-card">
              <span>조회 건수</span>
              <strong>{filteredMembers.length}</strong>
            </div>
            <div className="member-manage__summary-card">
              <span>전체 회원</span>
              <strong>{members.length}</strong>
            </div>
            <div className="member-manage__summary-card">
              <span>현재 필터</span>
              <strong>
                {activeTab === 'all' ? '전체' : USER_TYPE_LABEL[activeTab] || activeTab}
              </strong>
            </div>
          </div>

          <div className="member-manage__tabs" role="tablist" aria-label="회원 유형">
            {MEMBER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={
                  activeTab === tab.id
                    ? 'member-manage__tab is-active'
                    : 'member-manage__tab'
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="member-manage__panel">
            <div className="member-manage__toolbar">
              <label className="member-manage__search">
                <span className="visually-hidden">회원 검색</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="아이디, 이름, 이메일, 주소 검색"
                />
              </label>
            </div>

            {error && (
              <p className="member-manage__error" role="alert">
                {error}
              </p>
            )}

            {isFetching ? (
              <div className="admin-empty admin-empty--sm">
                <p>회원 목록을 불러오는 중...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="admin-empty">
                <p>표시할 회원이 없습니다.</p>
              </div>
            ) : (
              <div className="member-manage__table-wrap">
                <table className="member-manage__table">
                  <thead>
                    <tr>
                      <th>가입일시</th>
                      <th>아이디</th>
                      <th>이름</th>
                      <th>이메일</th>
                      <th>회원 유형</th>
                      <th>주소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member._id}>
                        <td>{formatDate(member.createdAt)}</td>
                        <td>
                          <span className="member-manage__user-id">{member.user_id}</span>
                        </td>
                        <td>{member.name || '-'}</td>
                        <td>{member.email || '-'}</td>
                        <td>
                          <span
                            className={`member-manage__type member-manage__type--${member.user_type}`}
                          >
                            {USER_TYPE_LABEL[member.user_type] || member.user_type}
                          </span>
                        </td>
                        <td className="member-manage__address">
                          {member.address?.trim() ? member.address : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}

export default MemberManage;
