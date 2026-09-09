import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../../api/categoryApi';
import { useAuth } from '../../../hooks/useAuth';
import HomeFooter from '../../Home/HomeFooter';
import AdminHeader from '../AdminHeader';
import AdminSidebar from '../AdminSidebar';
import '../Admin.css';
import './CategoryManage.css';

const DEFAULT_CATEGORY_NAMES = ['상의', '하의', '악세서리'];

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

const isProtectedCategory = (category) =>
  Boolean(category?.isDefault) || DEFAULT_CATEGORY_NAMES.includes(category?.name);

function CategoryManage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formName, setFormName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !isAdmin) {
      alert('Admin 권한이 필요합니다.');
      navigate(user ? '/' : '/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const loadCategories = async () => {
    setIsFetching(true);
    setError('');

    try {
      const result = await getCategories();
      setCategories(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || '카테고리 목록을 불러오지 못했습니다.');
      setCategories([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return undefined;

    let cancelled = false;

    const fetchCategories = async () => {
      setIsFetching(true);
      setError('');

      try {
        const result = await getCategories();
        if (!cancelled) {
          setCategories(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '카테고리 목록을 불러오지 못했습니다.');
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!deleteTarget) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isDeleting) {
        setDeleteTarget(null);
        setDeleteError('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, isDeleting]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((category) =>
      String(category.name || '')
        .toLowerCase()
        .includes(q)
    );
  }, [categories, searchQuery]);

  const resetForm = () => {
    setFormName('');
    setEditingId(null);
    setError('');
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormName(category.name || '');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = formName.trim();

    if (!name) {
      setError('카테고리명을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        const result = await updateCategory(editingId, { name });
        setCategories((prev) =>
          prev.map((item) => (item._id === editingId ? result.data : item))
        );
      } else {
        const result = await createCategory({ name });
        setCategories((prev) => [result.data, ...prev]);
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err.message || '카테고리 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (category) => {
    if (isProtectedCategory(category)) {
      setError('기본 카테고리(상의, 하의, 악세서리)는 삭제할 수 없습니다.');
      return;
    }
    setDeleteTarget(category);
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteCategory(deleteTarget._id);
      setCategories((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      if (editingId === deleteTarget._id) {
        resetForm();
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || '카테고리 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
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
          <div className="category-manage__top">
            <div>
              <p className="category-manage__eyebrow">CATEGORY MANAGEMENT</p>
              <h1 className="category-manage__title">카테고리 관리</h1>
              <p className="category-manage__desc">
                상품 카테고리를 추가·수정·삭제할 수 있습니다. 기본 카테고리는 삭제할 수 없습니다.
              </p>
            </div>
            <Link to="/admin" className="category-manage__back">
              ← Admin 대시보드
            </Link>
          </div>

          <div className="category-manage__summary">
            <div className="category-manage__summary-card">
              <span>조회 건수</span>
              <strong>{filteredCategories.length}</strong>
            </div>
            <div className="category-manage__summary-card">
              <span>전체 카테고리</span>
              <strong>{categories.length}</strong>
            </div>
            <div className="category-manage__summary-card">
              <span>기본 카테고리</span>
              <strong>{categories.filter((item) => item.isDefault).length}</strong>
            </div>
          </div>

          <section className="category-manage__form-panel">
            <h2 className="category-manage__section-title">
              {editingId ? '카테고리 수정' : '카테고리 추가'}
            </h2>
            <form className="category-manage__form" onSubmit={handleSubmit}>
              <label className="category-manage__field">
                <span>카테고리명</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 아우터"
                  disabled={isSubmitting}
                  maxLength={40}
                />
              </label>
              <div className="category-manage__form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="category-manage__btn category-manage__btn--ghost"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  className="category-manage__btn category-manage__btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중...' : editingId ? '수정하기' : '추가하기'}
                </button>
              </div>
            </form>
          </section>

          <div className="category-manage__panel">
            <div className="category-manage__toolbar">
              <label className="category-manage__search">
                <span className="visually-hidden">카테고리 검색</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="카테고리명 검색"
                />
              </label>
            </div>

            {error && (
              <p className="category-manage__error" role="alert">
                {error}
              </p>
            )}

            {isFetching ? (
              <div className="admin-empty admin-empty--sm">
                <p>카테고리 목록을 불러오는 중...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="admin-empty">
                <p>표시할 카테고리가 없습니다.</p>
              </div>
            ) : (
              <div className="category-manage__table-wrap">
                <table className="category-manage__table">
                  <thead>
                    <tr>
                      <th>카테고리명</th>
                      <th>유형</th>
                      <th>등록일시</th>
                      <th>수정일시</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => {
                      const protectedItem = isProtectedCategory(category);

                      return (
                        <tr key={category._id}>
                          <td>
                            <span className="category-manage__name">{category.name}</span>
                          </td>
                          <td>
                            <span
                              className={
                                protectedItem
                                  ? 'category-manage__badge category-manage__badge--default'
                                  : 'category-manage__badge'
                              }
                            >
                              {protectedItem ? '기본' : '사용자'}
                            </span>
                          </td>
                          <td>{formatDate(category.createdAt)}</td>
                          <td>{formatDate(category.updatedAt)}</td>
                          <td>
                            <div className="category-manage__row-actions">
                              <button
                                type="button"
                                className="category-manage__link-btn"
                                onClick={() => handleEdit(category)}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className="category-manage__link-btn category-manage__link-btn--danger"
                                onClick={() => openDeleteModal(category)}
                                disabled={protectedItem}
                                title={
                                  protectedItem
                                    ? '기본 카테고리는 삭제할 수 없습니다.'
                                    : '카테고리 삭제'
                                }
                              >
                                삭제
                              </button>
                            </div>
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

      {deleteTarget && (
        <div
          className="category-manage__modal-overlay"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="category-manage__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="category-delete-title" className="category-manage__modal-title">
              카테고리 삭제
            </h2>
            <p className="category-manage__modal-desc">
              아래 카테고리를 삭제할까요? 삭제 후에는 복구할 수 없습니다.
            </p>

            <div className="category-manage__modal-info">
              <p className="category-manage__modal-name">{deleteTarget.name}</p>
              <p className="category-manage__modal-meta">사용자 추가 카테고리</p>
            </div>

            {deleteError && (
              <p className="category-manage__error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="category-manage__modal-actions">
              <button
                type="button"
                className="category-manage__btn category-manage__btn--ghost"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                type="button"
                className="category-manage__btn category-manage__btn--danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <HomeFooter />
    </div>
  );
}

export default CategoryManage;
