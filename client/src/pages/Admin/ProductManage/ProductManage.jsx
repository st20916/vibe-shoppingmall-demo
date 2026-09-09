import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../../../api/productApi';
import { getCategories } from '../../../api/categoryApi';
import { useAuth } from '../../../hooks/useAuth';
import { openCloudinaryUploadWidget } from '../../../utils/cloudinary';
import AdminHeader from '../AdminHeader';
import AdminSidebar from '../AdminSidebar';
import HomeFooter from '../../Home/HomeFooter';
import '../Admin.css';
import './ProductManage.css';

const INITIAL_FORM = {
  product_id: '',
  name: '',
  price: '',
  category: '',
  image: '',
  description: '',
};

const PAGE_SIZE = 10;

const INITIAL_PAGINATION = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const toFormValues = (product) => ({
  product_id: product.product_id || '',
  name: product.name || '',
  price: product.price === undefined || product.price === null ? '' : String(product.price),
  category: product.category || '',
  image: product.image || '',
  description: product.description || '',
});

function ProductManage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin, isLoading, logout } = useAuth();

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'list';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingId, setEditingId] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageMeta, setImageMeta] = useState({ publicId: '', originalFilename: '' });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isEditing = Boolean(editingId);
  const isFormTab = activeTab === 'register' || activeTab === 'edit';

  useEffect(() => {
    if (isLoading) return;

    if (!user || !isAdmin) {
      alert('Admin 권한이 필요합니다.');
      navigate(user ? '/' : '/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchProducts = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await getProducts({
        page,
        limit: PAGE_SIZE,
        category: categoryFilter === '전체' ? undefined : categoryFilter,
        q: appliedQuery || undefined,
      });
      setProducts(result.data || []);
      setPagination(result.pagination || { ...INITIAL_PAGINATION, page });
      setError('');
    } catch (err) {
      setError(err.message || '상품 목록을 불러오지 못했습니다.');
    } finally {
      setIsFetching(false);
    }
  }, [page, categoryFilter, appliedQuery]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchProducts();
  }, [user, isAdmin, fetchProducts]);

  useEffect(() => {
    if (!user || !isAdmin) return undefined;

    let cancelled = false;

    const loadCategories = async () => {
      try {
        const result = await getCategories();
        if (cancelled) return;

        const names = (Array.isArray(result.data) ? result.data : [])
          .map((item) => item.name)
          .filter(Boolean);

        setCategories(names);
        setForm((prev) => {
          if (prev.category && names.includes(prev.category)) return prev;
          return { ...prev, category: names[0] || '' };
        });
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const resetFormState = () => {
    setForm({
      ...INITIAL_FORM,
      category: categories[0] || '',
    });
    setImageMeta({ publicId: '', originalFilename: '' });
    setEditingId(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');

    if (tab === 'list') {
      setSearchParams({});
      return;
    }

    if (tab === 'register') {
      resetFormState();
      setSearchParams({ tab: 'register' });
      return;
    }

    setSearchParams({ tab: 'edit' });
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm(toFormValues(product));
    setImageMeta({ publicId: '', originalFilename: '' });
    setError('');
    setActiveTab('edit');
    setSearchParams({ tab: 'edit' });
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(searchQuery.trim());
  };

  const handleCategoryChange = (event) => {
    setPage(1);
    setCategoryFilter(event.target.value);
  };

  const handleOpenCloudinary = async () => {
    setError('');
    setIsUploadingImage(true);

    try {
      await openCloudinaryUploadWidget({
        onSuccess: (info) => {
          setForm((prev) => ({ ...prev, image: info.secure_url }));
          setImageMeta({
            publicId: info.public_id || '',
            originalFilename: info.original_filename || '',
          });
          setError('');
        },
        onError: () => {
          setError('Cloudinary 이미지 업로드에 실패했습니다.');
        },
      });
    } catch (err) {
      setError(err.message || 'Cloudinary 위젯을 열 수 없습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClearImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setImageMeta({ publicId: '', originalFilename: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.product_id.trim()) return setError('상품 아이디를 입력해주세요.');
    if (!form.name.trim()) return setError('상품 이름을 입력해주세요.');
    if (form.price === '' || Number(form.price) < 0) {
      return setError('상품 가격을 올바르게 입력해주세요.');
    }
    if (!form.category) return setError('상품 카테고리를 선택해주세요.');
    if (!form.image.trim()) return setError('Cloudinary로 상품 이미지를 업로드해주세요.');

    const payload = {
      product_id: form.product_id.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      image: form.image.trim(),
      description: form.description.trim() || undefined,
    };

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateProduct(editingId, payload);
        alert('상품이 수정되었습니다.');
        resetFormState();
        await fetchProducts();
        handleTabChange('list');
      } else {
        await createProduct(payload);
        alert('상품이 등록되었습니다.');
        resetFormState();
        handleTabChange('list');
        if (page === 1) {
          await fetchProducts();
        } else {
          setPage(1);
        }
      }
    } catch (err) {
      setError(
        err.message || (isEditing ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (product, event) => {
    event?.stopPropagation();
    setDeleteError('');
    setDeleteTarget(product);
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
      await deleteProduct(deleteTarget._id, {
        confirm: true,
        product_id: deleteTarget.product_id,
      });

      const deletedId = deleteTarget._id;
      setDeleteTarget(null);
      alert('상품이 삭제되었습니다.');

      if (editingId === deletedId) {
        resetFormState();
        handleTabChange('list');
      }

      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      setDeleteError(err.message || '상품 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!deleteTarget) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!isDeleting) {
          setDeleteTarget(null);
          setDeleteError('');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, isDeleting]);

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
          <div className="product-manage__top">
            <div>
              <h1 className="product-manage__title">상품 관리</h1>
              <p className="product-manage__desc">
                상품을 등록·수정하고 목록을 관리합니다. 목록에서 상품을 클릭하면 수정할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              className="product-manage__primary-btn"
              onClick={() => handleTabChange('register')}
            >
              새 상품 등록하기
            </button>
          </div>

          <div className="product-manage__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'list'}
              className={`product-manage__tab${activeTab === 'list' ? ' is-active' : ''}`}
              onClick={() => handleTabChange('list')}
            >
              상품 목록
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              className={`product-manage__tab${activeTab === 'register' ? ' is-active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              상품 등록
            </button>
            {isEditing && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'edit'}
                className={`product-manage__tab${activeTab === 'edit' ? ' is-active' : ''}`}
                onClick={() => handleTabChange('edit')}
              >
                상품 수정
              </button>
            )}
          </div>

          {activeTab === 'list' && (
            <section className="product-manage__panel">
              <div className="product-manage__toolbar">
                <form className="product-manage__search" onSubmit={handleSearchSubmit}>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="상품명 또는 상품 아이디 검색"
                    aria-label="상품 검색"
                  />
                  <button type="submit" aria-label="검색">
                    ⌕
                  </button>
                </form>

                <div className="product-manage__filters">
                  <label htmlFor="category-filter">카테고리</label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={handleCategoryChange}
                  >
                    <option value="전체">전체</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="product-manage__error">{error}</p>}

              {isFetching ? (
                <div className="admin-empty">
                  <p>상품 목록을 불러오는 중...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="admin-empty">
                  <p>등록된 상품이 없습니다.</p>
                  <button type="button" onClick={() => handleTabChange('register')}>
                    상품 등록하기
                  </button>
                </div>
              ) : (
                <>
                  <div className="product-manage__table-wrap">
                    <table className="product-manage__table">
                      <thead>
                        <tr>
                          <th>이미지</th>
                          <th>상품 아이디</th>
                          <th>상품명</th>
                          <th>카테고리</th>
                          <th>가격</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr
                            key={product._id}
                            className="product-manage__row"
                            onClick={() => handleEdit(product)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleEdit(product);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`${product.name} 수정`}
                          >
                            <td>
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="product-manage__thumb-img"
                                />
                              ) : (
                                <div className="product-manage__thumb" aria-hidden="true" />
                              )}
                            </td>
                            <td>{product.product_id}</td>
                            <td>
                              <div className="product-manage__name">{product.name}</div>
                              {product.description && (
                                <div className="product-manage__desc-text">
                                  {product.description}
                                </div>
                              )}
                            </td>
                            <td>{product.category}</td>
                            <td>{Number(product.price).toLocaleString()}원</td>
                            <td>
                              <button
                                type="button"
                                className="product-manage__delete-btn"
                                onClick={(event) => openDeleteModal(product, event)}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="product-manage__pagination">
                    <p className="product-manage__pagination-info">
                      총 {pagination.total}개 · {pagination.page}/{pagination.totalPages} 페이지
                    </p>
                    <div className="product-manage__pagination-actions">
                      <button
                        type="button"
                        className="product-manage__secondary-btn"
                        disabled={!pagination.hasPrevPage || isFetching}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      >
                        이전
                      </button>
                      <button
                        type="button"
                        className="product-manage__secondary-btn"
                        disabled={!pagination.hasNextPage || isFetching}
                        onClick={() => setPage((prev) => prev + 1)}
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {isFormTab && (
            <section className="product-manage__panel">
              <h2 className="product-manage__form-title">
                {isEditing ? '상품 수정' : '상품 등록'}
              </h2>
              <form className="product-manage__form" onSubmit={handleSubmit}>
                <div className="product-manage__form-grid">
                  <label>
                    상품 아이디 *
                    <input
                      type="text"
                      value={form.product_id}
                      onChange={handleChange('product_id')}
                      placeholder="예: top001"
                    />
                  </label>
                  <label>
                    상품 이름 *
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder="예: 베이직 셔츠"
                    />
                  </label>
                  <label>
                    상품 가격 *
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={handleChange('price')}
                      placeholder="예: 39000"
                    />
                  </label>
                  <label>
                    상품 카테고리 *
                    <select value={form.category} onChange={handleChange('category')}>
                      {categories.length === 0 ? (
                        <option value="">카테고리를 불러오는 중...</option>
                      ) : (
                        categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <div className="product-manage__full product-manage__image-field">
                    <span className="product-manage__label">상품 이미지 *</span>
                    <div className="product-manage__image-actions">
                      <button
                        type="button"
                        className="product-manage__file-btn"
                        onClick={handleOpenCloudinary}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? '위젯 준비 중...' : 'Cloudinary로 업로드'}
                      </button>
                      {form.image && (
                        <button
                          type="button"
                          className="product-manage__secondary-btn product-manage__clear-image"
                          onClick={handleClearImage}
                        >
                          이미지 제거
                        </button>
                      )}
                    </div>
                    {imageMeta.originalFilename && (
                      <p className="product-manage__file-name">
                        업로드됨: {imageMeta.originalFilename}
                        {imageMeta.publicId ? ` (${imageMeta.publicId})` : ''}
                      </p>
                    )}
                    {form.image && (
                      <p className="product-manage__file-name product-manage__file-url">
                        URL: {form.image}
                      </p>
                    )}
                  </div>
                  <label className="product-manage__full">
                    상품 설명
                    <textarea
                      rows="4"
                      value={form.description}
                      onChange={handleChange('description')}
                      placeholder="상품 설명을 입력하세요 (선택)"
                    />
                  </label>
                </div>

                <div className="product-manage__preview">
                  <p>이미지 미리보기</p>
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="상품 미리보기"
                      className="product-manage__preview-img"
                    />
                  ) : (
                    <div className="product-manage__preview-box" aria-hidden="true" />
                  )}
                </div>

                {error && <p className="product-manage__error">{error}</p>}

                <div className="product-manage__form-actions">
                  <button
                    type="button"
                    className="product-manage__secondary-btn"
                    onClick={() => handleTabChange('list')}
                  >
                    목록으로
                  </button>
                  <button
                    type="submit"
                    className="product-manage__primary-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? isEditing
                        ? '수정 중...'
                        : '등록 중...'
                      : isEditing
                        ? '상품 수정'
                        : '상품 등록'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <div className="product-manage__back">
            <Link to="/admin">← Admin 대시보드로</Link>
          </div>
        </main>
      </div>

      {deleteTarget && (
        <div
          className="product-manage__modal-overlay"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="product-manage__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="product-delete-title" className="product-manage__modal-title">
              상품 삭제
            </h2>
            <p className="product-manage__modal-desc">
              아래 상품을 삭제할까요? 삭제 후에는 복구할 수 없습니다.
            </p>

            <div className="product-manage__modal-product">
              {deleteTarget.image ? (
                <img
                  src={deleteTarget.image}
                  alt={deleteTarget.name}
                  className="product-manage__modal-thumb"
                />
              ) : (
                <div className="product-manage__modal-thumb product-manage__modal-thumb--empty" />
              )}
              <div>
                <p className="product-manage__modal-id">{deleteTarget.product_id}</p>
                <p className="product-manage__modal-name">{deleteTarget.name}</p>
                <p className="product-manage__modal-meta">
                  {deleteTarget.category} · {Number(deleteTarget.price).toLocaleString()}원
                </p>
              </div>
            </div>

            {deleteError && <p className="product-manage__error">{deleteError}</p>}

            <div className="product-manage__modal-actions">
              <button
                type="button"
                className="product-manage__secondary-btn"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                type="button"
                className="product-manage__danger-btn"
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

export default ProductManage;
