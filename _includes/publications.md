<h2 id="publications" style="margin: 2px 0px 15px;">Publications</h2><a id="publications"></a>

<p style="font-size:16px; margin-bottom: 1px;">
  <a href="https://scholar.google.com/citations?user=YTyykuMAAAAJ&hl=en" target="_blank">[Google Scholar]</a>
  <span style="font-size:16px; color:gray; margin-bottom: 6px;">(† denotes equal contribution)</span>
</p>

<div class="publications">
<ol class="bibliography">

{% for link in site.data.publications.main %}

<li>
<div class="pub-row">
  <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
    <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
            <abbr class="badge">{{ link.conference_short }}</abbr>
  </div>
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
      <div class="title"><a href="{{ link.pdf }}">{{ link.title }}</a></div>
      <div class="author">{{ link.authors }}</div>
      <div class="periodical">{{ link.conference }}
      </div>
    <div class="links">
      {% if link.pdf %} 
      <a href="{{ link.pdf }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">PDF</a>
      {% endif %}
      {% if link.code %} 
      <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Code</a>
      {% endif %}
      {% if link.page %} 
      <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Project Page</a>
      {% endif %}
      {% if link.bibtex %} 
      <a href="{{ link.bibtex }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">BibTex</a>
      {% endif %}
      {% if link.notes %} 
      <strong> <i style="color:#e74d3c">{{ link.notes }}</i></strong>
      {% endif %}
      {% if link.others %} 
      {{ link.others }}
      {% endif %}
    </div>
  </div>
</div>
</li>
<br>

{% endfor %}

</ol>
</div>

<h2 id="preprints" style="margin: 2px 0px 15px;">Preprints</h2><a id="preprints"></a>

<div class="preprints" style="list-style: none; padding-left: 0;">
{% for link in site.data.publications.preprint %}
<div style="margin-bottom: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
  <div class="title" style="font-weight: bold;">{{ link.title }}</div>
  <div>{{ link.authors }}</div>
  <div>{{ link.year }}</div>
</div>
{% endfor %}
</div>