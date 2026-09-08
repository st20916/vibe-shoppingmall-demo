import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import SignUp from './pages/SignUp/SignUp';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import ProductManage from './pages/Admin/ProductManage/ProductManage';
import OrderManage from './pages/Admin/OrderManage/OrderManage';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Order from './pages/Order/Order';
import OrderSuccess from './pages/Order/OrderSuccess';
import OrderFail from './pages/Order/OrderFail';
import OrderList from './pages/Order/OrderList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order" element={<Order />} />
        <Route path="/order/success" element={<OrderSuccess />} />
        <Route path="/order/fail" element={<OrderFail />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<ProductManage />} />
        <Route path="/admin/orders" element={<OrderManage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
