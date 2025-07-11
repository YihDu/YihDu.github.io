## Experience

<div class="experience-container">
  {% for item in site.data.experience %}
  <div class="experience-item">
    <div class="experience-details">
      <b style="color: #043361;"><a href="{{ item.institution_url }}">{{ item.institution }}</a></b><br>
      <a href="{{ item.url }}">{{ item.title }}</a><br>
      {{ item.description }}
    </div>
    <div class="experience-date">
      <i>{{ item.dates }}</i>
    </div>
  </div>
  {% endfor %}
</div>

<style>
  .experience-container {
    margin-bottom: 1.5em;
  }
  .experience-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1em;
  }
  .experience-details {
    flex-grow: 1;
  }
  .experience-date {
    padding-left: 2em;
    text-align: right;
    white-space: nowrap;
    color: #666;
  }
</style>
