const logoutBtn = document.getElementById("logoutBtn");
const saveProfileBtn = document.getElementById("saveProfile");
const profileImage = document.getElementById("profileImage");
const imageUpload = document.getElementById("imageUpload");
const profileIdEl = document.getElementById("profileId");
const editableFields = document.querySelectorAll(".editable-field");

let isEditing = false;
let profileData = null;
let selectedImageFile = null;

/* 
   LOAD PROFILE
 */
document.addEventListener("DOMContentLoaded", () => {
  lockFields();
  loadProfile();
});

async function loadProfile() {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("http://127.0.0.1:8000/api/user", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Cannot fetch user");
    const user = await res.json();
    const profileRes = await fetch(`http://127.0.0.1:8000/api/profiles/${user.id}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const profile = await profileRes.json();
    populateProfileFields(profile);
  } catch (err) {
    console.error(err);
  }
}

function populateProfileFields(data) {
  profileData = data;
  editableFields.forEach(f => f.value = data[f.dataset.field] || "");
  profileIdEl.textContent = data.id ? `#${String(data.id).padStart(6,"0")}` : "#000000";
  if (data.image_url) {
    profileImage.src = `http://127.0.0.1:8000/storage/${data.image}`;


} else {
    profileImage.src = ''; 
}
}

/*
   IMAGE UPLOAD PREVIEW
*/
profileImage.addEventListener("click", () => imageUpload.click());

imageUpload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => profileImage.src = reader.result;
    reader.readAsDataURL(file);
  }
});

/* 
   EDIT / SAVE
 */
saveProfileBtn.addEventListener("click", async () => {
  if (!isEditing) {
    isEditing = true;
    saveProfileBtn.textContent = "Save Profile";
    unlockFields();
  } else {
    await saveProfile();
    isEditing = false;
    saveProfileBtn.textContent = "Edit Profile";
    lockFields();
  }
});

/* 
   SAVE PROFILE
*/
async function saveProfile() {
  if (!profileData || !profileData.id) return alert("Profile not loaded yet!");

  const token = localStorage.getItem("auth_token");
  const formData = new FormData();

  editableFields.forEach(f => formData.append(f.dataset.field, f.value));
  if (selectedImageFile) formData.append("image", selectedImageFile);

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/profiles/${profileData.id}`, {
      method: "POST", // must match your API route
      headers: { Authorization: `Bearer ${token}` }, // DO NOT set Content-Type manually
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    profileData = data.profile;
    populateProfileFields(profileData);
    selectedImageFile = null;
    alert("Profile updated successfully ");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Update failed!");
  }
}

/* 
   LOCK / UNLOCK
 */
function lockFields() { editableFields.forEach(f => f.setAttribute("readonly", true)); }
function unlockFields() { editableFields.forEach(f => f.removeAttribute("readonly")); }

/* 
   LOGOUT
*/
logoutBtn.addEventListener("click", async e => {
  e.preventDefault();
  const token = localStorage.getItem("auth_token");
  try {
    const res = await fetch("http://127.0.0.1:8000/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (res.ok) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login.html";
    } else console.error("Logout failed");
  } catch (err) { console.error("Logout error:", err); }
});