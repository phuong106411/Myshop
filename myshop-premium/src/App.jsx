import { useMemo, useState } from "react";

import {
  NavLink,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { initialAccounts, initialOrders, initialProducts } from "./data";

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

function useStore() {
  const [products, setProducts] = useState(() => read("ms_products", initialProducts));
  const [accounts, setAccounts] = useState(() => read("ms_accounts", initialAccounts));
  const [orders, setOrders] = useState(() => read("ms_orders", initialOrders));
  const [user, setUser] = useState(() => read("ms_user", null));
  const [cart, setCart] = useState(() => read("ms_cart", []));

  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const login = (email, password) => {
    const account = accounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (!account) return false;
    setUser(account);
    save("ms_user", account);
    return account;
  };

  const register = (payload) => {
    if (accounts.some((a) => a.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, message: "Email đã được sử dụng." };
    }
    const account = {
      id: `user-${Date.now()}`,
      ...payload,
      role: "user",
    };
    const next = [...accounts, account];
    setAccounts(next);
    save("ms_accounts", next);
    setUser(account);
    save("ms_user", account);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ms_user");
  };

 const addToCart = (product) => {
  const selectedSize = product.selectedSize || "";

  const existing = cart.find(
    (item) =>
      item.id === product.id &&
      item.selectedSize === selectedSize
  );

  const next = existing
    ? cart.map((item) =>
        item.id === product.id &&
        item.selectedSize === selectedSize
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    : [
        ...cart,
        {
          ...product,
          quantity: 1,
          selectedSize,
        },
      ];

  setCart(next);
  save("ms_cart", next);
};

  const updateCart = (id, quantity) => {
    const next = quantity <= 0
      ? cart.filter((item) => item.id !== id)
      : cart.map((item) => item.id === id ? { ...item, quantity } : item);
    setCart(next);
    save("ms_cart", next);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("ms_cart");
  };

  const placeOrder = (shipping, paymentMethod) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const order = {
    id: `MS-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: shipping.name,
    phone: shipping.phone,
    address: shipping.address,
    note: shipping.note,

    items: cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    ),

    subtotal,
    shippingFee,
    total,

    paymentMethod,
    paymentStatus:
      paymentMethod === "bank"
        ? "Chờ thanh toán"
        : "Chưa thanh toán",

    status:
      paymentMethod === "bank"
        ? "Chờ thanh toán"
        : "Đang xử lý",

    date: new Date().toLocaleDateString("vi-VN"),
  };

  const nextOrders = [order, ...orders];

  setOrders(nextOrders);
  save("ms_orders", nextOrders);

  clearCart();

  return order;
};

  const addProduct = (product) => {
    const next = [{ ...product, id: Date.now(), rating: 5, sold: 0 }, ...products];
    setProducts(next);
    save("ms_products", next);
  };

  const deleteProduct = (id) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    save("ms_products", next);
  };

  return {
    products, accounts, orders, user, cart,
    login, register, logout, addToCart, updateCart, clearCart,
    placeOrder, addProduct, deleteProduct,
  };
}

function Protected({ user, role, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Logo({ dark = false }) {
  return <Link className={`logo ${dark ? "logo-dark" : ""}`} to="/">My<span>Shop</span></Link>;
}

function UserLayout({ user, logout, cartCount }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Logo />
        <nav className="site-nav">
          <NavLink end to="/">Trang chủ</NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
          <NavLink to="/sale">Đang sale</NavLink>
          <NavLink to="/about">Giới thiệu</NavLink>
        </nav>
        <div className="header-actions">
          <Link className="cart-pill" to="/cart">
            <span>Giỏ hàng</span>
            <b>{cartCount}</b>
          </Link>
          {user ? (
            <>
              <span className="hello">Xin chào, <strong>{user.name}</strong></span>
              {user.role === "admin" ? (
                <Link className="outline-btn" to="/admin">Quản trị</Link>
              ) : (
                <Link className="outline-btn" to="/account">Tài khoản</Link>
              )}
              <button className="text-btn" onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link className="outline-btn" to="/login">Đăng nhập</Link>
              <Link className="dark-btn small" to="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div>
          <Logo />
          <p>Minimal essentials cho phong cách sống hiện đại.</p>
        </div>
        <div>
          <h4>Khám phá</h4>
          <Link to="/products">Sản phẩm</Link>
          <Link to="/sale">Ưu đãi</Link>
          <Link to="/about">Về MyShop</Link>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <span>support@myshop.com</span>
          <span>0123 456 789</span>
        </div>
        <div>
          <h4>Thanh toán</h4>
          <span>COD · Banking · Momo</span>
          <span>Đổi trả trong 7 ngày</span>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate("/checkout");
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        <img src={product.image} alt={product.name} />

        <span className="product-badge">
          {product.badge}
        </span>

        <button
          type="button"
          className="quick-add"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCart();
          }}
        >
          +
        </button>
      </Link>

      <div className="product-info">
        <div className="product-meta">
          <span>{product.category}</span>
          <span>★ {product.rating}</span>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="product-name"
        >
          {product.name}
        </Link>

        <div className="price-row">
          <strong>{money(product.price)}</strong>
          <del>{money(product.oldPrice)}</del>
        </div>

        <div className="product-actions">
          <button
            type="button"
            className="add-btn"
            onClick={handleAddToCart}
          >
            🛒 Thêm vào giỏ
          </button>

          <button
            type="button"
            className="buy-now-btn"
            onClick={handleBuyNow}
          >
            Mua ngay
          </button>
        </div>
      </div>
    </article>
  );
}

function Home({ products, addToCart }) {
  const featured = products.slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">NEW COLLECTION · 2026</span>
          <h1>Simple things.<br /><em>Better made.</em></h1>
          <p>Những món đồ tối giản được tuyển chọn cho nhịp sống hiện đại — tinh tế, dễ phối và dùng lâu.</p>
          <div className="hero-actions">
            <Link className="dark-btn" to="/products">Khám phá sản phẩm <span>↗</span></Link>
            <Link className="link-btn" to="/sale">Xem ưu đãi</Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=90" alt="New collection" />
          <div className="hero-float">
            <span>CURATED</span>
            <strong>08 essentials</strong>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div><strong>01</strong><span>Chất lượng tuyển chọn</span></div>
        <div><strong>02</strong><span>Giao hàng toàn quốc</span></div>
        <div><strong>03</strong><span>Đổi trả 7 ngày</span></div>
        <div><strong>04</strong><span>Hỗ trợ tận tâm</span></div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><span className="eyebrow">CURATED FOR YOU</span><h2>Sản phẩm nổi bật</h2></div>
          <Link className="link-btn" to="/products">Xem tất cả ↗</Link>
        </div>
        <div className="product-grid">{featured.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}</div>
      </section>

      <section className="editorial">
        <div>
          <span className="eyebrow">THE MYSHOP EDIT</span>
          <h2>Ít hơn, nhưng<br /><em>tốt hơn.</em></h2>
          <p>Chúng tôi tin một tủ đồ đẹp không cần quá nhiều món. Chỉ cần đúng chất liệu, đúng phom dáng và đúng cá tính.</p>
          <Link className="dark-btn" to="/about">Câu chuyện MyShop ↗</Link>
        </div>
        <img src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=90" alt="MyShop edit" />
      </section>
    </>
  );
}

function ProductsPage({ products, addToCart, saleOnly = false }) {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const categories = ["Tất cả", ...new Set(products.map((p) => p.category))];
  const filtered = products.filter((p) =>
    (category === "Tất cả" || p.category === category) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase())) &&
    (!saleOnly || p.oldPrice > p.price)
  );

  return (
    <section className="catalog section">
      <div className="catalog-head">
        <div>
          <span className="eyebrow">{saleOnly ? "SPECIAL OFFERS" : "ALL PRODUCTS"}</span>
          <h1>{saleOnly ? "Đang sale" : "Tất cả sản phẩm"}</h1>
          <p>{filtered.length} sản phẩm được tuyển chọn.</p>
        </div>
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm..." />
      </div>
      <div className="filter-row">
        {categories.map((c) => <button key={c} className={category === c ? "filter active" : "filter"} onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      <div className="product-grid">{filtered.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}</div>
    </section>
  );
}

function ProductDetail({ products, addToCart }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const id = Number(pathname.split("/").pop());
  const product = products.find((p) => p.id === id);

  const [selectedSize, setSelectedSize] = useState("M");

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const sizes = ["S", "M", "L", "XL"];

  const handleAddToCart = () => {
    addToCart({
      ...product,
      selectedSize,
    });
  };

  const handleBuyNow = () => {
    addToCart({
      ...product,
      selectedSize,
    });

    navigate("/checkout");
  };

  return (
    <section className="detail section">
      <div className="detail-image">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="detail-copy">
        <span className="eyebrow">
          {product.category} · {product.badge}
        </span>

        <h1>{product.name}</h1>

        <div className="detail-rating">
          ★★★★★
          <span>
            {product.rating} · {product.sold} đã bán
          </span>
        </div>

        <div className="detail-price">
          {money(product.price)}
          <del>{money(product.oldPrice)}</del>
        </div>

        <p>{product.description}</p>

        <div className="size-selector">
          <div className="size-title">
            <span>Kích thước</span>
            <strong>Đã chọn: {selectedSize}</strong>
          </div>

          <div className="size-row">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={
                  selectedSize === size
                    ? "selected"
                    : ""
                }
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="outline-btn wide"
            onClick={handleAddToCart}
          >
            🛒 Thêm vào giỏ hàng
          </button>

          <button
            type="button"
            className="dark-btn wide"
            onClick={handleBuyNow}
          >
            Mua ngay →
          </button>
        </div>

        <div className="detail-benefits">
          <span>✓ Miễn phí vận chuyển từ 500K</span>
          <span>✓ Đổi trả trong 7 ngày</span>
          <span>✓ Kiểm tra hàng khi nhận</span>
        </div>
      </div>
    </section>
  );
}

function CartPage({ cart, updateCart }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <section className="section cart-page">
      <div className="section-head"><div><span className="eyebrow">YOUR BAG</span><h1>Giỏ hàng</h1></div><span>{cart.length} sản phẩm</span></div>
      {cart.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">○</div><h2>Giỏ hàng đang trống</h2><p>Thêm vài món bạn yêu thích để bắt đầu.</p><Link className="dark-btn" to="/products">Khám phá sản phẩm</Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-copy"><span>{item.category}</span><h3>{item.name}</h3><strong>{money(item.price)}</strong></div>
                <div className="qty"><button onClick={() => updateCart(item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button onClick={() => updateCart(item.id, item.quantity + 1)}>+</button></div>
                <button className="remove" onClick={() => updateCart(item.id, 0)}>×</button>
              </div>
            ))}
          </div>
          <aside className="summary">
            <span className="eyebrow">ORDER SUMMARY</span>
            <div><span>Tạm tính</span><strong>{money(total)}</strong></div>
            <div><span>Vận chuyển</span><strong>{total >= 500000 ? "Miễn phí" : money(30000)}</strong></div>
            <hr />
            <div className="summary-total"><span>Tổng cộng</span><strong>{money(total + (total >= 500000 ? 0 : 30000))}</strong></div>
            <Link className="dark-btn wide" to="/checkout">Thanh toán →</Link>
          </aside>
        </div>
      )}
    </section>
  );
}

function Checkout({ cart, user, placeOrder }) {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    note: "",
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  if (!cart.length) {
    return <Navigate to="/cart" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.address) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng.");
      return;
    }

    const order = placeOrder(form, paymentMethod);

    navigate("/order-success", {
  state: {
    order,
  },
});
  };

  const transferContent = `MYSHOP ${form.phone || "DONHANG"}`;

  const qrUrl =
    `https://img.vietqr.io/image/MB-0123456789-compact2.png` +
    `?amount=${total}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent("MYSHOP DEMO")}`;

  return (
    <section className="section checkout">
      <div className="checkout-copy">
        <span className="eyebrow">CHECKOUT</span>

        <h1>Thanh toán</h1>

        <p>
          Kiểm tra thông tin đơn hàng và lựa chọn phương thức
          thanh toán.
        </p>
      </div>

      <div className="checkout-layout">

        {/* ================= THÔNG TIN ================= */}

        <form
          className="form-card"
          onSubmit={handleSubmit}
        >
          <h2>Thông tin nhận hàng</h2>

          <label>
            Họ và tên

            <input
              type="text"
              value={form.name}
              placeholder="Nhập họ và tên"
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Số điện thoại

            <input
              type="tel"
              value={form.phone}
              placeholder="Nhập số điện thoại"
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Địa chỉ nhận hàng

            <input
              type="text"
              value={form.address}
              placeholder="Nhập địa chỉ nhận hàng"
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Ghi chú

            <textarea
              value={form.note}
              placeholder="Ghi chú cho đơn hàng..."
              onChange={(e) =>
                setForm({
                  ...form,
                  note: e.target.value,
                })
              }
            />
          </label>

          {/* ================= THANH TOÁN ================= */}

          <div className="payment-section">

            <span className="eyebrow">
              PAYMENT
            </span>

            <h2>Phương thức thanh toán</h2>

            {/* COD */}

            <label
              className={`payment-option ${
                paymentMethod === "cod"
                  ? "selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() =>
                  setPaymentMethod("cod")
                }
              />

              <div>
                <strong>
                  💵 Thanh toán khi nhận hàng
                </strong>

                <p>
                  Thanh toán tiền mặt khi nhận được
                  sản phẩm.
                </p>
              </div>
            </label>

            {/* BANK */}

            <label
              className={`payment-option ${
                paymentMethod === "bank"
                  ? "selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="bank"
                checked={paymentMethod === "bank"}
                onChange={() =>
                  setPaymentMethod("bank")
                }
              />

              <div>
                <strong>
                  🏦 Chuyển khoản ngân hàng
                </strong>

                <p>
                  Quét mã QR hoặc chuyển khoản
                  theo thông tin bên dưới.
                </p>
              </div>
            </label>

            {/* ================= QR ================= */}

            {paymentMethod === "bank" && (
              <div className="bank-payment">

                <div className="bank-info">

                  <span>
                    THÔNG TIN CHUYỂN KHOẢN
                  </span>

                  <h3>MB BANK</h3>

                  <p>
                    <b>Số tài khoản:</b>
                    <br />
                    0123456789
                  </p>

                  <p>
                    <b>Chủ tài khoản:</b>
                    <br />
                    MYSHOP DEMO
                  </p>

                  <p>
                    <b>Số tiền:</b>
                    <br />
                    {money(total)}
                  </p>

                  <p>
                    <b>Nội dung chuyển khoản:</b>
                    <br />
                    {transferContent}
                  </p>

                  <div className="payment-warning">
                    Đây là thông tin tài khoản DEMO.
                    Website hiện chưa kết nối ngân hàng
                    hoặc cổng thanh toán thật.
                  </div>

                </div>

                <div className="qr-box">

                  <img
                    src={qrUrl}
                    alt="QR thanh toán"
                  />

                  <strong>
                    Quét mã QR để thanh toán
                  </strong>

                </div>

              </div>
            )}

          </div>

          <button
            type="submit"
            className="dark-btn wide"
          >
            {paymentMethod === "bank"
              ? "Xác nhận thanh toán"
              : "Đặt hàng"}{" "}
            · {money(total)}
          </button>

        </form>

        {/* ================= ĐƠN HÀNG ================= */}

        <aside className="summary">

          <span className="eyebrow">
            YOUR ORDER
          </span>

          <h2>Đơn hàng</h2>

          {cart.map((item) => (
            <div
              className="mini-line"
              key={item.id}
            >
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong>
                {money(
                  item.price * item.quantity
                )}
              </strong>
            </div>
          ))}

          <hr />

          <div className="mini-line">
            <span>Tạm tính</span>

            <strong>
              {money(subtotal)}
            </strong>
          </div>

          <div className="mini-line">
            <span>Phí vận chuyển</span>

            <strong>
              {shippingFee === 0
                ? "Miễn phí"
                : money(shippingFee)}
            </strong>
          </div>

          <div className="summary-total">

            <span>
              Tổng thanh toán
            </span>

            <strong>
              {money(total)}
            </strong>

          </div>

        </aside>

      </div>
    </section>
  );
}
function About() {
  return <section className="about-page section"><span className="eyebrow">ABOUT MYSHOP</span><h1>Thiết kế tốt<br /><em>cho đời sống thật.</em></h1><p className="lead">MyShop là một cửa hàng frontend demo tập trung vào trải nghiệm mua sắm tối giản, hiện đại và dễ sử dụng.</p><div className="about-grid"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=90" alt="Store" /><div><h2>Less noise.<br />More character.</h2><p>Từ cách trình bày sản phẩm đến thanh toán, mọi chi tiết được thiết kế theo tinh thần xám trắng, khoảng thở lớn và typography rõ ràng.</p><p>Đây là dự án frontend React.js, dữ liệu được lưu trên localStorage để bạn có thể demo các luồng user và admin mà không cần backend.</p></div></div></section>;
}

function Account({ user, orders }) {
  const mine = orders.filter((o) => o.customer === user.name);
  return <section className="section account"><span className="eyebrow">MY ACCOUNT</span><h1>Xin chào, {user.name}</h1><div className="account-grid"><div className="account-card"><span>Họ tên</span><strong>{user.name}</strong><span>Email</span><strong>{user.email}</strong><span>Vai trò</span><strong>Khách hàng</strong></div><div className="account-card"><span>Đơn hàng gần đây</span>{mine.length ? mine.map((o) => <div className="order-mini" key={o.id}><strong>{o.id}</strong><span>{o.status}</span><b>{money(o.total)}</b></div>) : <p>Chưa có đơn hàng.</p>}</div></div></section>;
}

function Success() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <section className="success section">
      <div className="success-mark">✓</div>

      <span className="eyebrow">
        ORDER CONFIRMED
      </span>

      <h1>
        Đặt hàng thành công!
      </h1>

      <p>
        Cảm ơn bạn đã mua hàng tại MyShop.
      </p>

      {order && (
        <div className="success-order">
          <p>
            <span>Mã đơn hàng</span>
            <strong>{order.id}</strong>
          </p>

          <p>
            <span>Tổng thanh toán</span>
            <strong>{money(order.total)}</strong>
          </p>

          <p>
            <span>Phương thức</span>

            <strong>
              {order.paymentMethod === "bank"
                ? "Chuyển khoản ngân hàng"
                : "Thanh toán khi nhận hàng"}
            </strong>
          </p>

          <p>
            <span>Trạng thái</span>

            <strong>
              {order.paymentStatus}
            </strong>
          </p>
        </div>
      )}

      <Link
        to="/products"
        className="dark-btn"
      >
        Tiếp tục mua sắm
      </Link>
    </section>
  );
}

/* ---------------- ADMIN ---------------- */

function AdminLayout({ user, logout, products, orders }) {
  const nav = [
    ["/admin", "▦", "Dashboard", true],
    ["/admin/products", "◇", "Sản phẩm"],
    ["/admin/orders", "□", "Đơn hàng"],
    ["/admin/customers", "♙", "Khách hàng"],
    ["/admin/statistics", "◈", "Thống kê"],
    ["/admin/settings", "⚙", "Cài đặt"],
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-orb"></div>
        <Link className="admin-logo" to="/admin">My<span>Shop</span></Link>
        <span className="admin-subtitle">ADMIN PANEL</span>
        <div className="admin-divider"></div>
        <span className="admin-section-title">WORKSPACE</span>
        <nav className="admin-nav">
          {nav.slice(0, 4).map(([path, icon, label, end]) => <NavLink key={path} end={end} to={path}><span>{icon}</span><b>{label}</b>{label === "Đơn hàng" && <i>{orders.length}</i>}</NavLink>)}
        </nav>
        <span className="admin-section-title">MANAGEMENT</span>
        <nav className="admin-nav">
          {nav.slice(4).map(([path, icon, label]) => <NavLink key={path} to={path}><span>{icon}</span><b>{label}</b></NavLink>)}
        </nav>
        <div className="admin-profile">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase() || "A"}</div>
          <div><strong>{user?.name || "Administrator"}</strong><small>Quản trị viên</small></div>
          <button onClick={logout}>⋮</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div><span>OVERVIEW</span><h1>Dashboard</h1><p>Tổng quan hoạt động MyShop hôm nay.</p></div>
          <div className="admin-date"><span>HÔM NAY</span><strong>{new Date().toLocaleDateString("vi-VN")}</strong></div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, trend }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="trend">+{trend}%</span></div><span>{label}</span><strong>{value}</strong><small>So với kỳ trước <b>→</b></small></div>;
}

function AdminDashboard({ products, orders, accounts }) {
  const customers = accounts.filter((a) => a.role === "user");
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const bars = [35, 52, 43, 68, 55, 82, 92];
  return (
    <div className="admin-dashboard">
      <section className="admin-banner"><div><span>MYSHOP PREMIUM</span><h2>Xin chào, Administrator.</h2><p>Đây là tổng quan hoạt động của cửa hàng. Chúc bạn một ngày làm việc hiệu quả.</p></div><div className="live-status"><i></i> Hệ thống đang hoạt động</div></section>
      <div className="stats-grid">
        <StatCard icon="◇" label="Tổng sản phẩm" value={products.length} trend="12.5" />
        <StatCard icon="□" label="Tổng đơn hàng" value={orders.length} trend="8.2" />
        <StatCard icon="♙" label="Khách hàng" value={customers.length} trend="15.0" />
        <StatCard icon="₫" label="Doanh thu" value={revenue >= 1000000 ? `${(revenue / 1000000).toFixed(1)}M` : money(revenue)} trend="18.4" />
      </div>
      <div className="admin-chart-row">
        <section className="panel chart-panel"><div className="panel-head"><div><span>PERFORMANCE</span><h3>Doanh thu</h3><strong>{money(revenue)}</strong></div><select><option>7 ngày</option><option>30 ngày</option></select></div><div className="bars">{bars.map((h, i) => <div className="bar-wrap" key={i}><div className={i === 6 ? "bar current" : "bar"} style={{ height: `${h}%` }}></div><small>{["T2","T3","T4","T5","T6","T7","CN"][i]}</small></div>)}</div></section>
        <section className="panel activity"><div className="panel-head"><div><span>ACTIVITY</span><h3>Tổng quan</h3></div><b className="live-label">LIVE</b></div><div className="activity-list"><div><i>✓</i><span><strong>Đơn hàng hoàn tất</strong><small>{Math.max(0, orders.length - 1)} đơn hàng</small></span><b>75%</b></div><div><i>◇</i><span><strong>Sản phẩm đang bán</strong><small>{products.length} sản phẩm</small></span><b>100%</b></div><div><i>♙</i><span><strong>Khách hàng mới</strong><small>{customers.length} tài khoản</small></span><b>+15%</b></div><div><i>₫</i><span><strong>Giá trị đơn hàng</strong><small>Trung bình</small></span><b>{orders.length ? `${Math.round(revenue / orders.length / 1000)}K` : "0"}</b></div></div></section>
      </div>
      <section className="panel recent-orders"><div className="panel-head"><div><span>ORDERS</span><h3>Đơn hàng gần đây</h3></div><NavLink to="/admin/orders">Xem tất cả →</NavLink></div><div className="table-scroll"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>{orders.slice(0, 5).map((o) => <tr key={o.id}><td><strong>{o.id}</strong></td><td>{o.customer}</td><td>{o.date}</td><td>{money(o.total)}</td><td><span className={`status ${o.status.includes("Đã") ? "done" : "pending"}`}>{o.status}</span></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

function AdminProducts({ products, addProduct, deleteProduct }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Thời trang", price: 299000, oldPrice: 399000, badge: "NEW", description: "", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85" });
  const submit = (e) => { e.preventDefault(); addProduct(form); setShow(false); };
  return <div className="admin-page"><div className="page-toolbar"><div><span>CATALOG</span><h2>Sản phẩm</h2><p>Quản lý danh mục sản phẩm của MyShop.</p></div><button className="admin-primary" onClick={() => setShow(!show)}>+ Thêm sản phẩm</button></div>{show && <form className="admin-form" onSubmit={submit}><input required placeholder="Tên sản phẩm" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/><input required type="number" placeholder="Giá" value={form.price} onChange={e => setForm({...form,price:Number(e.target.value)})}/><input type="number" placeholder="Giá cũ" value={form.oldPrice} onChange={e => setForm({...form,oldPrice:Number(e.target.value)})}/><input placeholder="URL ảnh" value={form.image} onChange={e => setForm({...form,image:e.target.value})}/><button className="admin-primary">Lưu sản phẩm</button></form>}<div className="admin-product-list">{products.map(p => <div className="admin-product-row" key={p.id}><img src={p.image} alt=""/><div><strong>{p.name}</strong><span>{p.category} · {money(p.price)}</span></div><span className="status done">{p.badge}</span><button className="delete-btn" onClick={() => deleteProduct(p.id)}>Xóa</button></div>)}</div></div>;
}

function AdminOrders({ orders }) {
  return <AdminTablePage eyebrow="ORDERS" title="Đơn hàng" description="Theo dõi và xử lý các đơn hàng." columns={["Mã đơn","Khách hàng","Ngày","Sản phẩm","Tổng tiền","Trạng thái"]} rows={orders.map(o => [o.id,o.customer,o.date,o.items,money(o.total),o.status])}/>;
}

function AdminCustomers({ accounts }) {
  const customers = accounts.filter(a => a.role === "user");
  return <AdminTablePage eyebrow="CUSTOMERS" title="Khách hàng" description="Danh sách tài khoản khách hàng đã đăng ký." columns={["ID","Họ tên","Email","Quyền"]} rows={customers.map(c => [c.id,c.name,c.email,"Khách hàng"])} empty="Chưa có User đăng ký."/>;
}

function AdminTablePage({ eyebrow, title, description, columns, rows, empty }) {
  return <div className="admin-page"><div className="page-toolbar"><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div></div><section className="panel admin-table"><table><thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r,i) => <tr key={i}>{r.map((v,j) => <td key={j}>{j === r.length - 1 && (String(v).includes("Đã") || String(v).includes("Đang") || String(v) === "Khách hàng") ? <span className="status done">{v}</span> : v}</td>)}</tr>) : <tr><td colSpan={columns.length}>{empty || "Chưa có dữ liệu."}</td></tr>}</tbody></table></section></div>;
}

function AdminStatistics({ orders, products }) {
  const revenue = orders.reduce((s,o) => s + o.total, 0);
  return <div className="admin-page"><div className="page-toolbar"><div><span>ANALYTICS</span><h2>Thống kê</h2><p>Tổng hợp hiệu quả kinh doanh.</p></div></div><div className="stats-grid"><StatCard icon="₫" label="Doanh thu" value={money(revenue)} trend="18.4"/><StatCard icon="□" label="Đơn hàng" value={orders.length} trend="8.2"/><StatCard icon="◇" label="Sản phẩm" value={products.length} trend="12.5"/><StatCard icon="↗" label="Tỷ lệ hoàn tất" value="75%" trend="6.8"/></div><section className="panel insight"><h3>Ghi chú</h3><p>Đây là trang thống kê frontend. Các chỉ số được tính từ dữ liệu localStorage trong trình duyệt.</p></section></div>;
}

function AdminSettings({ user }) {
  return <div className="admin-page"><div className="page-toolbar"><div><span>SETTINGS</span><h2>Cài đặt</h2><p>Cấu hình thông tin cửa hàng và tài khoản quản trị.</p></div></div><section className="panel settings-card"><label>Tên cửa hàng<input defaultValue="MyShop"/></label><label>Email hỗ trợ<input defaultValue="support@myshop.com"/></label><label>Quản trị viên<input defaultValue={user?.email || "admin@myshop.com"} disabled/></label><button className="admin-primary">Lưu thay đổi</button></section></div>;
}

export default function App() {
  const store = useStore();
  const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={store.login} />} />
      <Route path="/register" element={<Register onRegister={store.register} />} />

      <Route element={<UserLayout user={store.user} logout={store.logout} cartCount={cartCount} />}>
        <Route path="/" element={<Home products={store.products} addToCart={store.addToCart} />} />
        <Route path="/products" element={<ProductsPage products={store.products} addToCart={store.addToCart} />} />
        <Route path="/sale" element={<ProductsPage products={store.products} addToCart={store.addToCart} saleOnly />} />
        <Route path="/products/:id" element={<ProductDetail products={store.products} addToCart={store.addToCart} />} />
        <Route path="/about" element={<About />} />
        <Route path="/cart" element={<CartPage cart={store.cart} updateCart={store.updateCart} />} />
        <Route path="/checkout" element={<Protected user={store.user} role="user"><Checkout cart={store.cart} user={store.user} placeOrder={store.placeOrder} /></Protected>} />
        <Route path="/account" element={<Protected user={store.user} role="user"><Account user={store.user} orders={store.orders} /></Protected>} />
        <Route path="/order-success" element={<Success />} />
      </Route>

      <Route path="/admin" element={<Protected user={store.user} role="admin"><AdminLayout user={store.user} logout={store.logout} products={store.products} orders={store.orders} /></Protected>}>
        <Route index element={<AdminDashboard products={store.products} orders={store.orders} accounts={store.accounts} />} />
        <Route path="products" element={<AdminProducts products={store.products} addProduct={store.addProduct} deleteProduct={store.deleteProduct} />} />
        <Route path="orders" element={<AdminOrders orders={store.orders} />} />
        <Route path="customers" element={<AdminCustomers accounts={store.accounts} />} />
        <Route path="statistics" element={<AdminStatistics orders={store.orders} products={store.products} />} />
        <Route path="settings" element={<AdminSettings user={store.user} />} />
        <Route path="success" element={<Success />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@myshop.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const submit = (e) => { e.preventDefault(); const result = onLogin(email, password); if (!result) return setError("Email hoặc mật khẩu không đúng."); navigate(result.role === "admin" ? "/admin" : "/"); };
  return <AuthLayout title="Chào mừng trở lại." subtitle="Đăng nhập để tiếp tục với MyShop."><form className="auth-form" onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mật khẩu<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error && <p className="form-error">{error}</p>}<button className="dark-btn wide">Đăng nhập →</button><div className="demo-note">Demo admin: admin@myshop.com / admin123</div><p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p></form></AuthLayout>;
}

function Register({ onRegister }) {
  const navigate = useNavigate();
  const [form,setForm] = useState({name:"",email:"",password:""});
  const [error,setError]=useState("");
  const submit=e=>{e.preventDefault(); const r=onRegister(form); if(!r.ok)return setError(r.message); navigate("/");};
  return <AuthLayout title="Tạo tài khoản." subtitle="Bắt đầu trải nghiệm MyShop theo cách của bạn."><form className="auth-form" onSubmit={submit}><label>Họ và tên<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Mật khẩu<input required minLength="6" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{error&&<p className="form-error">{error}</p>}<button className="dark-btn wide">Tạo tài khoản →</button><p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></form></AuthLayout>;
}

function AuthLayout({ title, subtitle, children }) {
  return <div className="auth-page"><div className="auth-brand"><Logo /><span>PREMIUM FRONTEND STORE</span></div><div className="auth-panel"><div className="auth-art"><span>MYSHOP / 2026</span><h2>Quiet design.<br /><em>Clear experience.</em></h2></div><div className="auth-content"><span className="eyebrow">WELCOME</span><h1>{title}</h1><p>{subtitle}</p>{children}</div></div></div>;
}
