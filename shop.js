/* CATEGORY FILTER*/
function filterBooks(category) {
  document.querySelectorAll('.categories button')
    .forEach(btn => btn.classList.remove('active'));


  const buttons = document.querySelectorAll('.categories button');
  buttons.forEach(btn => {
    if (btn.innerText.toLowerCase() === category || (category === 'all' && btn.innerText === 'All')) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.book-shelf').forEach(shelf => {
    let anyVisible = false;

    shelf.querySelectorAll('.book-card').forEach(book => {
      if (category === 'all' || book.dataset.category === category) {
        book.style.display = 'block';
        anyVisible = true;
      } else {
        book.style.display = 'none';
      }
    });

    shelf.style.display = anyVisible ? 'flex' : 'none';
  });
}

/* 
   CART
*/
let cartCount = 0;
let cartTotal = 0;

const cartItemsContainer = document.getElementById('cart-items');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const cartDrawer = document.getElementById('cart');

function addToCart(button) {
  const card = button.closest('.book-card');
  const title = card.querySelector('h4').innerText;
  const price = 20; 
  const bookId = card.dataset.bookId || card.dataset.id; 

  cartCount++;
  cartTotal += price;

  cartCountEl.innerText = cartCount;
  cartTotalEl.innerText = cartTotal;

  const item = document.createElement('div');
  item.classList.add('cart-item');
  item.dataset.bookId = bookId;
  item.innerText = `${title} - $${price}`;
  cartItemsContainer.appendChild(item);
}

function toggleCart() {
  cartDrawer.classList.toggle('open');
}

/* 
   CHECKOUT
 */
document.querySelector('.cart-drawer .btn-dark')
  .addEventListener('click', async () => {

  if (cartCount === 0) {
    alert('Your cart is empty!');
    return;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    alert('Please log in to checkout.');
    return;
  }

  const items = [];
  cartItemsContainer.querySelectorAll('.cart-item').forEach(el => {
    const bookId = el.dataset.bookId;
    items.push({ book_id: bookId, quantity: 1 }); 
  });

  const orderData = {
    price: cartTotal,
    status: 'pending',
    items
  };

  try {
    const response = await fetch('http://127.0.0.1:8000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Server returned HTML:', text);
      alert('Server error (not JSON)');
      return;
    }

    if (!response.ok) {
      alert(data.message || data.error || 'Order failed');
      return;
    }

    alert('Order placed successfully!');

    // Reset cart
    cartCount = 0;
    cartTotal = 0;
    cartCountEl.innerText = 0;
    cartTotalEl.innerText = 0;
    cartItemsContainer.innerHTML = '';
    toggleCart();

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Checkout error');
  }
});

/* 
   LOAD BOOKS
*/
async function loadBooks() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/books', {
      headers: { 'Accept': 'application/json' }
    });

    const books = await response.json();
    const shopSection = document.querySelector('.shop');
    shopSection.innerHTML = '';

    const shelf = document.createElement('div');
    shelf.classList.add('book-shelf');

    books.forEach(book => {
      const bookCard = document.createElement('div');
      bookCard.classList.add('book-card');
      bookCard.dataset.category = book.category.toLowerCase();
      bookCard.dataset.bookId = book.id; // store book id for cart

      bookCard.innerHTML = `
        <img src="${book.cover_url || 'img/default-book.jpg'}" alt="${book.title}">
        <h4>${book.title}</h4>
        <span>${book.category}</span>
        <button onclick="addToCart(this)">Add to Cart</button>
      `;

      shelf.appendChild(bookCard);
    });

    shopSection.appendChild(shelf);

  } catch (error) {
    console.error('Failed to load books:', error);
  }
}

function openOrders() {
  document.getElementById('orderModal').classList.add('open');
  loadOrders();
}

function closeOrders() {
  document.getElementById('orderModal').classList.remove('open');
}
async function loadOrders() {
  const token = localStorage.getItem('auth_token');
  const container = document.getElementById('ordersContainer');

  if (!token) {
    container.innerHTML = '<p>Please log in to see your orders.</p>';
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/api/orders', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const orders = await response.json();

    if (!orders.length) {
      container.innerHTML = '<p>No orders yet.</p>';
      return;
    }

    container.innerHTML = '';

    orders.forEach(order => {
      const div = document.createElement('div');
      div.classList.add('order-item');

      div.innerHTML = `
        <p><strong>Order #${order.id}</strong></p>
        <p>Status: <span class="order-status">${order.status}</span></p>
        <p>Total: $${order.price}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Failed to load orders.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadBooks);
