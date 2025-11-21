/* 
Deondre Williams
2307492
web programming 
Tutor Christine Anuli
*/

/* ---------------------------
   Utility helpers
   --------------------------- */
   // function's main purpose is to make a string safe to display inside an HTML element.
function escapeHtml(str = "") {
  return String(str).replace(/[&<>"]/g, function (tag) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[tag] || tag;
  });
}
// function's main purpose is to format a number as a string with two decimal places
function formatNumber(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------------------------
   Detect page and initialize
   --------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // If Checkout page (body has class 'Checkout-page'), init checkout, else init cart
  if (document.body.classList.contains("Checkout-page")) {
    initCheckoutPage();
  } else {
    initCartPage();
  }
});

/* =================================================
   CART PAGE
   ================================================= */
function initCartPage() {
  // Wire events
  handleQuantityButtons();
  handleDeleteButtons();
  handleSaveForLater();
  handleSavedAddToCart();
  handleDeleteSavedItem();
  handleDealAddToCart();
  handleCheckoutButton();
 

  //  local Storage cart 
  const stored = JSON.parse(localStorage.getItem("critterlyCart") || "null");
  if (Array.isArray(stored) && stored.length > 0) {
    renderCartFromStorage();
  } else {
    // Save initial DOM items into storage
    saveCartToLocalStorage();
  }

  // Initial subtotal display
  updateSubtotal();
}

/* ---------------------------
   Cart quantity handling
   --------------------------- */
function handleQuantityButtons() {
  document.addEventListener("click", function (e) {
    if (!e.target.matches(".quantity button")) return;
    const btn = e.target;
    const change = btn.textContent.trim() === "-" ? -1 : 1;
    updateQuantity(btn, change);
  });
}

function updateQuantity(button, change) {
  const quantityContainer = button.closest(".quantity");
  if (!quantityContainer) return;
  const display = quantityContainer.querySelector("span");
  let current = parseInt(display.textContent, 10);
  if (isNaN(current)) current = 1;
  current += change;
  if (current < 1) current = 1;
  display.textContent = current;
  updateSubtotal();
  saveCartToLocalStorage();
}

/* ---------------------------
   Cart delete handeling
   --------------------------- */
function handleDeleteButtons() {
  document.addEventListener("click", function (e) {
    if (e.target.matches(".delete-btn")) deleteCartItem(e.target);
  });
}
function deleteCartItem(btn) {
  const row = btn.closest(".cart-item");
  if (!row) return;
  row.remove();
  updateSubtotal();
  saveCartToLocalStorage();
}

/* ---------------------------
   Save for later
   --------------------------- */
function handleSaveForLater() {
  document.addEventListener("click", function (e) {
    if (e.target.matches(".save-btn")) saveItemForLater(e.target);
  });
}

function saveItemForLater(button) {
  const row = button.closest(".cart-item");
  if (!row) return;
  const savedGrid = document.querySelector(".saved-grid");
  if (!savedGrid) return;

  const title = row.querySelector("a")?.textContent.trim() || "Item";
  const price = row.querySelector(".price")?.textContent.trim() || "$0.00";
  const img = row.querySelector("img")?.src || "";

  const card = document.createElement("div");
  card.className = "saved-card";
  card.innerHTML = `
    <img src="${escapeHtml(img)}" alt="Saved item">
    <p>${escapeHtml(title)}</p>
    <p>${escapeHtml(price)} | Free Shipping</p>
    <div class="saved-actions">
      <button class="delete-btn">Delete</button>
      <button class="add-btn">Add to cart</button>
    </div>
  `;

  savedGrid.appendChild(card);
  row.remove();

  updateSubtotal();
  saveCartToLocalStorage();
}

/* ---------------------------
   Delete saved item
   --------------------------- */
function handleDeleteSavedItem() {
  document.addEventListener("click", function (e) {
    if (e.target.matches(".saved-card .delete-btn")) {
      const card = e.target.closest(".saved-card");
      if (card) card.remove();
    }
  });
}

/* ---------------------------
   Move saved back to cart
   --------------------------- */
function handleSavedAddToCart() {
  document.addEventListener("click", function (e) {
    if (e.target.matches(".saved-card .add-btn")) moveSavedItemToCart(e.target);
  });
}

function moveSavedItemToCart(button) {
  const card = button.closest(".saved-card");
  if (!card) return;

  const title = card.querySelector("p")?.textContent.trim() || "Item";
  const priceText = card.querySelector("p:nth-of-type(2)")?.textContent.split("|")[0].trim() || "$0.00";
  const img = card.querySelector("img")?.src || "";

  const tbody = document.querySelector(".cart-items tbody");
  if (!tbody) return;

  const tr = document.createElement("tr");
  tr.className = "cart-item";
  tr.innerHTML = `
    <td class="item-info">
      <input type="checkbox" class="item-check" />
      <img src="${escapeHtml(img)}" alt="item">
      <div>
        <a href="#">${escapeHtml(title)}</a>
        <p class="stock">In stock</p>
        <p>Sold by: <a href="#">Pet Smart</a> | Shipped by: Critterly</p>
        <div class="item-actions">
          <div class="quantity"><button>-</button><span>1</span><button>+</button></div>
          <button class="delete-btn">Delete</button>
          <button class="save-btn">Save</button>
        </div>
      </div>
    </td>
    <td class="price">${escapeHtml(priceText)}</td>
  `;
  tbody.appendChild(tr);
  card.remove();

  updateSubtotal();
  saveCartToLocalStorage();
}

/* ---------------------------
   Deal of the day add to cart
   --------------------------- */
function handleDealAddToCart() {
  document.addEventListener("click", function (e) {
    if (!e.target.matches(".deal-box .add-btn")) return;
    const deal = document.querySelector(".deal-box");
    if (!deal) return;

    const img = deal.querySelector("img")?.src || "";
    const p = Array.from(deal.querySelectorAll("p")).find(x => x.textContent.trim() !== "");
    const title = p ? p.textContent.trim() : "Deal Item";
    const strong = deal.querySelector("strong");
    let priceText = strong ? strong.textContent.trim() : "$0.00";
    priceText = priceText.replace(/^Now\s+/i, "");

    // create row
    const tbody = document.querySelector(".cart-items tbody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.className = "cart-item";
    tr.innerHTML = `
      <td class="item-info">
        <input type="checkbox" class="item-check" />
        <img src="${escapeHtml(img)}" alt="deal">
        <div>
          <a href="#">${escapeHtml(title)}</a>
          <p class="stock">In stock</p>
          <p>Sold by: <a href="#">Pet Smart</a> | Shipped by: Critterly</p>
          <div class="item-actions">
            <div class="quantity"><button>-</button><span>1</span><button>+</button></div>
            <button class="delete-btn">Delete</button>
            <button class="save-btn">Save</button>
          </div>
        </div>
      </td>
      <td class="price">${escapeHtml(priceText)}</td>
    `;
    tbody.appendChild(tr);
    updateSubtotal();
    saveCartToLocalStorage();
  });
}

/* ---------------------------
   Checkout button cart to checkout
   --------------------------- */
function handleCheckoutButton() {
  const btn = document.querySelector(".checkout-btn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    saveCartToLocalStorage(); 
    window.location.href = "./CheckOut.html";
  });
}


/* ---------------------------
   Subtotal calculation 
   --------------------------- */
function updateSubtotal() {
  const rows = document.querySelectorAll(".cart-item");
  let subtotal = 0;
  let items = 0;
  rows.forEach(row => {
    const priceEl = row.querySelector(".price");
    const qtyEl = row.querySelector(".quantity span");
    if (!priceEl || !qtyEl) return;
    const price = parseFloat(priceEl.textContent.replace(/[^0-9.-]+/g,"")) || 0;// extract number from price text
    const qty = parseInt(qtyEl.textContent,10) || 1;
    subtotal += price * qty;
    items += qty;
  });
  const summary = document.querySelector(".summary-box p");
  if (summary) {
    summary.innerHTML = `<strong>Subtotal:</strong> (${items} items) $${formatNumber(subtotal)}`;
  }
}

/* ---------------------------
   Persistence (localStorage)
   --------------------------- */
function saveCartToLocalStorage() {
  const rows = document.querySelectorAll(".cart-item");
  const items = [];
  rows.forEach(row => {
    const name = row.querySelector("a")?.textContent.trim() || "Item";
    const price = parseFloat(row.querySelector(".price")?.textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const qty = parseInt(row.querySelector(".quantity span")?.textContent, 10) || 1;
    const img = row.querySelector("img")?.src || "";
    items.push({ name, price, qty, img });
  });
  localStorage.setItem("critterlyCart", JSON.stringify(items));
}

/* ---------------------------
   Render cart from storage (Cart page)//still needs work
   --------------------------- */
function renderCartFromStorage() {
  const stored = JSON.parse(localStorage.getItem("critterlyCart") || "[]");
  const tbody = document.querySelector(".cart-items tbody");
  if (!tbody) return;
  tbody.innerHTML = ""; // clear
  stored.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "cart-item";
    tr.innerHTML = `
      <td class="item-info">
        <input type="checkbox" class="item-check" />
        <img src="${escapeHtml(item.img)}" alt="">
        <div>
          <a href="#">${escapeHtml(item.name)}</a>
          <p class="stock">In stock</p>
          <p>Sold by: <a href="#">Pet Smart</a> | Shipped by: Critterly</p>
          <div class="item-actions">
            <div class="quantity"><button>-</button><span>${item.qty}</span><button>+</button></div>
            <button class="delete-btn">Delete</button>
            <button class="save-btn">Save</button>
          </div>
        </div>
      </td>
      <td class="price">$${formatNumber(item.price)}</td>
    `;
    tbody.appendChild(tr);
  });
  updateSubtotal();
}

/* =================================================
   CHECKOUT PAGE 
   ================================================= */
function initCheckoutPage() {
  // Address system  and checkout loading
  initAddressSystem();
  loadCheckoutCart();

  // Checkout final button behavior
  const finalBtn = document.querySelector(".checkout-section button");
  if (finalBtn) {
    finalBtn.addEventListener("click", function () {
      // Note to self add payment flow here
      let cart = JSON.parse(localStorage.getItem("critterlyCart") || "[]");
      if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
      }
      saveCartToLocalStorage();
      alert("Order Placed");
      window.location.href = "./invoice.html";
    });
  }
}
/* ---------------------------
   Address 
   --------------------------- */
function initAddressSystem() {
  const form = document.querySelector(".form-grid");
  const saveBtn = document.querySelector(".save-address-btn");
  const useBtn = document.getElementById("useAddressBtn");
  const changeBtn = document.getElementById("changeAddressBtn");

  if (!form || !saveBtn || !useBtn || !changeBtn) return;

  // Start hidden
  form.classList.add("collapsed-form");
  saveBtn.classList.add("hidden");

  changeBtn.addEventListener("click", () => {
    form.classList.remove("collapsed-form");
    form.classList.add("expanded-form");
    saveBtn.classList.add("hidden");
  });

  useBtn.addEventListener("click", () => {
    // Take whatever is in the form and use it as default address
    const fields = getFormFields();
    Object.assign(defaultAddress, {
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      address1: fields.address1.value.trim(),
      address2: fields.address2.value.trim(),
      state: fields.state.value.trim(),
      city: fields.city.value.trim(),
      zip: fields.zip.value.trim(),
      country: fields.country.value.trim(),
      notes: fields.notes.value.trim()
    });
    updateShippingDisplay();
    form.classList.remove("expanded-form");
    form.classList.add("collapsed-form");
    saveBtn.classList.add("hidden");
  });

  // Validation to show Save button only when required fields filled
  const inputs = form.querySelectorAll("input, textarea");
  inputs.forEach(i => i.addEventListener("input", () => {
    saveBtn.classList.toggle("hidden", !isFormValid());
  }));

  saveBtn.addEventListener("click", () => {
    const fields = getFormFields();
    Object.assign(defaultAddress, {
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      address1: fields.address1.value.trim(),
      address2: fields.address2.value.trim(),
      state: fields.state.value.trim(),
      city: fields.city.value.trim(),
      zip: fields.zip.value.trim(),
      country: fields.country.value.trim(),
      notes: fields.notes.value.trim()
    });
    updateShippingDisplay();
    saveBtn.classList.add("hidden");
  });

  // show initial shipping
  updateShippingDisplay();
}

function getFormFields() {
  const inputs = document.querySelectorAll(".form-grid input, .form-grid textarea");
  return {
    firstName: inputs[0],
    lastName: inputs[1],
    address1: inputs[2],
    state: inputs[3],
    address2: inputs[4],
    zip: inputs[5],
    city: inputs[6],
    country: inputs[7],
    notes: inputs[8]
  };
}

const defaultAddress = {
  firstName: "Jane",
  lastName: "Doe",
  address1: "63 Mona mews ave",
  address2: "",
  state: "St Andrew",
  city: "Kingston",
  zip: "KNG06",
  country: "Jamaica",
  notes: ""
};

function isFormValid() {
  const f = getFormFields();
  return (
    f.firstName.value.trim() !== "" &&
    f.lastName.value.trim() !== "" &&
    f.address1.value.trim() !== "" &&
    f.state.value.trim() !== "" &&
    f.city.value.trim() !== "" &&
    f.zip.value.trim() !== "" &&
    f.country.value.trim() !== ""
  );
}

function updateShippingDisplay() {
  const display = document.getElementById("shippingAddressDisplay");
  if (!display) return;
  const line2 = defaultAddress.address2 ? `<br>${escapeHtml(defaultAddress.address2)}` : "";
  display.innerHTML = `
    <strong>Shipping to:</strong><br>
    ${escapeHtml(defaultAddress.firstName)} ${escapeHtml(defaultAddress.lastName)}<br>
    ${escapeHtml(defaultAddress.address1)}${line2}<br>
    ${escapeHtml(defaultAddress.city)}, ${escapeHtml(defaultAddress.state)} ${escapeHtml(defaultAddress.zip)}<br>
    ${escapeHtml(defaultAddress.country)}
  `;
}

/* ---------------------------
   Load Cart into Checkout and calculate totals
   --------------------------- */
const EXCHANGE_RATE = 160.11; 

function loadCheckoutCart() {
  const cart = JSON.parse(localStorage.getItem("critterlyCart") || "[]");
  const container = document.querySelector(".checkout-cart-container");
  if (!container) return;
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p>Your cart is empty.</p>`;
  } else {
    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${escapeHtml(item.img)}" alt="">
        <div>
          <a>${escapeHtml(item.name)}</a>
          <p>Qty: ${item.qty}</p>
          <p>$${formatNumber(item.price)}</p>
        </div>
      `;
      container.appendChild(div);
    });
  }
  calculateCheckoutTotals();
}

function calculateCheckoutTotals() {
  const cart = JSON.parse(localStorage.getItem("critterlyCart") || "[]");
  let subtotalUSD = 0;
  cart.forEach(i => subtotalUSD += (i.price || 0) * (i.qty || 1));

  const subtotalJMD = subtotalUSD * EXCHANGE_RATE;
  const estimatedTax = subtotalJMD * 0.028; // use your rate or formula
  const grandTotal = subtotalJMD + estimatedTax;

  // Update summary fields IDs used in HTML
  const elSubtotal = document.getElementById("sumSubtotal");
  const elShipping = document.getElementById("sumShipping");
  const elFree = document.getElementById("sumFree");
  const elBefore = document.getElementById("sumBeforeTax");
  const elTax = document.getElementById("sumTax");
  const elRate = document.getElementById("sumRate");
  const elGrand = document.getElementById("sumGrand");

  if (elSubtotal) elSubtotal.textContent = `JMD ${formatNumber(subtotalJMD)}`;
  if (elShipping) elShipping.textContent = `JMD 1119.16`;
  if (elFree) elFree.textContent = `-JMD 1119.16`;
  if (elBefore) elBefore.textContent = `JMD ${formatNumber(subtotalJMD)}`;
  if (elTax) elTax.textContent = `JMD ${formatNumber(estimatedTax)}`;
  if (elRate) elRate.textContent = `JMD ${formatNumber(EXCHANGE_RATE)}`;
  if (elGrand) elGrand.textContent = `JMD ${formatNumber(grandTotal)}`;
}

/* ---------------------------
   Save Order Data to localStorage called when checkout button is clicked
   --------------------------- */
function saveOrderData() {
  const cart = JSON.parse(localStorage.getItem("critterlyCart") || "[]");
  
  // Calculate totals
  let subtotalUSD = 0;
  cart.forEach(i => subtotalUSD += (i.price || 0) * (i.qty || 1));
  const subtotalJMD = subtotalUSD * EXCHANGE_RATE;
  const estimatedTax = subtotalJMD * 0.028;
  const grandTotal = subtotalJMD + estimatedTax;

  const orderData = {
    orderDate: new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    }),
    orderNumber: Math.floor(Math.random() * 900000000) + 100000000, // Random 9-digit order number
    address: { ...defaultAddress },
    paymentMethod: "Visa 1234", 
    items: cart,
    subtotalUSD,
    subtotalJMD,
    estimatedTax,
    grandTotal
  };

  localStorage.setItem("critterlyOrder", JSON.stringify(orderData));
  console.log("Order data saved:", orderData);
}

/* ---------------------------
   Load  Invoice Page
   --------------------------- */
function renderInvoicePage() {
  const orderData = JSON.parse(localStorage.getItem("critterlyOrder") || "null");
  
  if (!orderData) {
    console.warn("No order data found. Using defaults.");
    return;
  }

  // Render shipping address
  const shipTo = document.querySelector(".summary-left");
  if (shipTo) {
    const addr = orderData.address;
    const line2 = addr.address2 ? `<br>${escapeHtml(addr.address2)}` : "";
    shipTo.innerHTML = `
      <p><strong>Ship to:</strong><br>
        ${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}<br>
        ${escapeHtml(addr.address1)}${line2}<br>
        ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.zip)}<br>
        ${escapeHtml(addr.country)}</p>
      <p><strong>Order placed:</strong> ${escapeHtml(orderData.orderDate)}</p>
      <p><strong>Order number:</strong> ${orderData.orderNumber}</p>
      <p><strong>Status:</strong> Shipped</p>
    `;
  }

  // Render payment method
  const paymentDiv = document.querySelector(".payment-method");
  if (paymentDiv) {
    paymentDiv.innerHTML = `
      <p><strong>Payment Method:</strong><br>
        ${escapeHtml(orderData.paymentMethod)}<br>
        <button class="related-btn">Related Orders</button>
      </p>
    `;
  }

  // Render summary totals
  const invoiceSummary = document.querySelector(".invoice-summary");
  if (invoiceSummary) {
    invoiceSummary.innerHTML = `
      <p><strong>Invoice Summary:</strong></p>
      <p>Item(s) Subtotal: JMD ${formatNumber(orderData.subtotalJMD)}</p>
      <p>Shipping & Handling: JMD 1,119.16</p>
      <p>Free Shipping: -JMD 1,119.16</p>
      <p>Total before tax: JMD ${formatNumber(orderData.subtotalJMD)}</p>
      <p>Estimated Tax: JMD ${formatNumber(orderData.estimatedTax)}</p>
      <p>Exchange Rate: JMD ${formatNumber(EXCHANGE_RATE)}</p>
      <p><strong>Grand Total:</strong> JMD ${formatNumber(orderData.grandTotal)}</p>
      <p style="margin-top:10px;">Exchange Rate<br>1USD = ${formatNumber(EXCHANGE_RATE)} JMD</p>
    `;
  }

  //carr over product items
  const productSection = document.querySelector(".product-section");
  if (productSection && orderData.items.length > 0) {
    let itemsHTML = "<h3>Product Details</h3>";
    orderData.items.forEach(item => {
      itemsHTML += `
        <div class="product">
          <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}">
          <div>
            <a href="#">${escapeHtml(item.name)}</a>
            <p>Qty: ${item.qty}</p>
            <p>Unit Price: $${formatNumber(item.price)}</p>
            <p>
              <a href="#">Sold by: Pet Smart</a>
            </p>
            <p>
              <a href="#">Return window: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</a>
            </p>
          </div>
        </div>
      `;
    });
    productSection.innerHTML = itemsHTML;
  }
}

// Initialize invoice page on load
if (document.body.classList.contains("invoice-page")) {
  document.addEventListener("DOMContentLoaded", renderInvoicePage);
}

//Print invoice 
const printBtn = document.querySelector(".print-btn");
if (printBtn) {
  printBtn.addEventListener("click", function () {
    window.print();
  });
}

