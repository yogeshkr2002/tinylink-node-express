const apiBase = "";

function el(id) {
  return document.getElementById(id);
}

async function fetchLinks() {
  const res = await fetch("/api/links");
  return res.json();
}

function formatDate(ts) {
  if (!ts) return "never";
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return ts;
  }
}

function shortUrl(code) {
  return `${location.origin}/${code}`;
}

function createRow(l) {
  const tr = document.createElement("tr");
  tr.className = "odd:bg-white even:bg-gray-50";
  tr.innerHTML = `
    <td class="px-3 py-2 border-b align-top"><a class="text-indigo-600 font-medium" href="/${
      l.code
    }" target="_blank">${l.code}</a></td>
    <td class="px-3 py-2 border-b align-top"><div class="truncate-ellipsis"><a class="text-gray-800" href="${
      l.url
    }" target="_blank">${l.title ? l.title : l.url}</a></div></td>
    <td class="px-3 py-2 border-b align-top">${l.clicks || 0}</td>
    <td class="px-3 py-2 border-b align-top">${formatDate(
      l.last_clicked_at
    )}</td>
    <td class="px-3 py-2 border-b align-top space-x-2">
      <button class="copy-btn px-2 py-1 border rounded text-sm" data-code="${
        l.code
      }">Copy</button>
      <button class="stats-btn px-2 py-1 border rounded text-sm" data-code="${
        l.code
      }">Stats</button>
      <button class="delete-btn px-2 py-1 bg-red-600 text-white rounded text-sm" data-code="${
        l.code
      }">Delete</button>
    </td>`;
  return tr;
}

async function renderList(filter = "") {
  const body = el("links-body");
  body.innerHTML = "";
  let links = await fetchLinks();
  if (filter) {
    const q = filter.toLowerCase();
    links = links.filter(
      (l) =>
        (l.code && l.code.toLowerCase().includes(q)) ||
        (l.url && l.url.toLowerCase().includes(q))
    );
  }
  if (links.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td class="px-3 py-6" colspan="5">No links yet.</td>';
    body.appendChild(tr);
    return;
  }
  for (const l of links) {
    if (l.deleted) continue; // ⛔ skip deleted links
    body.appendChild(createRow(l));
  }

  // attach handlers
  document.querySelectorAll(".copy-btn").forEach((b) => {
    b.onclick = async (e) => {
      const code = b.dataset.code;
      await navigator.clipboard.writeText(shortUrl(code));
      b.textContent = "Copied";
      setTimeout(() => (b.textContent = "Copy"), 1500);
    };
  });
  document.querySelectorAll(".stats-btn").forEach((b) => {
    b.onclick = (e) => {
      const code = b.dataset.code;
      window.location = `/code/${code}`;
    };
  });
  document.querySelectorAll(".delete-btn").forEach((b) => {
    b.onclick = async (e) => {
      if (!confirm("Delete this link?")) return;
      const code = b.dataset.code;
      const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
      if (res.ok) {
        renderList(el("search").value);
      } else {
        alert("Delete failed");
      }
    };
  });
}

async function createHandler(e) {
  e.preventDefault();
  const url = el("url").value.trim();
  const code = el("code").value.trim();
  const title = el("title").value.trim();
  el("url-error").classList.add("hidden");
  el("create-success").classList.add("hidden");
  el("create-fail").classList.add("hidden");
  // basic validation
  if (!url) {
    el("url-error").textContent = "URL is required";
    el("url-error").classList.remove("hidden");
    return;
  }
  try {
    new URL(url);
  } catch (err) {
    el("url-error").textContent = "Invalid URL";
    el("url-error").classList.remove("hidden");
    return;
  }
  el("create-btn").disabled = true;
  el("create-btn").textContent = "Creating...";
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, code: code || undefined, title }),
    });
    if (res.status === 201) {
      const data = await res.json();
      el("create-success").textContent = `Created ${data.code} — ${shortUrl(
        data.code
      )}`;
      el("create-success").classList.remove("hidden");
      el("url").value = "";
      el("code").value = "";
      el("title").value = "";
      renderList(el("search").value);
    } else {
      const err = await res.json();
      el("create-fail").textContent = err.error || "Create failed";
      el("create-fail").classList.remove("hidden");
    }
  } catch (err) {
    el("create-fail").textContent = "Network error";
    el("create-fail").classList.remove("hidden");
  } finally {
    el("create-btn").disabled = false;
    el("create-btn").textContent = "Create";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderList();
  el("create-form").addEventListener("submit", createHandler);
  el("refresh").addEventListener("click", () => renderList(el("search").value));
  el("search").addEventListener("input", (e) => renderList(e.target.value));
});
