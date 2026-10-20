import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsers, updateUser } from '../../../api/userApi';
import { useAuth } from '../../../hooks/useAuth';
import HomeFooter from '../../Home/HomeFooter';
import AdminHeader from '../AdminHeader';
import AdminSidebar from '../AdminSidebar';
import '../Admin.css';
import './RoleManage.css';

const USER_TYPE_LABEL = {
  customer: '일반 회원',
  seller: '판매자',
  admin: '관리자',
};

const USER_TYPE_OPTIONS = Object.keys(USER_TYPE_LABEL);

const ROLE_TABS = [
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

function RoleManage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [members, setMembers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTypes, setPendingTypes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (isLoading) return;

    if (!user || !isAdmin) {
      alert('Admin 권한이 필요합니다.');
      navigate(user ? '/' : '/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const loadMembers = async () => {
    setIsFetching(true);
    setError('');

    try {
      const result = await getUsers();
      setMembers(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || '회원 목록을 불러오지 못했습니다.');
      setMembers([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return undefined;

    let cancelled = false;

    const fetchMembers = async () => {
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

    fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

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
      return userId.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [members, activeTab, searchQuery]);

  const handleSelectChange = (memberId, nextType) => {
    setPendingTypes((prev) => ({ ...prev, [memberId]: nextType }));
  };

  const handleApply = async (member) => {
    const nextType = pendingTypes[member._id];
    if (!nextType || nextType === member.user_type) return;

    setSavingId(member._id);
    setError('');

    try {
      const result = await updateUser(member._id, { user_type: nextType });
      setMembers((prev) =>
        prev.map((item) => (item._id === member._id ? result.data : item))
      );
      setPendingTypes((prev) => {
        const next = { ...prev };
        delete next[member._id];
        return next;
      });
      setToast(`${member.name || member.user_id}님의 등급이 변경되었습니다.`);
    } catch (err) {
      setError(err.message || '등급 변경에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

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
          <div className="role-manage__top">
            <div>
              <p className="role-manage__eyebrow">ROLE MANAGEMENT</p>
              <h1 className="role-manage__title">등급/권한 관리</h1>
              <p className="role-manage__desc">
                회원의 등급(권한)을 조회하고 일반 회원·판매자·관리자로 변경할 수 있습니다.
              </p>
            </div>
            <Link to="/admin" className="role-manage__back">
              ← Admin 대시보드
            </Link>
          </div>

          <div className="role-manage__summary">
            <div className="role-manage__summary-card">
              <span>조회 건수</span>
              <strong>{filteredMembers.length}</strong>
            </div>
            <div className="role-manage__summary-card">
              <span>전체 회원</span>
              <strong>{members.length}</strong>
            </div>
            <div className="role-manage__summary-card">
              <span>관리자 수</span>
              <strong>
                {members.filter((item) => item.user_type === 'admin').length}
              </strong>
            </div>
          </div>

          <div className="role-manage__tabs" role="tablist" aria-label="회원 등급">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={
                  activeTab === tab.id ? 'role-manage__tab is-active' : 'role-manage__tab'
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="role-manage__panel">
            <div className="role-manage__toolbar">
              <label className="role-manage__search">
                <span className="visually-hidden">회원 검색</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="아이디, 이름, 이메일 검색"
                />
              </label>
            </div>

            {error && (
              <p className="role-manage__error" role="alert">
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
              <div className="role-manage__table-wrap">
                <table className="role-manage__table">
                  <thead>
                    <tr>
                      <th>가입일시</th>
                      <th>아이디</th>
                      <th>이름</th>
                      <th>이메일</th>
                      <th>현재 등급</th>
                      <th>등급 변경</th>
                      <th>적용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      const selectedType = pendingTypes[member._id] ?? member.user_type;
                      const isDirty = selectedType !== member.user_type;
                      const isSaving = savingId === member._id;
                      const isSelf = member._id === user?._id;

                      return (
                        <tr key={member._id}>
                          <td>{formatDate(member.createdAt)}</td>
                          <td>
                            <span className="role-manage__user-id">{member.user_id}</span>
                          </td>
                          <td>{member.name || '-'}</td>
                          <td>{member.email || '-'}</td>
                          <td>
                            <span
                              className={`role-manage__type role-manage__type--${member.user_type}`}
                            >
                              {USER_TYPE_LABEL[member.user_type] || member.user_type}
                            </span>
                          </td>
                          <td>
                            <select
                              className="role-manage__select"
                              value={selectedType}
                              disabled={isSaving || isSelf}
                              onChange={(e) =>
                                handleSelectChange(member._id, e.target.value)
                              }
                            >
                              {USER_TYPE_OPTIONS.map((type) => (
                                <option key={type} value={type}>
                                  {USER_TYPE_LABEL[type]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="role-manage__apply-btn"
                              disabled={!isDirty || isSaving || isSelf}
                              onClick={() => handleApply(member)}
                              title={isSelf ? '본인 등급은 변경할 수 없습니다.' : undefined}
                            >
                              {isSaving ? '적용 중...' : '적용'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {toast && <div className="role-manage__toast">{toast}</div>}

      <HomeFooter />
    </div>
  );
}

export default RoleManage;
