import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductCard from "./components/ProductCard";
import products from "./data";

function Home({
  saleOnly = false,
  onAddToCart,
}) {
  const navigate = useNavigate();

  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("default");

  // ============================================
  // DANH MỤC
  // ============================================

  const categories = useMemo(() => {
    const list = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["Tất cả", ...new Set(list)];
  }, []);

  // ============================================
  // LỌC + SẮP XẾP
  // ============================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Chỉ hiển thị sản phẩm sale
    if (saleOnly) {
      result = result.filter(
        (product) =>
          product.oldPrice &&
          Number(product.oldPrice) > Number(product.price)
      );
    }

    // Lọc danh mục
    if (category !== "Tất cả") {
      result = result.filter(
        (product) => product.category === category
      );
    }

    // Sắp xếp
    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.price) - Number(b.price)
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.price) - Number(a.price)
      );
    }

    if (sort === "rating") {
      result.sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      );
    }

    return result;
  }, [category, sort, saleOnly]);

  // ============================================
  // MUA NGAY
  // ============================================

  const handleBuyNow = (product) => {
    /*
      Đưa sản phẩm vào localStorage tạm thời
      để trang Checkout có thể sử dụng nếu cần.
    */

    const buyNowCart = [
      {
        ...product,
        quantity: 1,
      },
    ];

    localStorage.setItem(
      "myshop_buy_now",
      JSON.stringify(buyNowCart)
    );

    navigate("/checkout");
  };

  // ============================================
  // TRANG CHỦ
  // ============================================

  return (
    <div className="shop-page">

      {/* ========================================
          HERO
      ======================================== */}

      {!saleOnly && (
        <section className="premium-hero">

          <div className="hero-content">

            <span className="hero-eyebrow">
              NEW COLLECTION · 2026
            </span>

            <h1>
              Simple things.
              <br />
              <span>Better made.</span>
            </h1>

            <p>
              Những món đồ tối giản được tuyển chọn
              cho nhịp sống hiện đại – tinh tế,
              dễ phối và dùng lâu.
            </p>

            <div className="hero-actions">

              <a
                href="#products"
                className="hero-button hero-button-primary"
              >
                Khám phá sản phẩm
              </a>

              <a
                href="#products"
                className="hero-button hero-button-secondary"
              >
                Xem bộ sưu tập
              </a>

            </div>

          </div>

          <div className="hero-decoration">
            <div className="hero-circle"></div>
            <div className="hero-square"></div>
          </div>

        </section>
      )}

      {/* ========================================
          SALE HEADER
      ======================================== */}

      {saleOnly && (
        <section className="collection-header">

          <span className="section-eyebrow">
            SPECIAL COLLECTION
          </span>

          <h1>
            Đang sale
          </h1>

          <p>
            Những sản phẩm đang được ưu đãi
            với mức giá tốt hơn.
          </p>

        </section>
      )}

      {/* ========================================
          PRODUCTS SECTION
      ======================================== */}

      <section
        id="products"
        className="products-section"
      >

        {/* HEADER */}

        <div className="products-header">

          <div>

            <span className="section-eyebrow">
              OUR PRODUCTS
            </span>

            <h2>
              {saleOnly
                ? "Sản phẩm đang sale"
                : "Sản phẩm nổi bật"}
            </h2>

            <p>
              {filteredProducts.length} sản phẩm
            </p>

          </div>

          {/* SORT */}

          <div className="product-sort">

            <label htmlFor="sort">
              Sắp xếp
            </label>

            <select
              id="sort"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
            >

              <option value="default">
                Mặc định
              </option>

              <option value="price-low">
                Giá thấp → cao
              </option>

              <option value="price-high">
                Giá cao → thấp
              </option>

              <option value="rating">
                Đánh giá cao
              </option>

            </select>

          </div>

        </div>


        {/* CATEGORY */}

        <div className="category-filter">

          {categories.map((item) => (

            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                setCategory(item)
              }
            >
              {item}
            </button>

          ))}

        </div>


        {/* PRODUCT GRID */}

        {filteredProducts.length > 0 ? (

          <div className="product-grid">

            {filteredProducts.map(
              (product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={
                    onAddToCart
                  }
                  onBuyNow={
                    handleBuyNow
                  }
                />

              )
            )}

          </div>

        ) : (

          <div className="empty-products">

            <div className="empty-icon">
              ◇
            </div>

            <h3>
              Không có sản phẩm
            </h3>

            <p>
              Không tìm thấy sản phẩm phù hợp
              với bộ lọc hiện tại.
            </p>

            <button
              type="button"
              onClick={() => {
                setCategory("Tất cả");
                setSort("default");
              }}
            >
              Xóa bộ lọc
            </button>

          </div>

        )}

      </section>


      {/* ========================================
          PREMIUM BANNER
      ======================================== */}

      {!saleOnly && (
        <section className="premium-banner">

          <div>

            <span>
              MYSHOP PREMIUM
            </span>

            <h2>
              Đơn giản hơn.
              <br />
              Đẹp hơn mỗi ngày.
            </h2>

            <p>
              Tập trung vào những sản phẩm bạn
              thực sự cần và yêu thích.
            </p>

          </div>

          <div className="banner-number">
            01
          </div>

        </section>
      )}

    </div>
  );
}

export default Home;