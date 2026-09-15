async function loadPlaces() {
  const status = document.getElementById('status');
  const list = document.getElementById('places-list');

  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('data.json returned ' + res.status);
    const data = await res.json();

    status.textContent = `${data.places.length} place(s) — data generated ${data.generatedAt}`;

    data.places.forEach(place => {
      const li = document.createElement('li');
      li.className = 'place';

      const websiteLink = place.website
        ? `<a href="${place.website}" target="_blank" rel="noopener">${place.website}</a>`
        : '—';

      li.innerHTML = `
        <h2>${place.name}</h2>
        <dl>
          <dt>Type</dt><dd>${place.primaryType}</dd>
          <dt>Area</dt><dd>${place.area}</dd>
          <dt>Age suitability</dt><dd>${place.ageSuitability.join(', ')}</dd>
          <dt>Price</dt><dd>${place.priceInfo}</dd>
          <dt>Opening hours</dt><dd>${place.openingHours}</dd>
          <dt>Address</dt><dd>${place.address}</dd>
          <dt>Website</dt><dd>${websiteLink}</dd>
          <dt>Tags</dt><dd class="tags">${place.tags.join(', ')}</dd>
        </dl>
      `;

      list.appendChild(li);
    });
  } catch (err) {
    status.textContent = 'Could not load data.json: ' + err.message;
  }
}

loadPlaces();
