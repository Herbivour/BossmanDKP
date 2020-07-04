function updateFilters(event) {
  const name = event.target.name;
  const checked = event.target.checked;
  if (!name) { return;}
  const l = window.location.href;
  const filterMatch = l.match(/&?f=([^&$]+)/i);
  let filterSettings = {};
  if (filterMatch && filterMatch[1]) {
    try {
      filterSettings = JSON.parse(
        decodeURI(filterMatch[1])
      );
    } catch (e) {
      console.error('Error parsing filter settings', e);
    }
  }
  if (checked) { 
    filterSettings[name] = checked;
  } else {
    delete filterSettings[name];
  }
  const newFilterStr = encodeURI(
    JSON.stringify(filterSettings)
  );
  if (filterMatch) {
    window.location.href = l.replace(/(&?f=)([^&$]+)/i, `$1${newFilterStr}`);
  } else {
    if (window.location.href.indexOf('?') === -1) {
      window.location.href += `?f=${newFilterStr}`;
    } else {
      window.location.href += `&f=${newFilterStr}`;
    }
  }
}

function onChange(event) {
  if (event.target && event.target.className) {
    // super basic.  Could do a better job with jQuery, but im lasy.
    switch(event.target.className) {
    case 'js--toggle-filter':
      updateFilters(event);
      break;
    }
  }
}
document.addEventListener(
  'change',
  onChange
);