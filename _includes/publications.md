<h2 id="publications">Publications</h2>

<p class="publication-note">
  <a href="https://scholar.google.com/citations?user=YTyykuMAAAAJ&hl=en" target="_blank" rel="noopener">[Google Scholar]</a>
  <span>(† denotes equal contribution)</span>
</p>

<div class="publications">
  <ol class="publication-list">
    {% for link in site.data.publications.main %}
    <li class="publication-item">
      <div class="publication-label">
        {{ link.conference | strip_html }}
      </div>

      <div class="publication-body">
        <div class="publication-title">
          {% if link.pdf %}
          <a href="{{ link.pdf }}" target="_blank" rel="noopener">{{ link.title }}</a>
          {% else %}
          {{ link.title }}
          {% endif %}
        </div>
        <div class="publication-authors">{{ link.authors }}</div>
        <div class="publication-venue">{{ link.conference }}</div>

        <div class="publication-links">
          {% if link.pdf %}
          <a href="{{ link.pdf }}" target="_blank" rel="noopener">PDF</a>
          {% endif %}
          {% if link.code %}
          <a href="{{ link.code }}" target="_blank" rel="noopener">Code</a>
          {% endif %}
          {% if link.page %}
          <a href="{{ link.page }}" target="_blank" rel="noopener">Project Page</a>
          {% endif %}
          {% if link.bibtex %}
          <a href="{{ link.bibtex }}" target="_blank" rel="noopener">BibTeX</a>
          {% endif %}
          {% if link.notes %}
          <span class="publication-note-label">{{ link.notes }}</span>
          {% endif %}
          {% if link.others %}
          <span class="publication-extra">{{ link.others }}</span>
          {% endif %}
        </div>
      </div>
    </li>
    {% endfor %}
  </ol>
</div>

{% if site.data.publications.preprint and site.data.publications.preprint.size > 0 %}
<h2 id="preprints">Preprints</h2>

<div class="preprints">
  {% for link in site.data.publications.preprint %}
  <div class="preprint-item">
    <div class="preprint-title">{{ link.title }}</div>
    <div class="preprint-authors">{{ link.authors }}</div>
    <div class="preprint-year">{{ link.year }}</div>
  </div>
  {% endfor %}
</div>
{% endif %}
