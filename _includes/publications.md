<h2 id="publications" style="margin: 2px 0px -15px;">Publications</h2>

<p style="font-size:12px; color:gray; margin-bottom: 20px;">
  † : equal contribution.
</p>

<div class="publications">
<ol class="bibliography">

{% for link in site.data.publications.main %}

<li>
  <div class="pub-row row" style="margin-bottom: 15px;">
    <!-- 图像部分 -->
    <div class="col-sm-3 abbr" style="padding-right: 15px; padding-left: 15px;">
      {% if link.image %} 
      <img src="{{ link.image }}" 
           class="teaser img-fluid z-depth-1 fixed-image" 
           alt="Publication Image">
      {% if link.conference_short %} 
      <abbr class="badge">{{ link.conference_short }}</abbr>
      {% endif %}
      {% endif %}
    </div>
    <!-- 文本部分 -->
    <div class="col-sm-9" style="padding-right: 15px; padding-left: 20px;">
      <div class="title"><a href="{{ link.pdf }}">{{ link.title }}</a></div>
      <div class="author">{{ link.authors }}</div>
      <div class="periodical"><em>{{ link.conference }}</em></div>
      <!-- 链接按钮 -->
      <div class="links">
        {% if link.pdf %} 
        <a href="{{ link.pdf }}" class="btn btn-sm z-depth-0" role="button" target="_blank">PDF</a>
        {% endif %}
        {% if link.code %} 
        <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank">Code</a>
        {% endif %}
        {% if link.page %} 
        <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank">Project Page</a>
        {% endif %}
        {% if link.bibtex %} 
        <a href="{{ link.bibtex }}" class="btn btn-sm z-depth-0" role="button" target="_blank">BibTex</a>
        {% endif %}
        {% if link.notes %} 
        <strong><i style="color:#e74d3c">{{ link.notes }}</i></strong>
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
