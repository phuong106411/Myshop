import { useNavigate } from "react-router-dom";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();

  // =====================================================
  // THÊM SẢN PHẨM VÀO GIỎ
  // =====================================================

  const handleAddToCart = () => {
    if (!product) return;

    onAddToCart(product);
  };

  // =====================================================
  // MUA NGAY
  // =====================================================

  const handleBuyNow = () => {
    if (!product) return;

    // Thêm sản phẩm vào giỏ
    onAddToCart(product);

    // Chuyển sang trang thanh toán
    navigate("/checkout");
  };

  // =====================================================
  // KIỂM TRA DỮ LIỆU
  // =====================================================

  if (!product) {
    return null;
  }

  // =====================================================
  // FORMAT GIÁ
  // =====================================================

  const price = Number(product.price || 0);

  const oldPrice =
    product.oldPrice !== undefined &&
    product.oldPrice !== null
      ? Number(product.oldPrice)
      : null;

  const formattedPrice =
    price.toLocaleString("vi-VN");

  const formattedOldPrice =
    oldPrice
      ? oldPrice.toLocaleString("vi-VN")
      : null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <article className="product-card">

      {/* =================================================
          ẢNH SẢN PHẨM
      ================================================= */}

      <div className="product-image-wrap">

        {/* SALE */}
        {product.sale && (
          <span className="product-badge">
            SALE
          </span>
        )}

        {/* NEW */}
        {product.isNew && !product.sale && (
          <span className="product-badge product-badge-new">
            NEW
          </span>
        )}

        {/* ẢNH */}
        <img
          src={product.image}
          alt={product.name || "Sản phẩm"}
          className="product-image"
        />

        {/* NÚT + THÊM NHANH */}
        <button
          type="button"
          className="product-quick-add"
          onClick={handleAddToCart}
          aria-label="Thêm sản phẩm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
        >
          +
        </button>

      </div>


      {/* =================================================
          THÔNG TIN SẢN PHẨM
      ================================================= */}

      <div className="product-info">

        {/* DANH MỤC + ĐÁNH GIÁ */}
        <div className="product-top">

          <span className="product-category">
            {product.category || "Sản phẩm"}
          </span>

          <span className="product-rating">
            ★ {product.rating || "4.8"}
          </span>

        </div>


        {/* TÊN */}
        <h3 className="product-name">
          {product.name}
        </h3>


        {/* =================================================
            GIÁ
        ================================================= */}

        <div className="product-price">

          <strong>
            {formattedPrice} ₫
          </strong>

          {formattedOldPrice && (
            <del>
              {formattedOldPrice} ₫
            </del>
          )}

        </div>


        {/* =================================================
            2 CHỨC NĂNG
        ================================================= */}

        <div className="product-actions">

          {/* THÊM VÀO GIỎ */}
          <button
            type="button"
            className="btn-add-cart"
            onClick={handleAddToCart}
          >
            <span className="btn-icon">
              🛒
            </span>

            <span>
              Thêm vào giỏ
            </span>
          </button>


          {/* MUA NGAY */}
          <button
            type="button"
            className="btn-buy-now"
            onClick={handleBuyNow}
          >
            Mua ngay
          </button>

        </div>

      </div>

    </article>
  );
}

export default ProductCard;