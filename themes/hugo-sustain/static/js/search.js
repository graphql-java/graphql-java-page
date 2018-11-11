var client = algoliasearch('QN236PQQTM', '0276fb4f826a5fd0554d70b20bd3741b');

var blogs = client.initIndex('blog');
var documentation = client.initIndex('documentation');

autocomplete(
  '#aa-search-input',
  {
    debug: true,
    templates: {
      dropdownMenu:
        '<div class="aa-dataset-blogs"></div>' +
        '<div class="aa-dataset-documentation"></div>',
        footer: '<div class="aa-footer" />'
    },
  },
  [
    {
      source: autocomplete.sources.hits(blogs, {hitsPerPage: 3}),
      displayKey: 'title',
      name: 'blogs',
      templates: {
        header: '<div class="aa-suggestions-category">Blogs</div>',
        suggestion: function(suggestion) {
          return (
            '<span class="aa-suggestion-title">' +
            suggestion._highlightResult.title.value +
            '</span><span class="aa-suggestion-content">' +
            suggestion._highlightResult.content.value +
            '</span>'
          );
        },
        empty: '<div class="aa-empty">No matching blogs</div>',
      },
    },
    {
      source: autocomplete.sources.hits(documentation, {hitsPerPage: 5}),
      displayKey: 'title',
      name: 'documentation',
      templates: {
        header: '<div class="aa-suggestions-category">Documentation</div>',
        suggestion: function(suggestion) {
          return (
            '<span class="aa-documentation-version">v' + suggestion.version + '</span>' +
            '<span class="aa-suggestion-title">' +
            suggestion._highlightResult.title.value +
            '</span><span class="aa-suggestion-content">' +
            suggestion._highlightResult.content.value +
            '</span>'
          );
        },
        empty: '<div class="aa-empty">No matching documentation</div>',
      },
    },
  ]
)
.on('autocomplete:selected', function(event, suggestion, dataset) {
        window.location.assign('/documentation/v10/getting-started/');
  });
