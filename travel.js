document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.querySelector(".search-bar");
  const searchInput = searchForm ? searchForm.querySelector('input[type="text"]') : null;
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "recommendation-results";
  resultsContainer.style.maxWidth = "900px";
  resultsContainer.style.margin = "40px auto 0 auto";
  resultsContainer.style.display = "flex";
  resultsContainer.style.flexWrap = "wrap";
  resultsContainer.style.gap = "30px";
  resultsContainer.style.justifyContent = "center";
  document.body.appendChild(resultsContainer);

  let recommendations = [];

  fetch("travel_recommendation_api.json")
    .then((response) => response.json())
    .then((data) => {
      const recs = [];

      if (Array.isArray(data.beaches)) {
        data.beaches.forEach((b) => {
          recs.push({
            name: b.name,
            imageUrl: b.imageUrl,
            description: b.description,
            type: "beach",
            country: b.name.split(", ").pop() || "",
          });
        });
      }

      if (Array.isArray(data.temples)) {
        data.temples.forEach((t) => {
          recs.push({
            name: t.name,
            imageUrl: t.imageUrl,
            description: t.description,
            type: "temple",
            country: t.name.split(", ").pop() || "",
          });
        });
      }

      if (Array.isArray(data.countries)) {
        data.countries.forEach((c) => {
          if (Array.isArray(c.cities)) {
            c.cities.forEach((city) => {
              recs.push({
                name: city.name,
                imageUrl: city.imageUrl,
                description: city.description,
                type: "country",
                country: c.name,
              });
            });
          }
        });
      }
      recommendations = recs;
      console.log("Recommendation data:", recommendations);
    })
    .catch((error) => {
      console.error("Error loading JSON file:", error);
    });

  console.log(searchForm);

  // Search logic
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const keyword = searchInput.value.trim().toLowerCase();

      console.log(keyword);
      if (!keyword) return;
      showResults(keyword);
    });
    searchForm.addEventListener("reset", (e) => {
      clearResults();
    });
  }

  function normalizeWord(word) {
    return word
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  }

  function showResults(keyword) {
    clearResults();
    if (!recommendations.length) return;
    console.log(recommendations);
    const keys = [
      { base: "beach", variants: ["beach", "beaches"] },
      { base: "temple", variants: ["temple", "temples"] },
    ];
    let type = null;
    const keywordNorm = normalizeWord(keyword);
    for (const key of keys) {
      if (key.variants.some((v) => normalizeWord(v) === keywordNorm)) {
        type = key.base;
        break;
      }
    }
    let results = [];
    if (type) {
      results = recommendations.filter((r) => r.type === type);
    } else {
      results = recommendations.filter((r) => normalizeWord(r.country).includes(keywordNorm));
    }
    if (!results.length) {
      resultsContainer.innerHTML =
        '<div style="color:#fff;background:rgba(0,0,0,0.7);padding:20px;border-radius:10px;">No results found for "' +
        keyword +
        '".</div>';
      return;
    }
    results.slice(0, 4).forEach((rec) => {
      const card = document.createElement("div");
      card.style.background = "rgba(255,255,255,0.95)";
      card.style.borderRadius = "10px";
      card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      card.style.width = "320px";
      card.style.overflow = "hidden";
      card.innerHTML = `
                <img src="${rec.imageUrl}" alt="${rec.name}" style="width:100%;height:180px;object-fit:cover;">
                <div style="padding:18px;">
                    <h3 style="margin-top:0;">${rec.name}</h3>
                    <p style="margin:10px 0;">${rec.description}</p>
                    <p style="font-size:0.95em;color:#888;">${
                      rec.type ? "Type: " + rec.type.charAt(0).toUpperCase() + rec.type.slice(1) : ""
                    } ${rec.country ? " | Country: " + rec.country : ""}</p>
                    <div class="local-time" data-country="${rec.country}" data-zone="${rec.timeZone || ""}"></div>
                </div>
            `;
      resultsContainer.appendChild(card);

      if (rec.timeZone) {
        showLocalTime(card.querySelector(".local-time"), rec.timeZone, rec.country);
      }
    });
  }

  function clearResults() {
    resultsContainer.innerHTML = "";
  }

  const clearBtn = searchForm ? searchForm.querySelector(".clear-btn") : null;
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (searchInput) searchInput.value = "";
      clearResults();
    });
  }

  function showLocalTime(element, timeZone, country) {
    if (!element || !timeZone) return;
    const options = { timeZone, hour12: true, hour: "numeric", minute: "numeric", second: "numeric" };
    function updateTime() {
      const time = new Date().toLocaleTimeString("en-US", options);
      element.textContent = `Local time in ${country}: ${time}`;
    }
    updateTime();
    setInterval(updateTime, 1000);
  }
});
