const apiBase = "http://127.0.0.1:8000/api";

let ordersChart = null;
let categoryChart = null;

// ==========================
// INIT DASHBOARD
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  loadDashboard();     // stats only
  loadBooks();
  loadOrders();

  initSidebarLogout();
  initAddBook();

  // 👇 render static charts ONCE
  setTimeout(renderStaticCharts, 0);
});

// ==========================
// NAVIGATION
// ==========================
function initNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      button.classList.add("active");
      const target = document.getElementById(button.dataset.section);
      if (target) target.classList.add("active");
    });
  });
}

// ==========================
// DASHBOARD STATS ONLY
// ==========================
async function loadDashboard() {
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  try {
    const statsRes = await fetch(`${apiBase}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = await statsRes.json();

    document.querySelector(".stat-card:nth-child(1) p").textContent =
      stats.total_books || 0;
    document.querySelector(".stat-card:nth-child(2) p").textContent =
      stats.total_orders || 0;
    document.querySelector("#totalUsers").textContent =
      stats.total_users || 0;

  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// ==========================
// STATIC CHARTS (ONCE)
// ==========================
function renderStaticCharts() {
  const ordersCanvas = document.getElementById("ordersChart");
  const categoryCanvas = document.getElementById("categoryChart");

  if (!ordersCanvas || !categoryCanvas || typeof Chart === "undefined") return;

  if (!ordersChart) {
    ordersChart = new Chart(ordersCanvas, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          data: [10, 15, 8, 20, 18, 25],
          borderColor: "#111827",
          backgroundColor: "rgba(17,24,39,0.08)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  if (!categoryChart) {
    categoryChart = new Chart(categoryCanvas, {
      type: "doughnut",
      data: {
        labels: ["Fiction", "Romance", "Sci-Fi", "Fantasy", "Non-Fiction"],
        datasets: [{
          data: [12, 9, 6, 8, 10],
          backgroundColor: [
            "#111827",
            "#4b5563",
            "#9ca3af",
            "#d1d5db",
            "#f87171"
          ]
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }
}

// ==========================
// BOOKS
// ==========================
async function loadBooks() {
  const tbody = document.getElementById("booksTableBody");
  if (!tbody) return;

  try {
    const res = await fetch(`${apiBase}/books`);
    const books = await res.json();
    tbody.innerHTML = "";

    books.forEach(book => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input data-field="title" value="${book.title}"></td>
        <td><input data-field="category" value="${book.category}"></td>
        <td><input type="number" data-field="price" value="${book.price}"></td>
        <td><input type="number" data-field="stock" value="${book.stock || 0}"></td>
        <td>
          <img src="${book.cover_url || '/img/default-book.jpg'}" width="50">
          <input type="file" id="cover-${book.id}" data-field="cover" hidden>
          <label class="file-label" for="cover-${book.id}">Choose Image</label>
        </td>
        <td>
          <button class="update-btn" data-id="${book.id}">Update</button>
          <button class="delete-btn" data-id="${book.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    setupBookActions();
  } catch (err) {
    console.error(err);
  }
}


function setupBookActions() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this book?")) return;
      const token = localStorage.getItem("auth_token");
      await fetch(`${apiBase}/books/${btn.dataset.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      btn.closest("tr").remove();
    };
  });

  document.querySelectorAll(".update-btn").forEach(btn => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      tr.querySelectorAll("[data-field]").forEach(f => { if(f.type !== "file") formData.append(f.dataset.field,f.value) });
      const file = tr.querySelector('[data-field="cover"]').files[0];
      if(file) formData.append('cover',file);

      await fetch(`${apiBase}/books/${btn.dataset.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      alert("Book updated");
    };
  });
}
function initAddBook() {
  const addBtn = document.getElementById("addBookBtn");
  if (!addBtn) return;

  addBtn.onclick = async () => {
    const token = localStorage.getItem("auth_token");

    const inputs = document.querySelectorAll("#books .form input");
    const [title, category, price, stock] = inputs;

    const coverInput = document.getElementById("coverFile");

    if (!title.value || !category.value || !price.value) {
      alert("Fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("category", category.value);
    formData.append("price", price.value);
    formData.append("stock", stock.value || 0);

    if (coverInput.files[0]) {
      formData.append("cover", coverInput.files[0]);
    }

    try {
      const res = await fetch(`${apiBase}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error(await res.text());

      // reset form
      inputs.forEach(i => i.value = "");
      coverInput.value = "";

      await loadBooks(); // refresh table
      alert("Book added successfully 😌");

    } catch (err) {
      console.error("Add book failed:", err);
      alert("Failed to add book");
    }
  };
}

// ==========================
// ORDERS
// ==========================
async function loadOrders() {
  const tbody = document.querySelector("#orders tbody");
  if (!tbody) return;

  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${apiBase}/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const orders = await res.json();
    tbody.innerHTML = "";

    orders.forEach(o => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${o.id}</td>
        <td>${o.user?.name || "Unknown"}</td>
        <td>$${o.price}</td>
        <td>
          <select data-id="${o.id}">
            ${["pending","processing","shipped","delivered","cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll("#orders select").forEach(sel=>{
      sel.onchange = async e=>{
        const token = localStorage.getItem("auth_token");
        await fetch(`${apiBase}/orders/${e.target.dataset.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({ status: e.target.value })
        });
        alert("Order updated");
      }
    });

  } catch(err){ console.error(err); }
}



// ==========================
// SIDEBAR LOGOUT
// ==========================
function initSidebarLogout() {
  const btn = document.querySelector(".logout");
  if(!btn) return;

  btn.onclick = async ()=>{
    const token = localStorage.getItem("auth_token");
    await fetch(`${apiBase}/logout`,{ method:"POST", headers:{ Authorization:`Bearer ${token}` }});
    localStorage.clear();
    window.location.href="index.html";
  };
}
